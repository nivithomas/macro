'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import type { StockResult } from '@/lib/types'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { CorrelationChart } from './CorrelationChart'

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

function directionalVerdict(score: number) {
  if (score >= 3) return { label: 'Strongly Bullish', color: 'text-emerald-600' }
  if (score >= 1) return { label: 'Bullish', color: 'text-emerald-600' }
  if (score <= -3) return { label: 'Strongly Bearish', color: 'text-red-600' }
  if (score <= -1) return { label: 'Bearish', color: 'text-red-600' }
  return { label: 'Neutral', color: 'text-yellow-600' }
}

function qualitativeVerdict(result: StockResult) {
  const dims = [result.historicalPatterns.impact, result.businessModel.impact, result.supplyChain.impact]
  const pos = dims.filter((d) => d === 'positive').length
  // 'mixed' leans negative (0.5 weight) — mixed outcomes in a bearish context still carry directional signal
  const neg = dims.filter((d) => d === 'negative').length + dims.filter((d) => d === 'mixed').length * 0.5
  // 'negligible' and 'neutral' count as neither
  if (pos > neg) return { label: 'Bullish', color: 'text-emerald-600' }
  if (neg > pos) return { label: 'Bearish', color: 'text-red-600' }
  return { label: 'Neutral', color: 'text-yellow-600' }
}

function confidenceBadge(c: string) {
  if (c === 'high') return <Badge variant="green">High confidence</Badge>
  if (c === 'medium') return <Badge variant="yellow">Medium confidence</Badge>
  return <Badge variant="gray">Low confidence</Badge>
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
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
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
  const verdict = result.confidence === 'low'
    ? { label: 'Insufficient signal', color: 'text-zinc-500' }
    : result.quantReliable
      ? directionalVerdict(result.impactScore)
      : qualitativeVerdict(result)

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
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap border-b border-zinc-100">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-emerald-700">{result.ticker}</span>
          {result.timeHorizon && (
            <Badge variant="blue">{result.timeHorizon}</Badge>
          )}
          <span className="text-sm text-zinc-500 truncate max-w-[200px]">{result.name}</span>
        </div>
        {result.sector && <span className="text-xs text-zinc-400 bg-zinc-100 rounded px-1.5 py-0.5">{result.sector}</span>}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {confidenceBadge(result.confidence)}
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
              <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-600 text-[11px] px-2 py-0.5 rounded">
                Qualitative · {result.confidence === 'high' ? 'High' : result.confidence === 'medium' ? 'Medium' : 'Low'} confidence
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Directional verdict — large, prominent, above reasoning */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <span className={clsx('text-xl font-bold', verdict.color)}>{verdict.label}</span>
      </div>

      {/* Quant warning callout */}
      {!result.quantReliable && result.quantWarning && (
        <div className="mx-5 mb-3 rounded-lg bg-stone-50 border border-stone-200 px-3 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100">Note</span>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-600">Why no quant score?</p>
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
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Historical Analog</p>
          <p className="text-sm text-zinc-600 leading-relaxed">{result.historicalAnalog}</p>
        </div>
      )}

      {/* Hedge book note */}
      {result.hedgeBookNote && (
        <div className="border-t border-zinc-100 mx-5 my-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-0.5">Hedge Book</p>
          <p className="text-xs text-blue-400 italic mb-2">
            {result.hedgeBookExposureType === 'fx'
              ? 'Shown because this stock has material foreign exchange exposure.'
              : result.hedgeBookExposureType === 'rates'
              ? 'Shown because this stock has material interest rate exposure.'
              : result.hedgeBookExposureType === 'energy'
              ? 'Shown because this stock has material energy input cost exposure.'
              : 'Shown because this stock has direct commodity input cost exposure.'}
          </p>
          <p className="text-sm text-blue-700 leading-relaxed">{result.hedgeBookNote}</p>
        </div>
      )}

      {/* EPS sensitivity */}
      {result.epsSensitivity && (
        <div className="border-t border-zinc-100 px-5 py-3">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">EPS Sensitivity</p>
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
