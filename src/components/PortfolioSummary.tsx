'use client'

import type { CorrelationResult, StockResult } from '@/lib/types'
import { HoverTip } from '@/components/ui/HoverTip'

function correlationStrength(absR: number): { adverb: string; label: string } {
  if (absR < 0.15) return { adverb: 'negligibly', label: 'negligible' }
  if (absR < 0.3) return { adverb: 'weakly', label: 'weak' }
  if (absR < 0.5) return { adverb: 'moderately', label: 'moderate' }
  if (absR < 0.7) return { adverb: 'strongly', label: 'strong' }
  return { adverb: 'very strongly', label: 'very strong' }
}

function directionMagnitude(absD: number): string {
  if (absD < 0.2) return 'slightly'
  if (absD < 0.5) return 'moderately'
  return 'significantly'
}

function buildCorrelationTooltip(
  stockTicker: string,
  stockName: string,
  corr: CorrelationResult,
): string {
  const { correlation, indicatorName, indicatorTicker, dataPoints, correlationMismatchWarning, indicatorClassification } = corr
  const { adverb, label } = correlationStrength(Math.abs(correlation))
  const coMovement = correlation > 0
    ? `${stockTicker} and ${indicatorName} tended to move in the same direction`
    : correlation < 0
    ? `${stockTicker} and ${indicatorName} tended to move in opposite directions`
    : `${stockTicker} and ${indicatorName} showed no consistent co-movement`

  let text = `${stockName} (${stockTicker}) is ${adverb} correlated with ${indicatorName} (${indicatorTicker}) — a ${label} historical link (r = ${correlation > 0 ? '+' : ''}${correlation.toFixed(2)}).`
  text += ` Over ${dataPoints} weeks of log returns, ${coMovement}.`
  text += ' This measures past co-movement, not the scenario forecast.'

  if (indicatorClassification === 'direct') {
    text += ' Direct causal link for this scenario.'
  } else if (indicatorClassification === 'indirect') {
    text += ' Indirect link — may partly reflect shared macro factors.'
  } else if (indicatorClassification === 'macro_noise') {
    text += ' Likely macro noise with limited causal relevance here.'
  }

  if (correlationMismatchWarning) {
    text += ' Caution: demand-driven history may not apply to this supply-shock scenario.'
  }

  return text
}

function buildDirectionTooltip(
  indicatorName: string,
  indicatorTicker: string,
  direction: number | undefined,
  reasoning?: string,
): string | undefined {
  if (direction === undefined) return undefined

  const dirWord = direction > 0 ? 'up' : direction < 0 ? 'down' : 'flat'
  let text = `${indicatorName} (${indicatorTicker}) is expected to move ${directionMagnitude(Math.abs(direction))} ${dirWord} (${direction > 0 ? '+' : ''}${direction.toFixed(1)}) under this macro scenario.`
  text += ' This is the scenario forecast for the indicator — not a stock correlation.'
  if (reasoning) text += ` ${reasoning}`

  return text
}

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

