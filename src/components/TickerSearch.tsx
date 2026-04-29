'use client'

import { useState, useEffect, useRef } from 'react'
import type { StockInfo } from '@/lib/types'

interface TickerSearchProps {
  selected: StockInfo[]
  onAdd: (stock: StockInfo) => void
  onRemove: (ticker: string) => void
}

export function TickerSearch({ selected, onAdd, onRemove }: TickerSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StockInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedSet = new Set(selected.map((s) => s.ticker))

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 1) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`)
        const data = await res.json() as StockInfo[]
        setResults(data)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search ticker or company name…"
          className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-colors"
        />
        {loading && (
          <span className="absolute right-3 top-2.5 text-zinc-400 text-xs">searching…</span>
        )}
        {open && results.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-md max-h-56 overflow-y-auto">
            {results.map((stock) => (
              <li key={stock.ticker} className="border-b border-zinc-100 last:border-b-0">
                <button
                  type="button"
                  disabled={selectedSet.has(stock.ticker)}
                  onClick={() => { onAdd(stock); setQuery(''); setOpen(false) }}
                  className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 transition-colors"
                >
                  <span className="text-xs font-mono font-semibold text-emerald-700 w-16 shrink-0">{stock.ticker}</span>
                  <span className="text-sm text-zinc-600 truncate">{stock.name}</span>
                  {selectedSet.has(stock.ticker) && (
                    <span className="text-xs text-zinc-400 ml-auto shrink-0">added</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((stock) => (
            <span
              key={stock.ticker}
              className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-md px-2.5 py-1 text-sm"
            >
              <span className="font-mono text-xs font-semibold text-emerald-700">{stock.ticker}</span>
              <span className="text-zinc-400 text-xs">{stock.name}</span>
              <button
                type="button"
                onClick={() => onRemove(stock.ticker)}
                className="text-zinc-400 hover:text-red-500 ml-0.5 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
