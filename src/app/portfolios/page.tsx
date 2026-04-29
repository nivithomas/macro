'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { PortfolioRecord } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const res = await fetch('/api/portfolios')
    const data = await res.json() as PortfolioRecord[]
    setPortfolios(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const deletePortfolio = async (id: string) => {
    await fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
    setPortfolios((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) return <p className="text-gray-500">Loading…</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saved portfolios</h1>
        <Link href="/">
          <Button variant="secondary" size="sm">+ New analysis</Button>
        </Link>
      </div>

      {portfolios.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No portfolios saved yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Create one from the <Link href="/" className="text-blue-400 hover:underline">analysis page</Link>.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-gray-900 font-semibold">{portfolio.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {portfolio.tickers.length} stocks · Updated {new Date(portfolio.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {portfolio.tickers.slice(0, 12).map((s) => (
                      <span key={s.ticker} className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {s.ticker}
                      </span>
                    ))}
                    {portfolio.tickers.length > 12 && (
                      <span className="text-xs text-gray-600 px-2 py-0.5">
                        +{portfolio.tickers.length - 12} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/?portfolio=${portfolio.id}`}>
                    <Button variant="secondary" size="sm">Load</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePortfolio(portfolio.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
