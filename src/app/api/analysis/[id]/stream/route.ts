import { NextRequest } from 'next/server'
import { supabase, now, type DbAnalysis } from '@/lib/supabase'
import { identifyIndicators, analyzeStockImpact, estimateIndicatorDirections, classifyScenarioType, type IndicatorDirection } from '@/lib/claude'
import { getCompanyProfile, getHistoricalPrices } from '@/lib/yahoo-finance'
import { computeCorrelation, computeImpactScore } from '@/lib/correlation'
import type { StockInfo, Indicator, StockResult, SSEEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data, error } = await supabase.from('analysis').select('*').eq('id', id).single()
  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  const analysis = data as DbAnalysis

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

  const stockUniverse = JSON.parse(analysis.stock_universe) as StockInfo[]
  const duration = analysis.duration ?? '1-3 months'
  const encoder = new TextEncoder()
  const accumulatedResults: StockResult[] = []

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(sseMessage(event)))
      }

      try {
        await supabase.from('analysis').update({ status: 'running', updated_at: now() }).eq('id', id)

        // Step 1: Classify scenario + identify indicators
        send({ type: 'step', message: 'Identifying relevant market indicators…', step: 1, total: 4 })
        const scenarioMeta = await classifyScenarioType(analysis.macro_trend).catch(() => ({
          scenarioType: 'other' as const,
          quantReliable: false,
          quantWarning: 'Scenario classification failed — treat scores as indicative only.',
        }))
        let indicators: Indicator[] = []
        try {
          indicators = await identifyIndicators(analysis.macro_trend)
        } catch {
          indicators = []
        }
        await supabase.from('analysis').update({ indicators: JSON.stringify(indicators), updated_at: now() }).eq('id', id)
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
          directions = await estimateIndicatorDirections(analysis.macro_trend, indicators)
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

            const maxAbsR = baseCorrelations.reduce((m, c) => Math.max(m, Math.abs(c.correlation)), 0)
            const weakCausalLink = maxAbsR < 0.15

            const stockAnalysis = await analyzeStockImpact(
              analysis.macro_trend,
              duration,
              profile,
              baseCorrelations,
              (ticker, snippet) => send({ type: 'thinking', ticker, snippet }),
            )

            const correlations = baseCorrelations.map((c) => ({
              ...c,
              indicatorClassification: stockAnalysis.indicatorClassifications[c.indicatorTicker],
              correlationMismatchWarning: stockAnalysis.demandDrivenInSupplyShock[c.indicatorTicker] ?? false,
            }))

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
              hedgeBookExposureType: stockAnalysis.hedgeBookExposureType ?? undefined,
              epsSensitivity: stockAnalysis.epsSensitivity ?? undefined,
              ...(scoreOrNull === null ? {
                error: 'Direction estimation failed — score unavailable',
                confidence: 'low' as const,
              } : {}),
              ...(stockAnalysis.error ? { error: stockAnalysis.error } : {}),
            }
            accumulatedResults.push(result)
            send({ type: 'result', result })

            await supabase
              .from('analysis')
              .update({ results: JSON.stringify(accumulatedResults), updated_at: now() })
              .eq('id', id)
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

        await supabase.from('analysis').update({ status: 'complete', updated_at: now() }).eq('id', id)
        send({ type: 'complete' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await supabase
          .from('analysis')
          .update({ status: 'error', error_message: message, updated_at: now() })
          .eq('id', id)
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
