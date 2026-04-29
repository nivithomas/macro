import { NextRequest } from 'next/server'
import { supabase, toPortfolioRecord, type DbPortfolio } from '@/lib/supabase'
import type { StockInfo } from '@/lib/types'

export async function GET() {
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return Response.json({ error: 'Internal server error' }, { status: 500 })
  return Response.json((data as DbPortfolio[]).map(toPortfolioRecord))
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { name: string; tickers: StockInfo[] }
  const { name, tickers } = body
  if (!name || !Array.isArray(tickers)) {
    return Response.json({ error: 'name and tickers are required' }, { status: 400 })
  }
  const id = crypto.randomUUID()
  const { data, error } = await supabase
    .from('portfolio')
    .insert({ id, name, tickers: JSON.stringify(tickers) })
    .select()
    .single()
  if (error || !data) return Response.json({ error: 'Internal server error' }, { status: 500 })
  return Response.json(toPortfolioRecord(data as DbPortfolio))
}
