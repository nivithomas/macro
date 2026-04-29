'use client'

import type { StockResult } from '@/lib/types'

function scoreToColor(score: number): string {
  const yellow = [234, 179, 8]
  const green  = [34,  197, 94]
  const orange = [249, 115, 22]
  const [from, to, t] = score >= 0
    ? [yellow, green,  Math.min(score / 5, 1)]
    : [yellow, orange, Math.min(Math.abs(score) / 5, 1)]
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${mix(from[0], to[0])},${mix(from[1], to[1])},${mix(from[2], to[2])})`
}

function corrCellStyle(r: number): React.CSSProperties {
  const intensity = Math.min(Math.abs(r) / 0.7, 1)
  const alpha = intensity * 0.55 + 0.05
  const bg = r > 0
    ? `rgba(34, 197, 94, ${alpha})`
    : r < 0
    ? `rgba(249, 115, 22, ${alpha})`
    : 'rgba(0,0,0,0.04)'
  return { background: bg }
}

interface PortfolioSummaryProps {
  results: StockResult[]
  threshold?: number
}

export function PortfolioSummary({ results, threshold = 0.2 }: PortfolioSummaryProps) {
  const quantReliable = results.length === 0 || results.some((r) => r.quantReliable)
  // Valid = no error, used for net exposure and sorting
  const valid = results.filter((r) => !r.error)
  // All results shown in table (errored ones shown with "—" score)
  const sorted = [
    ...valid.sort((a, b) => b.impactScore - a.impactScore),
    ...results.filter((r) => r.error),
  ]

  // Derive ordered indicator list from ALL results (including errored ones that have correlations)
  const indicatorMap = new Map<string, string>() // ticker → name
  for (const r of results) {
    for (const c of r.correlations) {
      if (!indicatorMap.has(c.indicatorTicker)) {
        indicatorMap.set(c.indicatorTicker, c.indicatorName)
      }
    }
  }
  const indicators = [...indicatorMap.entries()] // [ticker, name][]

  // Which indicators have at least one stock with |r| >= threshold
  const aboveThreshold = new Set<string>()
  for (const r of results) {
    for (const c of r.correlations) {
      if (Math.abs(c.correlation) >= threshold) aboveThreshold.add(c.indicatorTicker)
    }
  }

  // Pull direction + reasoning for each indicator from the first result that has it set
  // Track whether direction estimation ran at all (any non-undefined direction)
  const directionMap = new Map<string, { direction: number; reasoning?: string }>()
  let directionEstimationRan = false
  for (const r of results) {
    for (const c of r.correlations) {
      if (c.direction !== undefined) {
        directionEstimationRan = true
        if (!directionMap.has(c.indicatorTicker)) {
          directionMap.set(c.indicatorTicker, {
            direction: c.direction,
            reasoning: c.directionReasoning,
          })
        }
      }
    }
  }

  const netExposure = valid.length > 0
    ? valid.reduce((sum, r) => sum + r.impactScore, 0) / valid.length
    : 0
  const netStr = netExposure > 0 ? `+${netExposure.toFixed(2)}` : netExposure.toFixed(2)
  const netColor = scoreToColor(netExposure)

  return (
    <div className="space-y-3">
      {!quantReliable && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-2.5">
          <span className="text-amber-400 text-base shrink-0 leading-none mt-0.5">⚠</span>
          <p className="text-sm text-amber-300/90 leading-relaxed">
            Quant scores are not reliable for this scenario type. See individual stock assessments below for the qualitative analysis.
          </p>
        </div>
      )}
      <div className={`rounded-xl border border-zinc-200 overflow-hidden shadow-sm${!quantReliable ? ' opacity-40 pointer-events-none select-none' : ''}`}>
      {/* Header */}
      <div className="px-5 py-3.5 bg-white border-b border-zinc-100 flex items-center gap-4">
        <h2 className="text-sm font-semibold text-zinc-900">Portfolio Exposure</h2>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="text-xs text-zinc-400">Net exposure ({valid.length} of {results.length} stocks)</span>
          <span className="font-mono font-bold text-sm" style={{ color: netColor }}>{netStr}</span>
          <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(Math.abs(netExposure) / 5) * 100}%`, background: netColor }}
            />
          </div>
        </div>
      </div>

      {/* Ranking + heatmap */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse min-w-max text-xs">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50 border-b border-r border-zinc-200 whitespace-nowrap w-36">
                Stock
              </th>
              <th className="px-3 py-2.5 text-left font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50 border-b border-r border-zinc-200 whitespace-nowrap">
                Score
              </th>
              {indicators.map(([ticker, name]) => {
                const entry = directionMap.get(ticker)
                const dir = entry?.direction
                const dirLabel = !directionEstimationRan || dir === undefined
                  ? '—'
                  : dir === 0 ? '→ 0.0'
                  : `${dir > 0 ? '↑' : '↓'} ${dir > 0 ? '+' : ''}${dir.toFixed(1)}`
                const dirColor = !directionEstimationRan || dir === undefined
                  ? '#9ca3af'
                  : dir > 0 ? '#059669' : dir < 0 ? '#ea580c' : '#9ca3af'
                return (
                  <th
                    key={ticker}
                    className="px-3 py-2.5 text-center font-medium text-zinc-500 uppercase tracking-wider bg-zinc-50 border-b border-r border-zinc-200 last:border-r-0"
                  >
                    <div className="font-mono font-semibold text-emerald-700">{ticker}</div>
                    <div className="font-normal text-zinc-400 normal-case tracking-normal truncate max-w-[90px]">{name}</div>
                    <div
                      className="font-mono font-semibold normal-case tracking-normal mt-0.5 cursor-help"
                      style={{ color: dirColor }}
                      title={entry?.reasoning ?? undefined}
                    >
                      {dirLabel}
                      {entry?.reasoning && <span className="ml-1 text-zinc-300 font-normal text-[10px]">ⓘ</span>}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, idx) => {
              const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'
              return (
                <tr key={r.ticker} className={rowBg}>
                  <td className="px-3 py-2.5 border-b border-r border-zinc-100 whitespace-nowrap">
                    <div className="font-mono font-semibold text-emerald-700">{r.ticker}</div>
                    <div className="text-zinc-400 truncate max-w-[120px]">{r.name}</div>
                  </td>
                  <td className="px-3 py-2.5 border-b border-r border-zinc-100 whitespace-nowrap">
                    {r.error ? (
                      <span className="text-zinc-400 font-mono" title={r.error}>— error</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold w-12 text-right" style={{ color: scoreToColor(r.impactScore) }}>
                          {r.impactScore > 0 ? '+' : ''}{r.impactScore.toFixed(2)}
                        </span>
                        <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(Math.abs(r.impactScore) / 5) * 100}%`, background: scoreToColor(r.impactScore) }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  {indicators.map(([ticker]) => {
                    const corr = r.correlations.find((c) => c.indicatorTicker === ticker)
                    const val = corr?.correlation
                    const meetsThreshold = val !== undefined && Math.abs(val) >= threshold
                    return (
                      <td
                        key={ticker}
                        className="px-3 py-2.5 border-b border-r border-zinc-100 last:border-r-0 text-center"
                        style={meetsThreshold ? corrCellStyle(val!) : {}}
                      >
                        {val !== undefined ? (
                          <span className={`font-mono ${meetsThreshold ? 'text-zinc-800' : 'text-zinc-300'}`}>
                            {val > 0 ? '+' : ''}{val.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span>Score = correlation × estimated indicator direction. Range: −5 (strongly bearish) to +5 (strongly bullish). Cells show Pearson r (weekly, 24mo).</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(16,185,129,0.3)' }} /> positive</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(249,115,22,0.3)' }} /> negative</span>
        <span className="ml-auto">
          Showing indicators with |r| ≥ {threshold.toFixed(2)}. {aboveThreshold.size} of {indicators.length} shown.
        </span>
      </div>
      </div>
    </div>
  )
}
