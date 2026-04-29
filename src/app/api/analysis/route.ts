import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { StockInfo } from '@/lib/types'

export async function GET() {
  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return Response.json(
      analyses.map((a: typeof analyses[0]) => ({
        ...a,
        duration: a.duration ?? null,
        stockUniverse: JSON.parse(a.stockUniverse) as StockInfo[],
        indicators: a.indicators ? JSON.parse(a.indicators) : null,
        results: a.results ? JSON.parse(a.results) : null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    )
  } catch (err) {
    console.error('[GET /api/analysis] error:', err instanceof Error ? err.stack : err)
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
    const analysis = await prisma.analysis.create({
      data: {
        macroTrend,
        duration: duration ?? '1-3 months',
        stockUniverse: JSON.stringify(stockUniverse),
        portfolioId: portfolioId ?? null,
      },
    })
    return Response.json({ id: analysis.id })
  } catch (err) {
    console.error('[POST /api/analysis] error:', err instanceof Error ? err.stack : err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
