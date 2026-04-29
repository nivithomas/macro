import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { StockInfo } from '@/lib/types'

export async function GET() {
  const portfolios = await prisma.portfolio.findMany({
    orderBy: { updatedAt: 'desc' },
  })
  return Response.json(
    portfolios.map((p: typeof portfolios[0]) => ({
      ...p,
      tickers: JSON.parse(p.tickers) as StockInfo[],
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { name: string; tickers: StockInfo[] }
  const { name, tickers } = body
  if (!name || !Array.isArray(tickers)) {
    return Response.json({ error: 'name and tickers are required' }, { status: 400 })
  }
  const portfolio = await prisma.portfolio.create({
    data: { name, tickers: JSON.stringify(tickers) },
  })
  return Response.json({
    ...portfolio,
    tickers,
    createdAt: portfolio.createdAt.toISOString(),
    updatedAt: portfolio.updatedAt.toISOString(),
  })
}
