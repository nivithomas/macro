import { NextRequest } from 'next/server'
import { getStocksBySector } from '@/lib/yahoo-finance'
import { REGIONS } from '@/lib/types'

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region') ?? 'north-america'
  const sector = request.nextUrl.searchParams.get('sector') ?? 'Consumer Defensive'

  const regionConfig = REGIONS[region]
  if (!regionConfig) return Response.json({ error: 'Invalid region' }, { status: 400 })

  const stocks = await getStocksBySector(regionConfig.codes, sector, 30)
  return Response.json(stocks)
}
