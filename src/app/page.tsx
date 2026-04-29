'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { StockInfo, PortfolioRecord } from '@/lib/types'
import { TickerSearch } from '@/components/TickerSearch'
import { SectorFilter } from '@/components/SectorFilter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Tab = 'custom' | 'sector'

function HomePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [trend, setTrend] = useState('')
  const [duration, setDuration] = useState('1-3 months')
  const [tab, setTab] = useState<Tab>('custom')
  const [selected, setSelected] = useState<StockInfo[]>([])
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([])
  const [portfolioName, setPortfolioName] = useState('')
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const loadPortfolioById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/portfolios/${id}`)
      if (res.ok) {
        const data = await res.json() as PortfolioRecord
        setSelected(data.tickers)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetch('/api/portfolios')
      .then((r) => r.json())
      .then((data: PortfolioRecord[]) => setPortfolios(data))
      .catch(() => {})
    const portfolioId = searchParams.get('portfolio')
    if (portfolioId) loadPortfolioById(portfolioId)
  }, [searchParams, loadPortfolioById])

  const addStock = (stock: StockInfo) => {
    setSelected((prev) => prev.find((s) => s.ticker === stock.ticker) ? prev : [...prev, stock])
  }
  const removeStock = (ticker: string) => setSelected((prev) => prev.filter((s) => s.ticker !== ticker))
  const toggleStock = (stock: StockInfo) => {
    setSelected((prev) =>
      prev.find((s) => s.ticker === stock.ticker)
        ? prev.filter((s) => s.ticker !== stock.ticker)
        : [...prev, stock],
    )
  }
  const selectAll = (stocks: StockInfo[]) => {
    setSelected((prev) => {
      const existing = new Set(prev.map((s) => s.ticker))
      const additions = stocks.filter((s) => !existing.has(s.ticker))
      return [...prev, ...additions]
    })
  }

  const savePortfolio = async () => {
    if (!portfolioName.trim() || selected.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: portfolioName.trim(), tickers: selected }),
      })
      const data = await res.json() as PortfolioRecord
      setPortfolios((prev) => [data, ...prev])
      setPortfolioName('')
    } finally {
      setSaving(false)
    }
  }

  const runAnalysis = async () => {
    if (!trend.trim() || selected.length === 0) return
    setError('')
    setRunning(true)
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ macroTrend: trend.trim(), stockUniverse: selected, duration }),
      })
      const data = await res.json() as { id: string }
      router.push(`/analysis/${data.id}`)
    } catch {
      setError('Failed to start analysis. Check your API key and try again.')
      setRunning(false)
    }
  }

  const canRun = trend.trim().length > 5 && selected.length > 0 && !running

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Macro Impact Analyzer</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Enter a macro trend, select stocks, and get AI-powered impact analysis.
        </p>
      </div>

      {/* Step 1: Trend */}
      <Card>
        <div className="px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-semibold shrink-0">1</span>
            <h2 className="font-semibold text-zinc-900 text-sm">Macro trend</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <textarea
            value={trend}
            onChange={(e) => setTrend(e.target.value)}
            placeholder="e.g. Colombia stops exporting coffee due to political instability"
            rows={3}
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none transition-colors"
          />
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Shock duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            >
              <option value="1-4 weeks">1–4 weeks</option>
              <option value="1-3 months">1–3 months</option>
              <option value="6-12 months">6–12 months</option>
              <option value="12+ months">12+ months</option>
            </select>
            <p className="mt-1 text-xs text-zinc-400">
              Used to reason about hedging buffers — short shocks are absorbed by existing contracts; long shocks flow through to unhedged volumes.
            </p>
          </div>
        </div>
      </Card>

      {/* Step 2: Stocks */}
      <Card>
        <div className="px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-semibold shrink-0">2</span>
            <h2 className="font-semibold text-zinc-900 text-sm">Stock universe</h2>
            {selected.length > 0 && (
              <span className="ml-auto text-xs text-zinc-400">{selected.length} selected</span>
            )}
          </div>
        </div>
        <div className="p-6 space-y-4">
          {/* Tab switcher */}
          <div className="flex bg-zinc-100 rounded-lg p-1 gap-1">
            {(['custom', 'sector'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-md text-sm transition-all ${
                  tab === t
                    ? 'bg-white text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {t === 'custom' ? 'Custom tickers' : 'By sector & region'}
              </button>
            ))}
          </div>

          {tab === 'custom' && (
            <TickerSearch selected={selected} onAdd={addStock} onRemove={removeStock} />
          )}
          {tab === 'sector' && (
            <SectorFilter
              selected={selected}
              onToggle={toggleStock}
              onSelectAll={selectAll}
              onClearAll={() => setSelected([])}
            />
          )}
        </div>
      </Card>

      {/* Step 3: Portfolio */}
      <Card>
        <div className="px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-semibold shrink-0">3</span>
            <h2 className="font-semibold text-zinc-900 text-sm">Portfolio</h2>
            <span className="text-xs text-zinc-400">(optional)</span>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {portfolios.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Load saved portfolio</label>
              <select
                defaultValue=""
                onChange={(e) => loadPortfolioById(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              >
                <option value="" disabled>Choose a portfolio…</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.tickers.length} stocks)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="Save current selection as…"
              className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
            <Button
              onClick={savePortfolio}
              disabled={!portfolioName.trim() || selected.length === 0 || saving}
              variant="secondary"
              size="md"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Run */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex items-center gap-3">
        <Button onClick={runAnalysis} disabled={!canRun} size="lg">
          {running ? 'Starting…' : `Run analysis${selected.length > 0 ? ` (${selected.length} stocks)` : ''}`}
        </Button>
        {selected.length === 0 && (
          <span className="text-sm text-zinc-400">Select at least one stock to continue</span>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  )
}
