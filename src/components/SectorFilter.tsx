'use client'

import { useState } from 'react'
import type { StockInfo } from '@/lib/types'
import { REGIONS, SECTORS } from '@/lib/types'
import { Button } from './ui/Button'

interface SectorFilterProps {
  selected: StockInfo[]
  onToggle: (stock: StockInfo) => void
  onSelectAll: (stocks: StockInfo[]) => void
  onClearAll: () => void
}

export function SectorFilter({ selected, onToggle, onSelectAll, onClearAll }: SectorFilterProps) {
  const [region, setRegion] = useState('north-america')
  const [sector, setSector] = useState('Consumer Defensive')
  const [stocks, setStocks] = useState<StockInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const selectedSet = new Set(selected.map((s) => s.ticker))

  const fetchStocks = async () => {
    setLoading(true)
    setFetched(false)
    try {
      const res = await fetch(
        `/api/stocks/sector?region=${encodeURIComponent(region)}&sector=${encodeURIComponent(sector)}`,
      )
      const data = await res.json() as StockInfo[]
      setStocks(data)
      setFetched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Region</label>
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setFetched(false) }}
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            {Object.entries(REGIONS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Sector</label>
          <select
            value={sector}
            onChange={(e) => { setSector(e.target.value); setFetched(false) }}
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          >
            {Object.keys(SECTORS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={fetchStocks} disabled={loading} variant="secondary" size="sm">
        {loading ? 'Loading…' : 'Fetch stocks'}
      </Button>

      {fetched && stocks.length === 0 && (
        <p className="text-zinc-500 text-sm">No stocks found for this combination.</p>
      )}

      {stocks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{stocks.length} stocks found</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onSelectAll(stocks)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Select all
              </button>
              <span className="text-zinc-300">·</span>
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-zinc-400 hover:text-zinc-600"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto border border-zinc-200 rounded-lg divide-y divide-zinc-100">
            {stocks.map((stock) => {
              const checked = selectedSet.has(stock.ticker)
              return (
                <label
                  key={stock.ticker}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(stock)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-mono text-xs font-semibold text-emerald-700 w-16 shrink-0">{stock.ticker}</span>
                  <span className="text-sm text-zinc-700 truncate">{stock.name}</span>
                  {stock.industry && (
                    <span className="text-xs text-zinc-400 ml-auto shrink-0">{stock.industry}</span>
                  )}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
