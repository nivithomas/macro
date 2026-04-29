import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { identifyIndicators, analyzeStockImpact, estimateIndicatorDirections, classifyScenarioType, type IndicatorDirection } from '@/lib/claude'
import { getCompanyProfile, getHistoricalPrices } from '@/lib/yahoo-finance'
import { computeCorrelation, computeImpactScore } from '@/lib/correlation'
import type { StockInfo, Indicator, StockResult, SSEEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const analysis = await prisma.analysis.findUnique({ where: { id } })
  if (!analysis) return Response.json({ error: 'Not found' }, { status: 404 })
  if (analysis.status === 'complete' || analysis.status === 'error') {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        if (analysis.results) {
          const results = JSON.parse(analysis.results) as StockResult[]
          for (const result of results) {
            controller.enqueue(encoder.encode(sseMessage({ type: 'result', result })))
          }
        }
        controller.enqueue(encoder.encode(sseMessage({ type: 'complete' })))
        controller.close()
      },
    })
    return new Response(stream, { headers: sseHeaders() })
  }

  const stockUniverse = JSON.parse(analysis.stockUniverse) as StockInfo[]
  const duration = analysis.duration ?? '1-3 months'
  const encoder = new TextEncoder()
  const accumulatedResults: StockResult[] = []

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(sseMessage(event)))
      }

      try {
        await prisma.analysis.update({ where: { id }, data: { status: 'running' } })

        // Step 1: Classify scenario + identify indicators
        send({ type: 'step', message: 'Identifying relevant market indicators…', step: 1, total: 4 })
        const scenarioMeta = await classifyScenarioType(analysis.macroTrend).catch(() => ({
          scenarioType: 'other' as const,
          quantReliable: false,
          quantWarning: 'Scenario classification failed — treat scores as indicative only.',
        }))
        let indicators: Indicator[] = []
        try {
          indicators = await identifyIndicators(analysis.macroTrend)
        } catch {
          indicators = []
        }
        await prisma.analysis.update({ where: { id }, data: { indicators: JSON.stringify(indicators) } })
        send({ type: 'indicators', indicators })

        // Step 2: Fetch indicator price history
        send({ type: 'step', message: 'Fetching historical price data…', step: 2, total: 4 })
        const indicatorPrices = new Map<string, Awaited<ReturnType<typeof getHistoricalPrices>>>()
        await Promise.all(
          indicators.map(async (ind) => {
            try {
              const prices = await getHistoricalPrices(ind.ticker)
              indicatorPrices.set(ind.ticker, prices)
            } catch {
              indicatorPrices.set(ind.ticker, [])
            }
          }),
        )

        // Step 3: Estimate directional impact of each indicator
        send({ type: 'step', message: 'Estimating indicator directions…', step: 3, total: 4 })
        let directions: Record<string, IndicatorDirection> = {}
        try {
          directions = await estimateIndicatorDirections(analysis.macroTrend, indicators)
        } catch {
          directions = {}
        }

        // Step 4: Analyze each stock
        send({ type: 'step', message: `Analyzing ${stockUniverse.length} stocks…`, step: 4, total: 4 })

        for (const stock of stockUniverse) {
          try {
            const [profile, stockPrices] = await Promise.all([
              getCompanyProfile(stock.ticker),
              getHistoricalPrices(stock.ticker),
            ])

            // Compute base correlations (log returns, normalized chart data)
            const baseCorrelations = indicators.map((ind) => {
              const indPrices = indicatorPrices.get(ind.ticker) ?? []
              const corr = computeCorrelation(stockPrices, indPrices, ind.ticker, ind.name)
              const dir = directions[ind.ticker]
              return {
                ...corr,
                direction: dir?.direction ?? 0,
                directionReasoning: dir?.reasoning,
              }
            })

            // Weak-link detection: flag if max |r| across all indicators is below threshold
            const maxAbsR = baseCorrelations.reduce((m, c) => Math.max(m, Math.abs(c.correlation)), 0)
            const weakCausalLink = maxAbsR < 0.15

            // Claude analysis: returns indicator classifications + mismatch flags + narrative
            // Streams reasoning text back as thinking events so the UI can show live progress
            const stockAnalysis = await analyzeStockImpact(
              analysis.macroTrend,
              duration,
              profile,
              baseCorrelations,
              (ticker, snippet) => send({ type: 'thinking', ticker, snippet }),
            )

            // Enrich correlations with classifications and mismatch warnings from Claude
            const correlations = baseCorrelations.map((c) => ({
              ...c,
              indicatorClassification: stockAnalysis.indicatorClassifications[c.indicatorTicker],
              correlationMismatchWarning: stockAnalysis.demandDrivenInSupplyShock[c.indicatorTicker] ?? false,
            }))

            // Compute weighted impact score using enriched correlations
            const scoreOrNull = computeImpactScore(correlations)
            const impactScore = scoreOrNull ?? 0

            const result: StockResult = {
              ticker: stock.ticker,
              name: profile.name,
              sector: profile.sector ?? stock.sector,
              correlations,
              impactScore,
              weakCausalLink,
              quantReliable: scenarioMeta.quantReliable,
              quantWarning: scenarioMeta.quantWarning,
              confidence: stockAnalysis.confidence,
              timeHorizon: stockAnalysis.timeHorizon,
              historicalPatterns: stockAnalysis.historicalPatterns,
              businessModel: stockAnalysis.businessModel,
              supplyChain: stockAnalysis.supplyChain,
              overallReasoning: stockAnalysis.overallReasoning,
              historicalAnalog: stockAnalysis.historicalAnalog,
              hedgeBookNote: stockAnalysis.hedgeBookNote ?? undefined,
              epsSensitivity: stockAnalysis.epsSensitivity ?? undefined,
              ...(scoreOrNull === null ? {
                error: 'Direction estimation failed — score unavailable',
                confidence: 'low' as const,
              } : {}),
              ...(stockAnalysis.error ? { error: stockAnalysis.error } : {}),
            }
            accumulatedResults.push(result)
            send({ type: 'result', result })

            await prisma.analysis.update({
              where: { id },
              data: { results: JSON.stringify(accumulatedResults) },
            })
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            const result: StockResult = {
              ticker: stock.ticker,
              name: stock.name,
              sector: stock.sector,
              impactScore: 0,
              confidence: 'low',
              correlations: [],
              historicalPatterns: { summary: 'Data unavailable', detail: '', impact: 'neutral' },
              businessModel: { summary: 'Data unavailable', detail: '', impact: 'neutral' },
              supplyChain: { summary: 'Data unavailable', detail: '', impact: 'neutral' },
              overallReasoning: '',
              quantReliable: scenarioMeta.quantReliable,
              quantWarning: scenarioMeta.quantWarning,
              error: message,
            }
            accumulatedResults.push(result)
            send({ type: 'result', result })
          }
        }

        await prisma.analysis.update({ where: { id }, data: { status: 'complete' } })
        send({ type: 'complete' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await prisma.analysis.update({ where: { id }, data: { status: 'error', errorMessage: message } })
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: sseHeaders() })
}

function sseMessage(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  }
}
