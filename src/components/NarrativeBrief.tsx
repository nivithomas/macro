'use client'

import { useState } from 'react'
import type { AnalysisBrief } from '@/lib/types'
import { Card } from './ui/Card'

interface NarrativeBriefProps {
  macroTrend: string
  brief: AnalysisBrief
}

/** Converts [TICKER] markers in paragraph text into highlighted mono spans. */
function parseParagraph(text: string): React.ReactNode {
  const parts = text.split(/\[([A-Z0-9=.]+)\]/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} className="font-mono font-semibold text-emerald-400">{part}</span>
      : part,
  )
}

function Bucket({
  tone,
  label,
  items,
}: {
  tone: 'watch' | 'hedges' | 'upside'
  label: string
  items: string[]
}) {
  const styles = {
    watch:  { card: 'bg-slate-50 border-slate-200', label: 'text-slate-600' },
    hedges: { card: 'bg-blue-50 border-blue-200',   label: 'text-blue-700' },
    upside: { card: 'bg-sky-50 border-sky-200',     label: 'text-sky-700' },
  }[tone]

  if (items.length === 0) {
    return (
      <div className="border rounded-lg p-3 bg-zinc-50 border-zinc-200">
        <div className="text-[10px] uppercase tracking-wider font-mono font-semibold text-zinc-400">{label}</div>
        <div className="text-sm text-zinc-400 mt-1 italic">None identified</div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-3 ${styles.card}`}>
      <div className={`text-[10px] uppercase tracking-wider font-mono font-semibold ${styles.label}`}>{label}</div>
      <div className="text-sm font-mono text-zinc-900 mt-1 leading-snug">
        {items.join(', ')}
      </div>
    </div>
  )
}

export function NarrativeBrief({ macroTrend, brief }: NarrativeBriefProps) {
  const [copied, setCopied] = useState(false)

  const pct = Math.round(brief.avgConfidence * 100)

  function copyAsSlack() {
    const lines = [
      `*Macro Impact: ${macroTrend}*`,
      brief.paragraph.replace(/\[([A-Z0-9=.]+)\]/g, '`$1`'),
      '',
      `*Watch closely:* ${brief.watchClosely.map((t) => `\`${t}\``).join(' ')}`,
      `*Hedges:* ${brief.hedges.map((t) => `\`${t}\``).join(' ')}`,
      `*Possible upside:* ${brief.upside.map((t) => `\`${t}\``).join(' ')}`,
      '',
      `_Confidence ${pct}% · Not investment advice_`,
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
      {/* Action buttons row */}
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

      {/* Main brief card */}
      <Card className="overflow-hidden">
        {/* Header strip */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-baseline gap-3 min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono shrink-0">Brief</div>
          <h2 className="text-lg font-semibold text-zinc-900 truncate">{macroTrend}</h2>
        </div>

        {/* Hero — paragraph + buckets */}
        <div className="px-6 py-5 space-y-4 bg-gradient-to-b from-emerald-50/30 to-white">
          <p className="text-base text-zinc-800 leading-relaxed">
            {parseParagraph(brief.paragraph)}
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <Bucket tone="watch"  label="Watch closely"      items={brief.watchClosely} />
            <Bucket tone="hedges" label="Hedges to consider" items={brief.hedges} />
            <Bucket tone="upside" label="Possible upside"    items={brief.upside} />
          </div>
        </div>

        {/* Questions */}
        <div className="px-6 py-4 border-t border-zinc-100">
          <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium mb-2">
            Questions to investigate
          </div>
          <div className="space-y-1">
            {brief.questions.map((q, i) => (
              <div
                key={i}
                className="w-full text-left text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-md px-2 py-1.5 transition-colors flex items-start gap-2"
              >
                <span className="text-emerald-500 mt-0.5 shrink-0">→</span>
                <span>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Confidence + caveats strip */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/15 flex items-center justify-center shrink-0">
            <span className="font-mono font-bold text-emerald-400 text-sm">{pct}%</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-200">Avg confidence</div>
            <div className="text-[11px] text-zinc-500 truncate">
              {brief.avgConfidence >= 0.75 ? 'Mostly high' : brief.avgConfidence >= 0.45 ? 'Mixed signals' : 'Low — treat with caution'}
            </div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-yellow-500/10 flex items-center justify-center shrink-0">
            <span className="text-yellow-400 text-sm">⚠</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-200">Tail risk</div>
            <div className="text-[11px] text-zinc-500 leading-snug line-clamp-2">{brief.tailRisk}</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
