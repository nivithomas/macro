'use client'

import { useState } from 'react'
import type { StockResult } from '@/lib/types'
import { ImpactCard } from './ImpactCard'

const DIMENSIONS = [
  { key: 'historicalPatterns' as const, label: 'Historical Patterns' },
  { key: 'businessModel'      as const, label: 'Business Model' },
  { key: 'supplyChain'        as const, label: 'Supply Chain' },
]

function scoreColor(score: number): string {
  const yellow = [234, 179, 8]
  const green  = [34,  197, 94]
  const orange = [249, 115, 22]
  const [from, to, t] = score >= 0
    ? [yellow, green,  Math.min(score / 5, 1)]
    : [yellow, orange, Math.min(Math.abs(score) / 5, 1)]
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${mix(from[0], to[0])},${mix(from[1], to[1])},${mix(from[2], to[2])})`
}

function impactCellBg(impact: string): string {
  if (impact === 'positive') return 'rgb(220,252,231)'  // green-100
  if (impact === 'negative') return 'rgb(255,237,213)'  // orange-100
  if (impact === 'mixed')    return 'rgb(254,249,195)'  // yellow-100
  return 'rgb(243,244,246)'                             // gray-100
}

interface ResultsGridProps {
  results: StockResult[]
}

export function ResultsGrid({ results }: ResultsGridProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedResult = results.find((r) => r.ticker === selected) ?? null

  const allQualitative = results.length > 0 && results.every((r) => !r.quantReliable)
  const sharedQuantWarning = allQualitative ? (results[0].quantWarning ?? null) : null

  function toggle(ticker: string) {
    setSelected((prev) => (prev === ticker ? null : ticker))
  }

  return (
    <div className="space-y-4">
      {allQualitative && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
          <p className="text-sm font-medium text-amber-400">
            This scenario type relies on qualitative analysis — historical return correlations are not a reliable signal here.
          </p>
          {sharedQuantWarning && (
            <p className="text-sm text-amber-300/70 mt-1">{sharedQuantWarning}</p>
          )}
        </div>
      )}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Grid header */}
        <div className="px-4 py-3 bg-gray-900">
          <h2 className="text-xs text-gray-400 uppercase tracking-wide font-medium">Stock Comparison</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            {/* Stock columns — one per ticker */}
            <thead>
              <tr>
                {/* Dimension label column */}
                <th className="w-36 min-w-[9rem] bg-gray-100 px-4 py-3 border-r border-b border-gray-200" />
                {results.map((r) => {
                  const scoreStr = r.impactScore > 0 ? `+${r.impactScore.toFixed(1)}` : r.impactScore.toFixed(1)
                  const isSelected = selected === r.ticker
                  return (
                    <th
                      key={r.ticker}
                      onClick={() => toggle(r.ticker)}
                      className="px-4 py-3 text-left border-r border-b border-gray-700 last:border-r-0 cursor-pointer select-none transition-colors"
                      style={{ background: isSelected ? '#374151' : '#111827' }}
                    >
                      <div className="flex items-start justify-between gap-3 min-w-[130px]">
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-white text-sm">{r.ticker}</div>
                          <div className="text-xs text-gray-400 font-normal truncate max-w-[110px] mt-0.5">{r.name}</div>
                        </div>
                        <div className="text-right shrink-0">
                          {r.quantReliable ? (
                            <div className="font-mono font-bold text-sm leading-tight" style={{ color: scoreColor(r.impactScore) }}>
                              {scoreStr}
                            </div>
                          ) : (
                            <div className="text-xs text-amber-500 italic leading-tight">qual.</div>
                          )}
                          <div className={`text-xs font-normal mt-0.5 ${
                            r.confidence === 'high'   ? 'text-green-400' :
                            r.confidence === 'medium' ? 'text-yellow-400' : 'text-gray-500'
                          }`}>
                            {r.confidence}
                          </div>
                        </div>
                      </div>
                      {/* Score bar */}
                      <div className="mt-2.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(Math.abs(r.impactScore) / 5) * 100}%`,
                            background: scoreColor(r.impactScore),
                          }}
                        />
                      </div>
                      <div className="mt-1.5 text-xs text-gray-500 font-normal leading-snug line-clamp-2">
                        {r.overallReasoning}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            {/* Dimension rows */}
            <tbody>
              {DIMENSIONS.map(({ key, label }, dimIdx) => (
                <tr key={key} className="border-t border-gray-200">
                  {/* Row label */}
                  <td className="px-4 py-3 bg-gray-100 border-r border-gray-200 align-top">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {label}
                    </span>
                  </td>
                  {/* Cells */}
                  {results.map((r) => {
                    const isSelected = selected === r.ticker
                    // Error stocks: show error cell spanning all dimension rows on the first row only
                    if (r.error) {
                      if (dimIdx === 0) {
                        return (
                          <td
                            key={r.ticker}
                            rowSpan={DIMENSIONS.length}
                            onClick={() => toggle(r.ticker)}
                            className="px-4 py-3 border-r border-gray-200 last:border-r-0 align-middle cursor-pointer"
                            style={{
                              background: 'rgb(255,241,242)',
                              boxShadow: isSelected ? 'inset 0 0 0 2px #3b82f6' : 'none',
                            }}
                          >
                            <p className="text-xs text-red-600 font-medium min-w-[130px] max-w-[220px]">
                              ⚠ Data fetch failed
                            </p>
                            <p className="text-xs text-red-400 mt-1 leading-relaxed min-w-[130px] max-w-[220px] line-clamp-3">
                              {r.error}
                            </p>
                          </td>
                        )
                      }
                      // Subsequent rows: cell already covered by rowSpan
                      return null
                    }
                    const dim = r[key]
                    return (
                      <td
                        key={r.ticker}
                        onClick={() => toggle(r.ticker)}
                        className="px-4 py-3 border-r border-gray-200 last:border-r-0 align-top cursor-pointer transition-opacity"
                        style={{
                          background: impactCellBg(dim.impact),
                          boxShadow: isSelected ? 'inset 0 0 0 2px #3b82f6' : 'none',
                        }}
                      >
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-4 min-w-[130px] max-w-[220px]">
                          {dim.summary}
                        </p>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded detail card */}
      {selectedResult && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Detail — {selectedResult.ticker}
            </span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="ml-auto text-xs text-gray-400 hover:text-gray-700"
            >
              Close ✕
            </button>
          </div>
          <ImpactCard result={selectedResult} />
        </div>
      )}
    </div>
  )
}
