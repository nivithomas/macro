import type { AnalysisBrief, BriefBucketItem, StockResult } from './types'

export interface EnrichedBriefItem {
  display: string
  tooltip: string
}

function trimTooltip(text: string): string {
  return text.trim()
}

function reasonForWatch(stock: StockResult): string {
  if (stock.overallReasoning) return trimTooltip(stock.overallReasoning)
  const dim = [stock.supplyChain, stock.businessModel, stock.historicalPatterns]
    .find((d) => d.impact === 'negative' || d.impact === 'mixed')
  if (dim?.summary) return trimTooltip(dim.summary)
  return `${stock.ticker} is among the most exposed names in this scenario.`
}

function reasonForUpside(stock: StockResult): string {
  if (stock.overallReasoning) return trimTooltip(stock.overallReasoning)
  const dim = [stock.businessModel, stock.supplyChain, stock.historicalPatterns]
    .find((d) => d.impact === 'positive')
  if (dim?.summary) return trimTooltip(dim.summary)
  return `${stock.ticker} may benefit relative to more exposed peers.`
}

function reasonForHedge(
  action: string,
  instrument: string,
  stock: StockResult | undefined,
  briefReason: string,
): string {
  if (briefReason) return trimTooltip(briefReason)
  if (stock) {
    const corr = stock.correlations.find(
      (c) => instrument.toUpperCase().includes(c.indicatorTicker.toUpperCase())
        || c.indicatorTicker.toUpperCase().includes(instrument.toUpperCase()),
    )
    if (corr?.directionReasoning) return trimTooltip(corr.directionReasoning)
    if (stock.hedgeBookNote) return trimTooltip(stock.hedgeBookNote)
    return trimTooltip(`${action} ${instrument} to offset ${stock.ticker} exposure in this scenario. ${reasonForWatch(stock)}`)
  }
  return `${action} ${instrument} may help offset portfolio risk in this scenario.`
}

function findStock(results: StockResult[], tickerOrLabel: string): StockResult | undefined {
  const upper = tickerOrLabel.toUpperCase()
  return results.find((r) => r.ticker.toUpperCase() === upper)
}

function extractTicker(label: string): string | null {
  const m = label.match(/\b([A-Z][A-Z0-9.=-]{1,12})\b/)
  return m?.[1] ?? null
}

function findStockForIndicator(instrument: string, results: StockResult[]): StockResult | undefined {
  const key = instrument.toUpperCase()
  let best: StockResult | undefined
  let worstScore = Infinity
  for (const r of results) {
    if (r.error) continue
    const match = r.correlations.some(
      (c) => c.indicatorTicker.toUpperCase() === key || c.indicatorTicker.toUpperCase().includes(key),
    )
    if (!match || r.impactScore >= worstScore) continue
    worstScore = r.impactScore
    best = r
  }
  return best
}

function enrichWatchItem(item: BriefBucketItem, results: StockResult[]): EnrichedBriefItem | null {
  const ticker = extractTicker(item.label) ?? item.label
  const stock = findStock(results, ticker)
  if (!stock) return null
  return {
    display: stock.ticker,
    tooltip: trimTooltip(item.reason || reasonForWatch(stock)),
  }
}

function enrichUpsideItem(item: BriefBucketItem, results: StockResult[]): EnrichedBriefItem | null {
  const ticker = extractTicker(item.label) ?? item.label
  const stock = findStock(results, ticker)
  if (!stock) return null
  return {
    display: stock.ticker,
    tooltip: trimTooltip(item.reason || reasonForUpside(stock)),
  }
}

