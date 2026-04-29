import { NextRequest } from 'next/server'
import { supabase, now, type DbAnalysis } from '@/lib/supabase'
import { generateBrief } from '@/lib/claude'
import type { StockResult, Indicator, AnalysisBrief } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data, error } = await supabase
    .from('analysis')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  const row = data as DbAnalysis

  if (row.status !== 'complete') {
    return Response.json({ error: 'Analysis not complete' }, { status: 400 })
  }

  // Return cached brief if already generated
  if (row.summary) {
    return Response.json(JSON.parse(row.summary) as AnalysisBrief)
  }

  const results = row.results ? (JSON.parse(row.results) as StockResult[]) : []
  const indicators = row.indicators ? (JSON.parse(row.indicators) as Indicator[]) : []
  const validResults = results.filter((r) => !r.error)
  if (validResults.length === 0) {
    return Response.json({ error: 'No valid results to summarise' }, { status: 422 })
  }

  const brief = await generateBrief(
    row.macro_trend,
    row.duration ?? '1-3 months',
    results,
    indicators,
  )

  await supabase
    .from('analysis')
    .update({ summary: JSON.stringify(brief), updated_at: now() })
    .eq('id', id)

  return Response.json(brief)
}
