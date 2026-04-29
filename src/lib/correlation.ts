import { sampleCorrelation } from 'simple-statistics'
import type { PricePoint } from './yahoo-finance'
import type { CorrelationResult } from './types'

/**
 * Convert a series of prices to weekly log returns.
 * r_t = ln(P_t / P_{t-1})
 * Stationary series required for valid Pearson r.
 */
export function toWeeklyLogReturns(prices: number[]): number[] {
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]
    const curr = prices[i]
    if (prev > 0 && curr > 0) returns.push(Math.log(curr / prev))
  }
  return returns
}

function extractLogReturns(prices: PricePoint[]): number[] {
  return toWeeklyLogReturns(prices.map((p) => p.close))
}

function alignByDate(
  a: PricePoint[],
  b: PricePoint[],
): { aAligned: PricePoint[]; bAligned: PricePoint[] } {
  const bMap = new Map(b.map((p) => [p.date, p]))
  const aAligned: PricePoint[] = []
  const bAligned: PricePoint[] = []
  for (const point of a) {
    const match = bMap.get(point.date)
    if (match) {
      aAligned.push(point)
      bAligned.push(match)
    }
  }
  return { aAligned, bAligned }
}

export function computeCorrelation(
  stockPrices: PricePoint[],
  indicatorPrices: PricePoint[],
  indicatorTicker: string,
  indicatorName: string,
): CorrelationResult {
  const { aAligned, bAligned } = alignByDate(stockPrices, indicatorPrices)
  if (aAligned.length < 10) {
    return { indicatorTicker, indicatorName, correlation: 0, dataPoints: aAligned.length }
  }
  // Use weekly log returns — stationary series, avoids spurious correlation from trending levels
  const stockRets = extractLogReturns(aAligned)
  const indicatorRets = extractLogReturns(bAligned)
  if (stockRets.length < 5) {
    return { indicatorTicker, indicatorName, correlation: 0, dataPoints: stockRets.length }
  }
  try {
    const r = sampleCorrelation(stockRets, indicatorRets)
    const correlation = isFinite(r) ? Math.round(r * 1000) / 1000 : 0

    const normalizedStock = normalizePrices(aAligned)
    const normalizedIndicator = normalizePrices(bAligned)
    const chartData = normalizedStock.map((p, i) => ({
      date: p.date,
      stock: p.close,
      indicator: normalizedIndicator[i].close,
    }))

    return { indicatorTicker, indicatorName, correlation, dataPoints: stockRets.length, chartData }
  } catch {
    return { indicatorTicker, indicatorName, correlation: 0, dataPoints: 0 }
  }
}

// Normalize prices to a base of 100 for chart display (rebased to 100)
export function normalizePrices(prices: PricePoint[]): PricePoint[] {
  if (prices.length === 0) return []
  const base = prices[0].close
  if (base === 0) return prices
  return prices.map((p) => ({ date: p.date, close: Math.round((p.close / base) * 100 * 100) / 100 }))
}

/**
 * Compute a weighted impact score from correlation data and directional estimates.
 *
 * Weights per indicator:
 *   direct     → 2x  (most causally linked)
 *   indirect   → 1x  (default)
 *   macro_noise → 0.5x (broad beta, not specifically relevant)
 *
 * Mismatch discount:
 *   correlationMismatchWarning → additional 0.5x (demand-driven correlation in supply-shock scenario)
 *
 * Final score = weighted_mean(r_i * d_i) * 5, clamped to [-5, 5]
 */
export function computeImpactScore(correlations: CorrelationResult[]): number | null {
  const withData = correlations.filter((c) => c.dataPoints >= 5)
  if (withData.length === 0) return null

  const directed = withData.filter((c) => c.direction !== undefined && c.direction !== 0)
  if (directed.length > 0) {
    let weightedSum = 0
    let weightSum = 0
    for (const c of directed) {
      let weight = 1
      if (c.indicatorClassification === 'direct') weight = 2
      else if (c.indicatorClassification === 'macro_noise') weight = 0.5
      if (c.correlationMismatchWarning) weight *= 0.5
      weightedSum += c.correlation * (c.direction ?? 0) * weight
      weightSum += weight
    }
    if (weightSum === 0) return null
    return Math.max(-5, Math.min(5, (weightedSum / weightSum) * 5))
  }

  // Graceful fallback when direction estimation failed
  const sum = withData.reduce((acc, c) => acc + c.correlation, 0)
  return Math.max(-5, Math.min(5, (sum / withData.length) * 5))
}
