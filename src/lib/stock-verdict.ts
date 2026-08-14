import type { StockResult } from './types'

export interface StockVerdict {
  headline: string
  subline: string
  color: string
}

function scoreMagnitude(score: number): 'significantly' | 'modestly' | 'minimally' {
  const abs = Math.abs(score)
  if (abs >= 3) return 'significantly'
  if (abs >= 1) return 'modestly'
  return 'minimally'
}

export function buildVerdictSubline(result: StockResult): string {
  const parts: string[] = []
  if (result.timeHorizon) {
    parts.push(`Estimate for the next ${result.timeHorizon}`)
  }
  const confLabel = result.confidence === 'high'
    ? 'High confidence'
    : result.confidence === 'medium'
    ? 'Medium confidence'
    : 'Low confidence'
  parts.push(confLabel)
  if (!result.quantReliable) {
    parts.push('qualitative assessment — correlations less reliable here')
  } else if (result.weakCausalLink) {
    parts.push('weak link to historical indicators')
  }
  return parts.join(' · ')
}

function directionalVerdict(score: number, result: StockResult): StockVerdict {
  const subline = buildVerdictSubline(result)
  if (score >= 1) {
    return {
      headline: `Stock price might rise ${scoreMagnitude(score)}`,
      subline,
      color: 'text-emerald-600',
    }
  }
  if (score <= -1) {
    return {
      headline: `Stock price might drop ${scoreMagnitude(score)}`,
      subline,
      color: 'text-red-600',
    }
  }
  return {
    headline: 'Stock price may see little change',
    subline,
    color: 'text-yellow-600',
  }
}

function qualitativeVerdict(result: StockResult): StockVerdict {
  const subline = buildVerdictSubline(result)
  const dims = [result.historicalPatterns.impact, result.businessModel.impact, result.supplyChain.impact]
  const pos = dims.filter((d) => d === 'positive').length
  const neg = dims.filter((d) => d === 'negative').length + dims.filter((d) => d === 'mixed').length * 0.5
  if (pos > neg) {
    return { headline: 'Stock price might rise', subline, color: 'text-emerald-600' }
  }
  if (neg > pos) {
    return { headline: 'Stock price might drop', subline, color: 'text-red-600' }
  }
  return { headline: 'Stock price may see little change', subline, color: 'text-yellow-600' }
}

export function buildStockVerdict(result: StockResult): StockVerdict {
  if (result.confidence === 'low') {
    return {
      headline: 'Not enough signal for a directional estimate',
      subline: buildVerdictSubline(result),
      color: 'text-zinc-500',
    }
  }
  if (result.quantReliable) {
    return directionalVerdict(result.impactScore, result)
  }
  return qualitativeVerdict(result)
}

export function sortResultsForGlance(results: StockResult[]): StockResult[] {
  return [...results].sort((a, b) => {
    if (a.error && !b.error) return 1
    if (!a.error && b.error) return -1
    const aLow = a.confidence === 'low' ? 1 : 0
    const bLow = b.confidence === 'low' ? 1 : 0
    if (aLow !== bLow) return aLow - bLow
    return Math.abs(b.impactScore) - Math.abs(a.impactScore)
  })
}