function corrTooltip(
  stockTicker: string,
  indicatorName: string,
  corr: import('@/lib/types').CorrelationResult | undefined,
  threshold: number,
): string {
  if (!corr) return `No correlation data available for ${stockTicker} vs ${indicatorName}.`
  const { correlation: r, dataPoints, indicatorClassification, correlationMismatchWarning, directionReasoning } = corr
  const abs = Math.abs(r)
  const strength = abs < 0.2 ? 'negligible' : abs < 0.4 ? 'weak' : abs < 0.6 ? 'moderate' : abs < 0.8 ? 'strong' : 'very strong'
  const sign = r > 0 ? 'positive' : r < 0 ? 'negative' : 'zero'
  const moveText = r > 0
    ? `${stockTicker} has historically moved in the same direction as ${indicatorName}`
    : r < 0
    ? `${stockTicker} has historically moved in the opposite direction from ${indicatorName}`
    : `${stockTicker} has shown no historical relationship with ${indicatorName}`
  const meets = abs >= threshold

  const parts = [
    `${stockTicker} vs ${indicatorName}: r = ${r.toFixed(2)} (${strength} ${sign} correlation, weekly log returns, n=${dataPoints}).`,
    `${moveText}.`,
    meets
      ? `Meets the |r| ≥ ${threshold.toFixed(2)} threshold for a signal worth examining.`
      : `Below the |r| ≥ ${threshold.toFixed(2)} threshold — too weak to be a meaningful signal.`,
  ]
  if (indicatorClassification === 'direct') {
    parts.push('Classified as a directly causally linked indicator (2x weight in the score).')
  } else if (indicatorClassification === 'macro_noise') {
    parts.push('Classified as macro noise / shared beta (0.5x weight in the score).')
  } else if (indicatorClassification === 'indirect') {
    parts.push('Classified as an indirect indicator.')
  }
  if (correlationMismatchWarning) {
    parts.push('Warning: looks like a demand-driven correlation applied to a supply-shock scenario — weight discounted 50%.')
  }
  if (directionReasoning) {
    parts.push(directionReasoning)
  }
  return parts.join(' ')
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

/** Plain-language read of average portfolio impact score (−5 to +5). */
function netExposureVerdict(score: number): { label: string; detail: string } {
  const abs = Math.abs(score)
  if (abs < 0.75) {
    return {
      label: 'Near neutral',
      detail: 'This scenario barely moves the portfolio on average — not strongly good or bad.',
    }
  }
  if (score > 0) {
    if (abs < 2) return { label: 'Slightly helpful', detail: 'On average, stocks lean modestly positive under this scenario.' }
    if (abs < 3.5) return { label: 'Moderately helpful', detail: 'On average, the portfolio tends to benefit from this scenario.' }
    return { label: 'Strongly helpful', detail: 'On average, the portfolio is positioned to benefit significantly.' }
  }
  if (abs < 2) return { label: 'Slightly harmful', detail: 'On average, stocks lean modestly negative under this scenario.' }
  if (abs < 3.5) return { label: 'Moderately harmful', detail: 'On average, the portfolio tends to be hurt by this scenario.' }
  return { label: 'Strongly harmful', detail: 'On average, the portfolio is positioned to be hurt significantly.' }
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
  const netVerdict = netExposureVerdict(netExposure)
  const quantWarning = results.find((r) => r.quantWarning)?.quantWarning ?? null

  return (
    <div className="space-y-3">
      {!quantReliable && (
        <div className="rounded-lg bg-stone-50 border border-stone-200 px-4 py-3 flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 text-xs flex items-center justify-center shrink-0 mt-0.5 leading-none">ⓘ</span>
          <div>
            <p className="text-sm font-medium text-zinc-700">Quant scores are not reliable for this scenario type.</p>
            {quantWarning && (
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{quantWarning}</p>
            )}
            <p className="text-sm text-zinc-500 mt-1">See individual stock assessments below for the qualitative analysis. You can still hover table cells for correlation details.</p>
          </div>
        </div>
      )}
      <div className={`rounded-xl border shadow-sm overflow-hidden${!quantReliable ? ' border-zinc-300 bg-zinc-50/60' : ' border-zinc-200'}`}>
      {/* Header */}
      <div className="px-5 py-3.5 bg-blue-950 border-b border-blue-900 flex items-center gap-4 flex-wrap">
        <h2 className="text-sm font-semibold text-white shrink-0">Portfolio Exposure</h2>
        <div className="ml-auto flex flex-col items-end gap-0.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <span className="text-xs text-zinc-400">
              Average impact ({valid.length} of {results.length} stocks)
            </span>
            <span className="text-xs font-medium text-white">{netVerdict.label}</span>
            <span className="font-mono font-bold text-sm tabular-nums text-white" title="Average of each stock score. −5 = hurt, +5 = help.">
              {netStr}
            </span>
            <div className="w-20 h-1.5 bg-blue-900 rounded-full overflow-hidden shrink-0" title="−5 to +5 scale">
              <div
                className="h-full rounded-full"
                style={{ width: `${(Math.abs(netExposure) / 5) * 100}%`, background: netColor }}
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 text-right max-w-md leading-snug">
            {netVerdict.detail}
            {!quantReliable && ' Quant average may be unreliable for this scenario type.'}
          </p>
        </div>
      </div>

      {/* Heatmap color key — above table */}
      <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-600 space-y-2">
        <p className="font-medium text-zinc-700">What the cell colors mean</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm border border-zinc-200 shrink-0" style={corrCellStyle(0.15)} />
            <span className="w-4 h-4 rounded-sm border border-zinc-200 shrink-0" style={corrCellStyle(0.55)} />
            <span><span className="text-emerald-700 font-medium">Green</span> — stock and indicator weekly returns tended to move together (positive r). Darker green = stronger link.</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm border border-zinc-200 shrink-0" style={corrCellStyle(-0.15)} />
            <span className="w-4 h-4 rounded-sm border border-zinc-200 shrink-0" style={corrCellStyle(-0.55)} />
            <span><span className="text-orange-600 font-medium">Orange</span> — they tended to move in opposite directions (negative r). Darker orange = stronger link.</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sm border border-zinc-200 bg-white shrink-0" />
            <span className="font-mono text-zinc-300">+0.08</span>
            <span>No fill, grey text — |r| below {threshold.toFixed(2)} (weak historical link, shown for context only).</span>
          </span>
        </div>
        <p className="text-zinc-500">
          Column headers: <span className="text-emerald-600 font-mono">↑ green</span> = indicator expected to rise in this scenario;{' '}
          <span className="text-orange-600 font-mono">↓ orange</span> = expected to fall. Score column uses the same green/orange scale for estimated stock impact.
        </p>
      </div>

      {/* Ranking + heatmap */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full border-collapse min-w-max text-xs">
          <thead>
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-500 bg-zinc-100 border-b border-r border-zinc-200 whitespace-nowrap w-36">
                Stock
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-zinc-500 bg-zinc-100 border-b border-r border-zinc-200 whitespace-nowrap">
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
                    className="px-3 py-2.5 text-center text-xs font-semibold text-zinc-500 bg-zinc-100 border-b border-r border-zinc-200 last:border-r-0"
                  >
                    <div className="font-mono font-semibold text-zinc-900">{ticker}</div>
                    <div className="font-normal text-zinc-500 normal-case tracking-normal truncate max-w-[90px]">{name}</div>
                    {(() => {
                      const dirTooltip = buildDirectionTooltip(name, ticker, dir, entry?.reasoning)
                      const dirContent = (
                        <span style={{ color: dirColor }}>
                          {dirLabel}
                          {entry?.reasoning && <span className="ml-1 text-zinc-400 font-normal text-[10px]">ⓘ</span>}
                        </span>
                      )
                      return dirTooltip ? (
                        <HoverTip
                          text={dirTooltip}
                          className="font-mono font-semibold normal-case tracking-normal mt-0.5 cursor-help"
                        >
                          {dirContent}
                        </HoverTip>
                      ) : (
                        <div className="font-mono font-semibold normal-case tracking-normal mt-0.5" style={{ color: dirColor }}>
                          {dirLabel}
                        </div>
                      )
                    })()}
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
                  {indicators.map(([ticker, name]) => {
                    const corr = r.correlations.find((c) => c.indicatorTicker === ticker)
                    const val = corr?.correlation
                    const meetsThreshold = val !== undefined && Math.abs(val) >= threshold
                    const cellTooltip = corr ? buildCorrelationTooltip(r.ticker, r.name, corr) : undefined
                    return (
                      <td
                        key={ticker}
                        className={`px-3 py-2.5 border-b border-r border-zinc-100 last:border-r-0 text-center${cellTooltip ? ' cursor-help' : ''}`}
                        style={meetsThreshold ? corrCellStyle(val!) : {}}
                        title={corrTooltip(r.ticker, name, corr, threshold)}
                      >
                        {cellTooltip ? (
                          <HoverTip text={cellTooltip} className="w-full justify-center cursor-help">
                            {val !== undefined ? (
                              <span className={`font-mono ${meetsThreshold ? 'text-zinc-800' : 'text-zinc-300'}`}>
                                {val > 0 ? '+' : ''}{val.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </HoverTip>
                        ) : val !== undefined ? (
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
        <span>Score = correlation × estimated indicator direction (−5 to +5). Cells show Pearson r on weekly log returns (24mo). Hover any number for details.</span>
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
