import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { StockInfo } from '@/lib/types'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const portfolio = await prisma.portfolio.findUnique({ where: { id } })
  if (!portfolio) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({
    ...portfolio,
    tickers: JSON.parse(portfolio.tickers) as StockInfo[],
    createdAt: portfolio.createdAt.toISOString(),
    updatedAt: portfolio.updatedAt.toISOString(),
  })
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await request.json() as { name?: string; tickers?: StockInfo[] }
  const data: Record<string, string> = {}
  if (body.name) data.name = body.name
  if (body.tickers) data.tickers = JSON.stringify(body.tickers)
  const portfolio = await prisma.portfolio.update({ where: { id }, data })
  return Response.json({
    ...portfolio,
    tickers: JSON.parse(portfolio.tickers) as StockInfo[],
    createdAt: portfolio.createdAt.toISOString(),
    updatedAt: portfolio.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  await prisma.portfolio.delete({ where: { id } })
  return Response.json({ ok: true })
}
