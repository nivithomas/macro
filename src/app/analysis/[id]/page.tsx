'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import type { AnalysisRecord, StockResult, Indicator, SSEEvent, AnalysisBrief } from '@/lib/types'
import { ImpactCard, ImpactBar } from '@/components/ImpactCard'
import { PortfolioSummary } from '@/components/PortfolioSummary'
import { NarrativeBrief } from '@/components/NarrativeBrief'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface Props {
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// Sub-components for the two-column live view
// ---------------------------------------------------------------------------

function StepRow({ message, done }: { message: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
      ) : (
        <span className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
      )}
      <span className={`text-sm ${done ? 'text-zinc-400' : 'text-zinc-700'}`}>{message}</span>
    </div>
  )
}

function CompactResultRow({ result }: { result: StockResult }) {
  const scoreStr = result.impactScore > 0
    ? `+${result.impactScore.toFixed(1)}`
    : result.impactScore.toFixed(1)
  const scoreColor = result.impactScore > 1 ? 'text-emerald-600'
    : result.impactScore < -1 ? 'text-orange-500'
    : 'text-yellow-500'
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ animation: 'row-in 0.3s ease-out both' }}
    >
      <span className="font-mono text-xs font-semibold text-emerald-700 w-14 shrink-0">{result.ticker}</span>
      <span className="text-xs text-zinc-500 flex-1 truncate min-w-0">{result.name}</span>
      <ImpactBar score={result.impactScore} />
      <span className={`font-mono text-xs font-bold w-10 text-right shrink-0 ${scoreColor}`}>{scoreStr}</span>
    </div>
  )
}

