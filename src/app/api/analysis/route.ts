import { NextRequest } from 'next/server'
import { supabase, toAnalysisRecord, type DbAnalysis } from '@/lib/supabase'
import type { StockInfo } from '@/lib/types'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('analysis')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw error
    return Response.json((data as DbAnalysis[]).map(toAnalysisRecord))
  } catch (err) {
    console.error('[GET /api/analysis]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      macroTrend: string
      stockUniverse: StockInfo[]
      duration?: string
      portfolioId?: string
    }
    const { macroTrend, stockUniverse, duration, portfolioId } = body
    if (!macroTrend || !Array.isArray(stockUniverse) || stockUniverse.length === 0) {
      return Response.json({ error: 'macroTrend and stockUniverse are required' }, { status: 400 })
    }
    const id = crypto.randomUUID()
    const { error } = await supabase.from('analysis').insert({
      id,
      macro_trend: macroTrend,
      duration: duration ?? '1-3 months',
      stock_universe: JSON.stringify(stockUniverse),
      portfolio_id: portfolioId ?? null,
    })
    if (error) throw error
    return Response.json({ id })
  } catch (err) {
    console.error('[POST /api/analysis]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