function enrichHedgeItem(
  item: BriefBucketItem,
  results: StockResult[],
  watchTickers: string[],
): EnrichedBriefItem | null {
  const trimmed = item.label.trim()
  const forMatch = trimmed.match(/^(Long|Short)\s+(.+?)\s+for\s+([A-Z0-9.=-]+)$/i)
  if (forMatch) {
    const action = forMatch[1][0].toUpperCase() + forMatch[1].slice(1).toLowerCase()
    const instrument = forMatch[2].trim()
    const stockTicker = forMatch[3].toUpperCase()
    const stock = findStock(results, stockTicker)
    return {
      display: `${action} ${instrument} for ${stockTicker}`,
      tooltip: reasonForHedge(action, instrument, stock, item.reason),
    }
  }

  const actionMatch = trimmed.match(/^(Long|Short)\s+(.+)$/i)
  if (actionMatch) {
    const action = actionMatch[1][0].toUpperCase() + actionMatch[1].slice(1).toLowerCase()
    const instrument = actionMatch[2].trim()
    const instrumentTicker = extractTicker(instrument) ?? instrument
    const stockFromInstrument = findStock(results, instrumentTicker)
    const stock = stockFromInstrument
      ?? findStockForIndicator(instrument, results)
      ?? watchTickers.map((t) => findStock(results, t)).find(Boolean)
    const stockTicker = stock?.ticker ?? watchTickers[0] ?? instrumentTicker
    return {
      display: `${action} ${instrument} for ${stockTicker}`,
      tooltip: reasonForHedge(action, instrument, stock, item.reason),
    }
  }

  const stock = findStock(results, trimmed)
  if (!stock) return null
  return {
    display: stock.ticker,
    tooltip: trimTooltip(item.reason || reasonForWatch(stock)),
  }
}

function deriveWatch(results: StockResult[]): EnrichedBriefItem[] {
  return results
    .filter((r) => !r.error && r.impactScore < 0)
    .sort((a, b) => a.impactScore - b.impactScore)
    .slice(0, 3)
    .map((stock) => ({
      display: stock.ticker,
      tooltip: reasonForWatch(stock),
    }))
}

function deriveUpside(results: StockResult[]): EnrichedBriefItem[] {
  return results
    .filter((r) => !r.error && r.impactScore > 0)
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3)
    .map((stock) => ({
      display: stock.ticker,
      tooltip: reasonForUpside(stock),
    }))
}

function deriveHedges(results: StockResult[], watchItems: EnrichedBriefItem[]): EnrichedBriefItem[] {
  const watchTickers = watchItems
    .map((w) => extractTicker(w.display))
    .filter((t): t is string => !!t)

  const hedges: EnrichedBriefItem[] = []
  for (const ticker of watchTickers.slice(0, 2)) {
    const stock = findStock(results, ticker)
    if (!stock) continue
    const direct = stock.correlations
      .filter((c) => c.indicatorClassification === 'direct' || Math.abs(c.correlation) >= 0.25)
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0]
    if (direct) {
      hedges.push({
        display: `Long ${direct.indicatorTicker} for ${stock.ticker}`,
        tooltip: reasonForHedge('Long', direct.indicatorTicker, stock, direct.directionReasoning ?? ''),
      })
    }
  }
  return hedges
}

export function enrichBriefBuckets(
  brief: AnalysisBrief,
  results: StockResult[],
): {
  watchClosely: EnrichedBriefItem[]
  hedges: EnrichedBriefItem[]
  upside: EnrichedBriefItem[]
} {
  const valid = results.filter((r) => !r.error)
  const portfolioTickers = valid.map((r) => r.ticker.toUpperCase())
  const watchTickers = brief.watchClosely
    .map((i) => extractTicker(i.label) ?? i.label)
    .filter((t) => portfolioTickers.includes(t.toUpperCase()))

  let watchClosely = brief.watchClosely
    .map((item) => enrichWatchItem(item, valid))
    .filter((item): item is EnrichedBriefItem => item !== null)
  let upside = brief.upside
    .map((item) => enrichUpsideItem(item, valid))
    .filter((item): item is EnrichedBriefItem => item !== null)
  let hedges = brief.hedges
    .map((item) => enrichHedgeItem(item, valid, watchTickers))
    .filter((item): item is EnrichedBriefItem => item !== null)

  if (watchClosely.length === 0) watchClosely = deriveWatch(valid)
  if (upside.length === 0) upside = deriveUpside(valid)
  if (hedges.length === 0) hedges = deriveHedges(valid, watchClosely)

  return { watchClosely, hedges, upside }
}