function PlaceholderRow({ ticker, name }: { ticker: string; name?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 opacity-35">
      <span className="font-mono text-xs font-semibold text-emerald-700 w-14 shrink-0">{ticker}</span>
      {name && <span className="text-xs text-zinc-500 flex-1 truncate min-w-0">{name}</span>}
      <span className="flex-1" />
      <span className="w-3 h-3 rounded-full border border-zinc-400 border-t-transparent animate-spin shrink-0" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysisPage({ params }: Props) {
  const { id } = use(params)
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null)
  const [results, setResults] = useState<StockResult[]>([])
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [steps, setSteps] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState('')
  const [status, setStatus] = useState<'loading' | 'running' | 'complete' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [threshold, setThreshold] = useState(0.2)
  const [brief, setBrief] = useState<AnalysisBrief | null>(null)
  const [briefError, setBriefError] = useState(false)
  const [thinkingSnippet, setThinkingSnippet] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const streamStartRef = useRef<number>(0)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const res = await fetch(`/api/analysis/${id}`)
      if (!res.ok) { setStatus('error'); setErrorMessage('Analysis not found'); return }
      const data = await res.json() as AnalysisRecord
      if (cancelled) return
      setAnalysis(data)

      if (data.status === 'complete' || data.status === 'error') {
        setResults(data.results ?? [])
        setIndicators(data.indicators ?? [])
        setStatus(data.status === 'error' ? 'error' : 'complete')
        setErrorMessage(data.errorMessage ?? '')
        if (data.brief) setBrief(data.brief)
        return
      }

      setStatus('running')
      streamStartRef.current = Date.now()
      const es = new EventSource(`/api/analysis/${id}/stream`)
      eventSourceRef.current = es

      es.onmessage = (event: MessageEvent) => {
        if (cancelled) return
        const evt = JSON.parse(event.data as string) as SSEEvent
        if (evt.type === 'step') {
          setCurrentStep(evt.message)
          setSteps((prev) => {
            if (prev[prev.length - 1] !== evt.message) return [...prev, evt.message]
            return prev
          })
        } else if (evt.type === 'thinking') {
          setThinkingSnippet(evt.snippet)
        } else if (evt.type === 'indicators') {
          setIndicators(evt.indicators)
        } else if (evt.type === 'result') {
          setResults((prev) => [...prev, evt.result])
        } else if (evt.type === 'complete') {
          setStatus('complete')
          setCurrentStep('')
          es.close()
        } else if (evt.type === 'error') {
          setStatus('error')
          setErrorMessage(evt.message)
          es.close()
        }
      }
      es.onerror = () => {
        if (!cancelled) { setStatus('error'); setErrorMessage('Connection lost') }
        es.close()
      }
    }

    init()
    return () => {
      cancelled = true
      eventSourceRef.current?.close()
    }
  }, [id])

  // Elapsed timer while running
  useEffect(() => {
    if (status !== 'running') return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - streamStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [status])

  // Fetch brief once analysis is complete (skip if already loaded from persisted record)
  useEffect(() => {
    if (status !== 'complete' || brief) return
    const validCount = results.filter((r) => !r.error).length
    if (validCount === 0) return
    fetch(`/api/analysis/${id}/brief`, { method: 'POST' })
      .then((r) => r.json())
      .then((data: AnalysisBrief) => {
        if (data && data.paragraph) setBrief(data)
        else setBriefError(true)
      })
      .catch(() => setBriefError(true))
  }, [status, brief, id, results])

  const total = analysis?.stockUniverse.length ?? 0
  const sortedResults = [...results].sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore))
  const queuedStocks = analysis?.stockUniverse.filter(
    (s) => !results.find((r) => r.ticker === s.ticker),
  ) ?? []

  // ETA: only show once at least 1 result is in
  const remaining = results.length > 0 && elapsed > 0
    ? Math.max(0, Math.round((elapsed / results.length) * (total - results.length)))
    : null

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors">
        ← New analysis
      </Link>

      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-2.5 mb-2">
          {status === 'running' && <Badge variant="indigo">Analyzing…</Badge>}
          {status === 'complete' && <Badge variant="green">Complete</Badge>}
          {status === 'error' && <Badge variant="red">Error</Badge>}
          {analysis && (
            <span className="text-sm text-zinc-400">
              {analysis.stockUniverse.length} stocks · {new Date(analysis.createdAt).toLocaleString()}
            </span>
          )}
        </div>
        <h1 className="text-xl font-semibold text-zinc-900">
          {analysis?.macroTrend ?? 'Loading…'}
        </h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column live stream panel — visible while running                */}
      {/* ------------------------------------------------------------------ */}
      {status === 'running' && (
        <div className="space-y-3">
          {/* Header strip */}
          <div className="flex items-center gap-3 flex-wrap text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="font-medium text-zinc-700">Analyzing</span>
            </div>
            <span>{total} stocks</span>
            {indicators.length > 0 && <span>· {indicators.length} indicators</span>}
            <span>· {elapsed}s elapsed</span>
            {remaining !== null && (
              <span className="ml-auto text-zinc-400">est. {remaining}s remaining</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Left: Thought process */}
            <Card>
              <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">Thought process</span>
                <span className="text-[10px] text-zinc-400 font-mono">claude-sonnet-4.6</span>
              </div>
              <div className="p-5 space-y-3">
                {steps.map((s, i) => (
                  <StepRow key={i} message={s} done={s !== currentStep} />
                ))}
                {steps.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin shrink-0" />
                    Starting…
                  </div>
                )}
              </div>
              {thinkingSnippet && (
                <div className="border-t border-zinc-100 px-5 py-3 bg-zinc-50/60">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium mb-1.5">
                    Currently considering
                  </p>
                  <p className="text-xs font-mono text-zinc-500 leading-relaxed line-clamp-5 break-words">
                    {thinkingSnippet}
                    <span className="inline-block w-1.5 h-3 bg-zinc-400 ml-0.5 align-middle animate-pulse" />
                  </p>
                </div>
              )}
            </Card>

            {/* Right: Streaming results */}
            <Card>
              <div className="px-5 py-3 border-b border-zinc-100">
                <span className="text-sm font-medium text-zinc-700">
                  Results
                  <span className="ml-1.5 text-zinc-400 font-normal">
                    {results.length} of {total} ready
                  </span>
                </span>
              </div>
              <div className="divide-y divide-zinc-100">
                {results.map((r) => (
                  <CompactResultRow key={r.ticker} result={r} />
                ))}
                {queuedStocks.map((s) => (
                  <PlaceholderRow key={s.ticker} ticker={s.ticker} name={s.name} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && errorMessage && (
        <Card className="p-5 border-red-200 bg-red-50">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </Card>
      )}

      {/* Indicators */}
      {indicators.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Relevant market indicators</h3>
          <div className="flex flex-wrap gap-1.5">
            {indicators.map((ind, i) => (
              <span
                key={ind.ticker}
                title={ind.relevanceReason}
                className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1 text-xs shadow-sm"
                style={{
                  animation: 'chip-in 0.3s ease-out both',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span className="font-mono font-semibold text-emerald-700">{ind.ticker}</span>
                <span className="text-zinc-500">{ind.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  ind.type === 'commodity' ? 'bg-amber-400' :
                  ind.type === 'currency' ? 'bg-blue-400' :
                  ind.type === 'index' ? 'bg-emerald-500' : 'bg-zinc-400'
                }`} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Score legend — shown once results start arriving */}
      {results.length > 0 && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-xs text-zinc-500 flex flex-wrap gap-4 items-center">
          <span className="font-medium text-zinc-700 whitespace-nowrap">Impact score range:</span>
          <span className="text-red-600 font-medium">−5 Strongly Bearish</span>
          <span className="text-zinc-400">·</span>
          <span className="text-yellow-600 font-medium">0 Neutral</span>
          <span className="text-zinc-400">·</span>
          <span className="text-emerald-600 font-medium">+5 Strongly Bullish</span>
          <span className="text-zinc-400 ml-auto">Score = weighted Pearson r × expected indicator direction. Not investment advice.</span>
        </div>
      )}

      {/* Threshold slider */}
      {results.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3">
            <label className="text-xs font-medium text-zinc-500 whitespace-nowrap">
              Signal threshold — min |r|
            </label>
            <input
              type="range"
              min={0.1}
              max={0.6}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-600"
            />
            <span className="text-xs font-mono font-semibold text-emerald-700 w-8 text-right">{threshold.toFixed(2)}</span>
          </div>
          <p className="text-xs text-zinc-400 px-1">
            Pearson |r| measures historical co-movement between 0 and 1. Higher = stronger historical relationship. 0.20 is a common minimum threshold for a signal worth examining.
          </p>
        </div>
      )}

      {/* Narrative brief — shown when complete and at least one valid result */}
      {status === 'complete' && results.some((r) => !r.error) && (
        brief
          ? <NarrativeBrief macroTrend={analysis?.macroTrend ?? ''} brief={brief} />
          : briefError
            ? <p className="text-xs text-zinc-600 italic">Could not generate summary.</p>
            : (
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" />
                Generating brief…
              </div>
            )
      )}

      {/* Portfolio exposure summary */}
      {results.length > 0 && <PortfolioSummary results={results} threshold={threshold} />}

      {/* Results */}
      {sortedResults.length > 0 && (
        <div className="space-y-3">
          {sortedResults.map((result) => (
            <div key={result.ticker} id={result.ticker}>
              <ImpactCard result={result} threshold={threshold} />
            </div>
          ))}
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-transparent animate-spin" />
          <span className="text-sm">Loading analysis…</span>
        </div>
      )}
    </div>
  )
}
