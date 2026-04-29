import { NextRequest } from 'next/server'
import { searchTickers } from '@/lib/yahoo-finance'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return Response.json([])
  const results = await searchTickers(q)
  return Response.json(results)
}
