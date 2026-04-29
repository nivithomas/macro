import { NextRequest } from 'next/server'
import { supabase, toPortfolioRecord, now, type DbPortfolio } from '@/lib/supabase'
import type { StockInfo } from '@/lib/types'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { data, error } = await supabase.from('portfolio').select('*').eq('id', id).single()
  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(toPortfolioRecord(data as DbPortfolio))
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await request.json() as { name?: string; tickers?: StockInfo[] }
  const patch: Record<string, string> = { updated_at: now() }
  if (body.name) patch.name = body.name
  if (body.tickers) patch.tickers = JSON.stringify(body.tickers)
  const { data, error } = await supabase
    .from('portfolio')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(toPortfolioRecord(data as DbPortfolio))
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { error } = await supabase.from('portfolio').delete().eq('id', id)
  if (error) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({ ok: true })
}
