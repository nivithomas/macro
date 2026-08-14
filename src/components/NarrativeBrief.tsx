'use client'

import { clsx } from 'clsx'
import { useMemo, useState } from 'react'
import type { AnalysisBrief, StockResult } from '@/lib/types'
import { enrichBriefBuckets, type EnrichedBriefItem } from '@/lib/brief-buckets'
import { buildStockVerdict, sortResultsForGlance } from '@/lib/stock-verdict'
import { Card } from './ui/Card'
import { HoverTip } from './ui/HoverTip'
import { sectionLabel, sectionLabelMuted, sectionLabelTeal } from './ui/typography'

interface NarrativeBriefProps {
  macroTrend: string
  brief: AnalysisBrief
  results: StockResult[]
  duration?: string
}

/** Converts [TICKER] markers in paragraph text into highlighted mono spans. */
function parseParagraph(text: string): React.ReactNode {
  const parts = text.split(/\[([A-Z0-9=.]+)\]/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="font-semibold text-emerald-600">{part}</span>
      : part,
  )
}

function formatBucketForSlack(items: EnrichedBriefItem[]): string {
  return items
    .map((item) => `\`${item.display}\` — ${item.tooltip}`)
    .join('; ')
}

function Bucket({
  label,
  subtitle,
  items,
}: {
  label: string
  subtitle: string
  items: EnrichedBriefItem[]
}) {
  if (items.length === 0) {
    return (
      <div className={briefBox}>
        <div className={sectionLabel}>{label}</div>
        <p className={`${briefBoxSubtitle} mt-1`}>{subtitle}</p>
        <div className="text-sm text-slate-500 mt-2 italic">None identified</div>
      </div>
    )
  }

  return (
    <div className={briefBox}>
      <div className={sectionLabel}>{label}</div>
      <p className={`${briefBoxSubtitle} mt-1`}>{subtitle}</p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item, i) => (
          <li key={`${item.display}-${i}`}>
            <HoverTip text={item.tooltip} className="w-full">
              <span className="text-sm font-semibold text-zinc-900 leading-snug underline decoration-dotted decoration-zinc-300 underline-offset-2">
                {item.display}
              </span>
            </HoverTip>
          </li>
        ))}
      </ul>
    </div>
  )
}

const briefBox = 'border rounded-lg p-3 bg-slate-50 border-slate-200'
const briefBoxSubtitle = 'text-[11px] leading-snug text-slate-500'
const questionsBox = 'border rounded-lg p-4 bg-gradient-to-b from-cyan-50/70 to-teal-50/25 border-cyan-200'
const briefMiniHeader = 'px-4 py-2.5 bg-blue-950 border-b border-blue-900'
const briefMiniHeaderTitle = 'text-xs font-semibold text-white leading-snug'

function BriefSideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 shadow-sm overflow-hidden bg-white">
      <div className={briefMiniHeader}>
        <h3 className={briefMiniHeaderTitle}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function PortfolioAtAGlance({ results }: { results: StockResult[] }) {
  const rows = useMemo(() => sortResultsForGlance(results), [results])

  if (rows.length === 0) return null

  return (
    <div className={briefBox}>
      <div className={sectionLabel}>Portfolio at a glance</div>
      <ul className="mt-3 space-y-2">
        {rows.map((result) => {
          if (result.error) {
            return (
              <li
                key={result.ticker}
                className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 py-1.5 border-b border-slate-200/80 last:border-0"
              >
                <span className="text-sm font-semibold text-zinc-900 w-16 shrink-0">{result.ticker}</span>
                <span className="text-sm text-red-600 leading-snug">Analysis unavailable</span>
              </li>
            )
          }

          const verdict = buildStockVerdict(result)
          return (
            <li
              key={result.ticker}
              className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 py-1.5 border-b border-slate-200/80 last:border-0"
            >
              <span className="text-sm font-semibold text-zinc-900 w-16 shrink-0">{result.ticker}</span>
              <div className="min-w-0 flex-1">
                <p className={clsx('text-sm font-medium leading-snug', verdict.color)}>{verdict.headline}</p>
                <p className="text-xs text-slate-500 leading-snug mt-0.5">{verdict.subline}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function confidenceLabel(avg: number): string {
  if (avg >= 0.75) return 'Mostly high confidence in this analysis'
  if (avg >= 0.45) return 'Mixed confidence across holdings'
  return 'Low confidence — treat with extra caution'
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  const label = confidenceLabel(value)

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-zinc-900 leading-none">
          {pct}%
        </span>
        <span className="text-sm text-zinc-600 leading-snug">{label}</span>
      </div>

      <div className="space-y-2">
        <div className="relative h-2.5 rounded-full bg-gradient-to-r from-orange-200 via-amber-100 to-emerald-200">
          <div
            className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-zinc-900 ring-[3px] ring-white shadow-sm"
            style={{ left: `clamp(0px, calc(${pct}% - 7px), calc(100% - 14px))` }}
            aria-hidden
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

function TailRiskCallout({ text, duration }: { text: string; duration: string }) {
  const fallback = `If the disruption continues well past ${duration}, input-cost hedges and fixed contracts at exposed holdings may expire before conditions improve.`
  const takeaway = text.trim() || fallback

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 leading-relaxed">
        The base case assumes the scenario plays out over about{' '}
        <span className="font-medium text-zinc-800">{duration}</span>. If it runs longer, hedges and
        fixed-price contracts may expire before prices normalize.
      </p>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3.5">
        <p className={`${sectionLabelMuted} mb-2`}>
          Extended scenario
        </p>
        <p className="text-sm text-zinc-800 leading-relaxed">{takeaway}</p>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-100 pt-3">
        Hedge details on each stock card are approximate from public knowledge, not live filing data.
      </p>
    </div>
  )
}

export function NarrativeBrief({ macroTrend, brief, results, duration = '1-3 months' }: NarrativeBriefProps) {
  const [copied, setCopied] = useState(false)
  const buckets = useMemo(() => enrichBriefBuckets(brief, results), [brief, results])
  const pct = Math.round(brief.avgConfidence * 100)

  function copyAsSlack() {
    const lines = [
      `*Macro Impact: ${macroTrend}*`,
      brief.paragraph.replace(/\[([A-Z0-9=.]+)\]/g, '`$1`'),
      '',
      `*Possible downside:* ${formatBucketForSlack(buckets.watchClosely)}`,
      `*Hedges:* ${formatBucketForSlack(buckets.hedges)}`,
      `*Possible upside:* ${formatBucketForSlack(buckets.upside)}`,
      '',
      `*What if the shock lasts longer than ${duration}?* ${brief.tailRisk}`,
      `_Analysis confidence ${pct}% · Not investment advice_`,
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function exportPdf() {
    window.print()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={copyAsSlack}
          className="relative inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/15 transition-colors"
        >
          {copied ? (
            <>
              <span className="text-emerald-400">✓</span> Copied
            </>
          ) : (
            'Copy as Slack'
          )}
        </button>
        <button
          type="button"
          onClick={exportPdf}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/15 transition-colors"
        >
          Export PDF
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-4 bg-blue-950 border-b border-blue-900 flex items-baseline gap-3 min-w-0">
          <div className="text-xs text-zinc-400 font-semibold shrink-0">Brief</div>
          <h2 className="text-lg font-semibold text-white truncate">{macroTrend}</h2>
        </div>

        <div className="px-6 py-5 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
          <p className="text-base text-zinc-800 leading-relaxed">
            {parseParagraph(brief.paragraph)}
          </p>
          <PortfolioAtAGlance results={results} />
          <p className="text-[11px] text-zinc-400">Hover any name in the buckets below for a brief explanation.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <Bucket
              label="Possible downside"
              subtitle="Portfolio holdings most at risk if this scenario plays out"
              items={buckets.watchClosely}
            />
            <Bucket
              label="Hedges to consider"
              subtitle="Trades or instruments that could offset that risk"
              items={buckets.hedges}
            />
            <Bucket
              label="Possible upside"
              subtitle="Portfolio holdings that may benefit from the shift"
              items={buckets.upside}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100">
          <div className={questionsBox}>
            <div className={`${sectionLabelTeal} mb-2`}>
              Questions to investigate
            </div>
            <div className="space-y-1">
              {brief.questions.map((q, i) => (
                <div
                  key={i}
                  className="w-full text-left text-sm text-zinc-700 hover:text-zinc-900 hover:bg-cyan-50/80 rounded-md px-2 py-1.5 transition-colors flex items-start gap-2"
                >
                  <span className="text-cyan-600 mt-0.5 shrink-0">→</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <BriefSideCard title="Avg confidence in the accuracy of analysis across this portfolio">
          <ConfidenceMeter value={brief.avgConfidence} />
        </BriefSideCard>
        <BriefSideCard title={`What if the shock lasts longer than ${duration}?`}>
          <TailRiskCallout text={brief.tailRisk} duration={duration} />
        </BriefSideCard>
      </div>
    </div>
  )
}
