import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { StockInfo, Indicator, StockResult } from '@/lib/types'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const analysis = await prisma.analysis.findUnique({ where: { id } })
  if (!analysis) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json({
    ...analysis,
    stockUniverse: JSON.parse(analysis.stockUniverse) as StockInfo[],
    indicators: analysis.indicators ? (JSON.parse(analysis.indicators) as Indicator[]) : null,
    results: analysis.results ? (JSON.parse(analysis.results) as StockResult[]) : null,
    brief: analysis.summary ? JSON.parse(analysis.summary) : null,
    createdAt: analysis.createdAt.toISOString(),
    updatedAt: analysis.updatedAt.toISOString(),
  })
}
