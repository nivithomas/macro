'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import type { StockResult } from '@/lib/types'
import { buildStockVerdict } from '@/lib/stock-verdict'
import { Card } from './ui/Card'
import { CorrelationChart } from './CorrelationChart'
import { sectionLabelMuted, sectionLabelTeal } from './ui/typography'

interface ImpactCardProps {
  result: StockResult
  threshold?: number
}

export function ImpactBar({ score }: { score: number }) {
  const pct = ((score + 5) / 10) * 100
  const color = score > 1 ? 'bg-emerald-500' : score < -1 ? 'bg-orange-500' : 'bg-yellow-400'
  return (
    <div className="relative h-1.5 bg-zinc-200 rounded-full overflow-hidden w-28">
      <div className="absolute top-0 left-1/2 w-px h-full bg-zinc-300 z-10" />
      {score >= 0 ? (
        <div className={clsx('absolute top-0 h-full rounded-full', color)} style={{ left: '50%', width: `${pct - 50}%` }} />
      ) : (
        <div className={clsx('absolute top-0 h-full rounded-full', color)} style={{ left: `${pct}%`, width: `${50 - pct}%` }} />
      )}
    </div>
  )
}

interface VerdictDisplay {
  headline: string
  subline: string
  color: string
}

function DimensionRow({
  label,
  dim,
  extra,
}: {
  label: string
  dim: { summary: string; detail: string; impact: string }
  extra?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const dotColor = dim.impact === 'positive' ? 'bg-emerald-500' : dim.impact === 'negative' ? 'bg-red-500' : dim.impact === 'mixed' ? 'bg-yellow-400' : 'bg-zinc-300'
  return (
    <div className="border-t border-zinc-100">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 py-3 px-5 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className={clsx('mt-1.5 w-2 h-2 rounded-full shrink-0', dotColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={sectionLabelMuted}>{label}</span>
            <span className="text-zinc-300 text-xs ml-2">{open ? '▲' : '▼'}</span>
          </div>
          <p className="text-sm text-zinc-700 mt-0.5 leading-snug">{dim.summary}</p>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-zinc-600 leading-relaxed bg-zinc-50/50">
          {dim.detail}
          {extra}
        </div>
      )}
    </div>
  )
}

export function ImpactCard({ result, threshold = 0.2 }: ImpactCardProps) {
  const [showCorr, setShowCorr] = useState(false)
  const scoreStr = result.impactScore > 0 ? `+${result.impactScore.toFixed(1)}` : result.impactScore.toFixed(1)
  const scoreColor = result.impactScore > 0 ? 'text-emerald-600' : result.impactScore < 0 ? 'text-orange-500' : 'text-yellow-500'
  const verdict: VerdictDisplay = buildStockVerdict(result)

  return (
    <Card className={result.weakCausalLink ? 'opacity-75' : undefined}>
      {/* Weak causal link warning banner */}
      {result.weakCausalLink && (
        <div className="px-5 py-2.5 bg-yellow-50 border-b border-yellow-200 flex items-center gap-2">
          <span className="text-yellow-600 font-medium text-xs">Weak causal connection detected.</span>
          <span className="text-yellow-500 text-xs">Treat this analysis with extra skepticism.</span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap border-b border-zinc-200 bg-zinc-900">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-sm font-semibold text-white shrink-0">{result.ticker}</span>
          <span className="text-sm text-zinc-300 truncate max-w-[200px]">{result.name}</span>
        </div>
        {result.sector && <span className="text-xs text-zinc-300 bg-zinc-800 rounded px-1.5 py-0.5">{result.sector}</span>}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <div className="flex flex-col items-end gap-1">
            {result.quantReliable ? (
              <>
                <div className="flex items-center gap-2">
                  <ImpactBar score={result.impactScore} />
                  <span className={clsx('font-mono font-bold text-base', scoreColor)}>{scoreStr}</span>
                </div>
                <span className="text-xs text-zinc-400">corr × direction · not investment advice</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-200 text-[11px] px-2 py-0.5 rounded">
                Qualitative assessment
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Directional verdict — plain language headline with timeline/confidence subline */}
      <div className="px-5 pt-4 pb-2">
        <p className={clsx('text-lg font-semibold leading-snug', verdict.color)}>{verdict.headline}</p>
        <p className="text-sm font-normal text-zinc-500 mt-1 leading-snug">{verdict.subline}</p>
      </div>

      {/* Quant warning callout */}
      {!result.quantReliable && result.quantWarning && (
        <div className="mx-5 mb-3 rounded-lg bg-stone-50 border border-stone-200 px-3 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100">Note</span>
            <p className={`${sectionLabelMuted}`}>Why no quant score?</p>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">{result.quantWarning}</p>
        </div>
      )}

      {/* Overall reasoning */}
      {result.overallReasoning && (
        <div className="px-5 pb-3 text-sm text-zinc-500 leading-relaxed border-b border-zinc-100">
          {result.overallReasoning}
        </div>
      )}

      {/* Error state */}
      {result.error && (
        <div className="px-5 py-3 text-sm text-red-500">{result.error}</div>
      )}

      {/* 3 dimensions */}
      {!result.error && (
        <>
          <DimensionRow
            label="Historical patterns"
            dim={result.historicalPatterns}
            extra={
              result.correlations.some((c) => c.chartData && c.chartData.length > 1 && Math.abs(c.correlation) >= threshold) ? (
                <div className="mt-4 space-y-5 border-t border-zinc-200 pt-4">
                  {result.correlations
                    .filter((c) => c.chartData && c.chartData.length > 1 && Math.abs(c.correlation) >= threshold)
                    .map((c) => (
                      <CorrelationChart
                        key={c.indicatorTicker}
                        data={c.chartData!}
                        stockTicker={result.ticker}
                        indicatorName={c.indicatorName}
                        correlation={c.correlation}
                        dataPoints={c.dataPoints}
                      />
                    ))}
                </div>
              ) : null
            }
          />
          <DimensionRow label="Business model" dim={result.businessModel} />
          <DimensionRow label="Supply chain" dim={result.supplyChain} />
        </>
      )}

      {/* Historical analog */}
      {result.historicalAnalog && (
        <div className="border-t border-zinc-100 px-5 py-3">
          <p className={`${sectionLabelMuted} mb-1`}>Historical analog</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{result.historicalAnalog}</p>
        </div>
      )}

      {/* Hedge book note */}
      {result.hedgeBookNote && (
        <div className="border-t border-zinc-100 px-5 py-3">
          <div className="rounded-lg p-4 bg-gradient-to-b from-cyan-50/70 to-teal-50/25 border border-cyan-200">
            <p className={`${sectionLabelTeal} mb-1`}>
              Hedge book
            </p>
            <p className="text-xs text-zinc-500 italic mb-2">
              {result.hedgeBookExposureType === 'fx'
                ? 'Shown because this stock has material foreign exchange exposure.'
                : result.hedgeBookExposureType === 'rates'
                ? 'Shown because this stock has material interest rate exposure.'
                : result.hedgeBookExposureType === 'energy'
                ? 'Shown because this stock has material energy input cost exposure.'
                : 'Shown because this stock has direct commodity input cost exposure.'}
            </p>
            <p className="text-sm text-zinc-700 leading-relaxed">{result.hedgeBookNote}</p>
          </div>
        </div>
      )}

      {/* EPS sensitivity */}
      {result.epsSensitivity && (
        <div className="border-t border-zinc-100 px-5 py-3">
          <p className={`${sectionLabelMuted} mb-1`}>EPS sensitivity</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{result.epsSensitivity}</p>
        </div>
      )}

      {/* Correlations */}
      {result.correlations.length > 0 && (
        <div className="border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setShowCorr((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <span>
              Correlations ({result.correlations.filter((c) => Math.abs(c.correlation) >= threshold).length} of {result.correlations.length} indicators at |r| ≥ {threshold.toFixed(2)}, weekly log returns)
            </span>
            <span>{showCorr ? '▲' : '▼'}</span>
          </button>
          {showCorr && (
            <div className="px-5 pb-4 space-y-2.5 bg-zinc-50/50">
              {result.correlations.map((c) => {
                const meets = Math.abs(c.correlation) >= threshold
                const dirLabel = c.direction === undefined ? null
                  : c.direction === 0 ? '→ 0.0'
                  : `${c.direction > 0 ? '↑' : '↓'} ${c.direction > 0 ? '+' : ''}${c.direction.toFixed(1)}`
                const dirColor = c.direction === undefined || c.direction === 0 ? 'text-zinc-400'
                  : c.direction > 0 ? 'text-emerald-600' : 'text-orange-500'
                const classificationLabel = c.indicatorClassification === 'direct' ? (
                  <span className="text-emerald-600 font-medium">direct</span>
                ) : c.indicatorClassification === 'macro_noise' ? (
                  <span className="text-zinc-400">noise</span>
                ) : null
                return (
                  <div key={c.indicatorTicker} className={clsx('text-xs', !meets && 'opacity-40')}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-zinc-700 flex-1 min-w-0 truncate font-medium">{c.indicatorName}</span>
                      {classificationLabel && <span className="shrink-0">{classificationLabel}</span>}
                      {c.correlationMismatchWarning && (
                        <span className="text-yellow-600 shrink-0 font-medium">mismatch</span>
                      )}
                      <span className="text-zinc-400 shrink-0 font-mono">n={c.dataPoints}</span>
                      {dirLabel && (
                        <span className={clsx('font-mono shrink-0 font-medium', dirColor)}>{dirLabel}</span>
                      )}
                      <span className={clsx(
                        'font-mono shrink-0',
                        meets
                          ? c.correlation > 0.3 ? 'text-emerald-600' : c.correlation < -0.3 ? 'text-orange-500' : 'text-yellow-600'
                          : 'text-zinc-300',
                      )}>
                        r = {c.correlation.toFixed(3)}
                      </span>
                    </div>
                    {c.directionReasoning && (
                      <p className="mt-0.5 text-zinc-400 leading-snug">{c.directionReasoning}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
