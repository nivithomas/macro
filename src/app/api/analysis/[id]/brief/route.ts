import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateBrief } from '@/lib/claude'
import type { StockResult, Indicator, AnalysisBrief } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const analysis = await prisma.analysis.findUnique({ where: { id } })
  if (!analysis) return Response.json({ error: 'Not found' }, { status: 404 })
  if (analysis.status !== 'complete') {
    return Response.json({ error: 'Analysis not complete' }, { status: 400 })
  }

  // Return cached brief if already generated
  if (analysis.summary) {
    return Response.json(JSON.parse(analysis.summary) as AnalysisBrief)
  }

  const results = analysis.results ? (JSON.parse(analysis.results) as StockResult[]) : []
  const indicators = analysis.indicators ? (JSON.parse(analysis.indicators) as Indicator[]) : []
  const validResults = results.filter((r) => !r.error)
  if (validResults.length === 0) {
    return Response.json({ error: 'No valid results to summarise' }, { status: 422 })
  }

  const brief = await generateBrief(
    analysis.macroTrend,
    analysis.duration ?? '1-3 months',
    results,
    indicators,
  )

  await prisma.analysis.update({
    where: { id },
    data: { summary: JSON.stringify(brief) },
  })

  return Response.json(brief)
}
