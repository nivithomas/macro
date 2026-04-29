import { NextRequest } from 'next/server'
import { supabase, toAnalysisRecord, type DbAnalysis } from '@/lib/supabase'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data, error } = await supabase
    .from('analysis')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(toAnalysisRecord(data as DbAnalysis))
}
