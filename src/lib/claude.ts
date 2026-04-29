import Anthropic from '@anthropic-ai/sdk'
import type { Indicator, DimensionAnalysis, CorrelationResult, StockResult, AnalysisBrief } from './types'
import type { CompanyProfile } from './yahoo-finance'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function extractJson<T>(text: string): T | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (!match) return null
  try {
    return JSON.parse(match[1] ?? match[0]) as T
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Scenario type classification
// ---------------------------------------------------------------------------

export type ScenarioType = 'rates' | 'fx' | 'energy_direct' | 'input_cost_shock' | 'demand_shock' | 'geopolitical' | 'other'

export interface ScenarioClassification {
  scenarioType: ScenarioType
  quantReliable: boolean
  quantWarning: string | null
}

const QUANT_UNRELIABLE_WARNINGS: Record<ScenarioType, string> = {
  input_cost_shock: 'Input cost shocks affect hedged companies with a lag — historical price correlations understate the fundamental impact.',
  demand_shock: 'Demand shocks affect revenue with a delay that weekly return correlations do not reliably capture.',
  geopolitical: 'Geopolitical events reprice stocks through sentiment and uncertainty, not through mechanisms captured in 2-year return correlations.',
  other: 'This scenario type does not map cleanly to tradeable market indicators, so correlation-based scores may be unreliable.',
  // quant-reliable types — not used but required for exhaustive record
  rates: '',
  fx: '',
  energy_direct: '',
}

export async function classifyScenarioType(macroTrend: string): Promise<ScenarioClassification> {
  const prompt = `Classify the following macro trend into exactly one scenario type.

MACRO TREND: "${macroTrend}"

SCENARIO TYPES:
- rates: Central bank policy moves, interest rate changes, yield curve shifts, bond market events
- fx: Currency devaluations, exchange rate regime changes, dollar strength/weakness events
- energy_direct: Oil/gas supply or demand shocks, OPEC decisions, energy infrastructure events
- input_cost_shock: Agricultural commodity shortages, raw material supply disruptions, shipping/logistics shocks — where the mechanism is cost pass-through to companies with a lag
- demand_shock: Consumer demand collapse or surge, recession, stimulus-driven spending — where the mechanism is revenue change with a delay
- geopolitical: Wars, sanctions, political instability, trade wars — where the mechanism is sentiment and uncertainty rather than a direct price channel
- other: Any scenario that does not fit the above

Return ONLY valid JSON with a single "scenarioType" field:
{ "scenarioType": "<type>" }`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 64,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = extractJson<{ scenarioType: ScenarioType }>(text)

  const VALID_TYPES: ScenarioType[] = ['rates', 'fx', 'energy_direct', 'input_cost_shock', 'demand_shock', 'geopolitical', 'other']
  const scenarioType: ScenarioType = parsed?.scenarioType && VALID_TYPES.includes(parsed.scenarioType)
    ? parsed.scenarioType
    : 'other'

  const quantReliable = scenarioType === 'rates' || scenarioType === 'fx' || scenarioType === 'energy_direct'
  const quantWarning = quantReliable ? null : QUANT_UNRELIABLE_WARNINGS[scenarioType]

  return { scenarioType, quantReliable, quantWarning }
}

// ---------------------------------------------------------------------------
// Hardcoded indicator categories — no hallucination risk
// ---------------------------------------------------------------------------

const INDICATOR_CATEGORIES: Record<string, Indicator[]> = {
  rates: [
    { ticker: 'TLT',           name: 'iShares 20Y Treasury ETF',          type: 'index',     relevanceReason: 'Benchmark for long-duration interest rate moves' },
    { ticker: '^TNX',          name: '10-Year Treasury Yield',             type: 'index',     relevanceReason: 'Risk-free rate benchmark affecting all asset valuations' },
    { ticker: 'FRED:T10Y2Y',   name: '10Y-2Y Yield Spread',               type: 'index',     relevanceReason: 'Yield curve shape — leading indicator of recession risk' },
    { ticker: 'FRED:T10YIE',   name: '10Y Breakeven Inflation',            type: 'index',     relevanceReason: 'Market-implied inflation expectations from TIPS spreads' },
  ],
  energy: [
    { ticker: 'CL=F',    name: 'Crude Oil Futures (WTI)',            type: 'commodity', relevanceReason: 'Global energy benchmark' },
    { ticker: 'NG=F',    name: 'Natural Gas Futures',                type: 'commodity', relevanceReason: 'Energy input cost for industrial and utility sectors' },
    { ticker: 'XLE',     name: 'Energy Select Sector ETF',           type: 'index',     relevanceReason: 'Broad US energy sector performance' },
  ],
  commodities_ag: [
    { ticker: 'ZC=F',    name: 'Corn Futures',                       type: 'commodity', relevanceReason: 'Key agricultural commodity and animal feed input' },
    { ticker: 'ZW=F',    name: 'Wheat Futures',                      type: 'commodity', relevanceReason: 'Global food staple price benchmark' },
    { ticker: 'ZS=F',    name: 'Soybean Futures',                    type: 'commodity', relevanceReason: 'Major oilseed and feed commodity' },
    { ticker: 'KC=F',    name: 'Coffee Futures',                     type: 'commodity', relevanceReason: 'Soft commodity price benchmark' },
  ],
  commodities_metals: [
    { ticker: 'GC=F',    name: 'Gold Futures',                       type: 'commodity', relevanceReason: 'Safe haven and inflation hedge' },
    { ticker: 'HG=F',    name: 'Copper Futures',                     type: 'commodity', relevanceReason: 'Industrial activity barometer' },
    { ticker: 'SI=F',    name: 'Silver Futures',                     type: 'commodity', relevanceReason: 'Precious and industrial metal' },
  ],
  fx: [
    { ticker: 'DX-Y.NYB', name: 'US Dollar Index',                   type: 'currency',  relevanceReason: 'Broad USD strength vs major currencies' },
    { ticker: 'EURUSD=X', name: 'EUR/USD',                           type: 'currency',  relevanceReason: 'Euro vs dollar exchange rate' },
    { ticker: 'CNY=X',    name: 'USD/CNY',                           type: 'currency',  relevanceReason: 'Chinese yuan vs dollar' },
  ],
  credit: [
    { ticker: 'HYG',                  name: 'High Yield Corporate Bond ETF',      type: 'index', relevanceReason: 'Credit risk appetite' },
    { ticker: 'LQD',                  name: 'Investment Grade Corporate Bond ETF', type: 'index', relevanceReason: 'IG credit spreads' },
    { ticker: '^VIX',                 name: 'CBOE Volatility Index',              type: 'index', relevanceReason: 'Market fear and risk-off sentiment' },
    { ticker: 'FRED:BAMLH0A0HYM2',   name: 'High Yield Credit Spread',           type: 'index', relevanceReason: 'OAS spread for HY bonds — direct measure of credit stress' },
  ],
  equities: [
    { ticker: '^GSPC',   name: 'S&P 500',                            type: 'index',     relevanceReason: 'Broad US equity market benchmark' },
    { ticker: '^VIX',    name: 'CBOE Volatility Index',              type: 'index',     relevanceReason: 'Market volatility and risk sentiment' },
    { ticker: 'EEM',     name: 'iShares MSCI Emerging Markets ETF',  type: 'index',     relevanceReason: 'Emerging market equity exposure' },
  ],
  inflation: [
    { ticker: 'TIP',     name: 'iShares TIPS Bond ETF',              type: 'index',     relevanceReason: 'Inflation expectations in bond markets' },
    { ticker: 'GC=F',    name: 'Gold Futures',                       type: 'commodity', relevanceReason: 'Traditional inflation hedge' },
    { ticker: 'CL=F',    name: 'Crude Oil Futures (WTI)',            type: 'commodity', relevanceReason: 'Energy-driven inflation component' },
    { ticker: 'DX-Y.NYB', name: 'US Dollar Index',                   type: 'currency',  relevanceReason: 'Dollar strength inverse to imported inflation' },
  ],
}

const VALID_CATEGORIES = Object.keys(INDICATOR_CATEGORIES)

async function classifyMacroEvent(macroTrend: string): Promise<string[]> {
  const prompt = `Classify this macro trend into one or more of the following categories. Return only the categories that are genuinely relevant (max 3).

MACRO TREND: "${macroTrend}"

CATEGORIES:
- rates: interest rate moves, central bank policy, bond market, yield curve
- energy: oil, gas, power supply/demand, energy transition
- commodities_ag: agricultural commodities, food supply, crop events, livestock
- commodities_metals: metals, mining, gold, copper, precious metals
- fx: currency moves, exchange rate events, trade flows, dollar strength
- credit: corporate credit, defaults, leverage, risk appetite, spreads
- equities: broad stock market events, sector rotation, risk-on/risk-off
- inflation: price level, CPI, purchasing power, cost of living

Return ONLY a JSON array of category names, e.g.: ["energy", "fx"]`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 128,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const categories = extractJson<string[]>(text) ?? []
  return categories.filter((c) => VALID_CATEGORIES.includes(c))
}

export async function identifyIndicators(macroTrend: string): Promise<Indicator[]> {
  const categories = await classifyMacroEvent(macroTrend)
  const active = categories.length > 0 ? categories : ['equities', 'fx']

  const seen = new Set<string>()
  const indicators: Indicator[] = []
  for (const cat of active) {
    for (const ind of INDICATOR_CATEGORIES[cat] ?? []) {
      if (!seen.has(ind.ticker)) {
        seen.add(ind.ticker)
        indicators.push(ind)
      }
    }
  }
  return indicators.slice(0, 6)
}

// ---------------------------------------------------------------------------
// Estimate directional impact of each indicator given the macro event
// ---------------------------------------------------------------------------

export interface IndicatorDirection {
  direction: number   // -1 to +1
  reasoning: string
}

export async function estimateIndicatorDirections(
  macroTrend: string,
  indicators: Indicator[],
): Promise<Record<string, IndicatorDirection>> {
  if (indicators.length === 0) return {}

  const indList = indicators
    .map((i) => `- ${i.ticker} (${i.name}): ${i.relevanceReason}`)
    .join('\n')

  const prompt = `Given this macro trend, estimate the expected directional move for each market indicator and explain the causal mechanism.

MACRO TREND: "${macroTrend}"

INDICATORS:
${indList}

For each indicator, assign:
- "direction": a number from -1.0 to +1.0
  - +1.0 = strongly expected to rise / appreciate given this macro event
  - -1.0 = strongly expected to fall / depreciate given this macro event
  -  0.0 = no expected directional effect
- "reasoning": 1–2 sentences tracing the exact causal chain from the macro event to this indicator's movement.

Return ONLY valid JSON mapping each ticker to an object with direction and reasoning:
{
  "CL=F": { "direction": 0.8, "reasoning": "Supply disruption reduces available oil, pushing spot prices up as buyers compete for scarce barrels." },
  "DX-Y.NYB": { "direction": -0.3, "reasoning": "Risk-off sentiment typically weakens the dollar modestly as investors move to safe-haven currencies." }
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  console.log('[estimateIndicatorDirections] raw response:', text)

  let raw: Record<string, { direction: number; reasoning: string }> = {}
  try {
    raw = extractJson<Record<string, { direction: number; reasoning: string }>>(text) ?? {}
    if (Object.keys(raw).length === 0) {
      console.warn('[estimateIndicatorDirections] extractJson returned empty object. Raw text was:', text)
    }
  } catch (err) {
    console.error('[estimateIndicatorDirections] parse error:', err, 'raw text:', text)
  }

  const directions: Record<string, IndicatorDirection> = {}
  for (const [ticker, val] of Object.entries(raw)) {
    if (val && typeof val.direction === 'number' && isFinite(val.direction)) {
      directions[ticker] = {
        direction: Math.max(-1, Math.min(1, val.direction)),
        reasoning: typeof val.reasoning === 'string' ? val.reasoning : '',
      }
    }
  }

  if (Object.keys(directions).length === 0) {
    console.warn('[estimateIndicatorDirections] no valid directions parsed — using 0 for all indicators')
    for (const ind of indicators) {
      directions[ind.ticker] = { direction: 0, reasoning: '' }
    }
  }

  return directions
}

// ---------------------------------------------------------------------------
// Stock impact analysis — returns narrative + classifications
// ---------------------------------------------------------------------------

export interface StockAnalysis {
  confidence: 'low' | 'medium' | 'high'
  timeHorizon: string
  historicalPatterns: DimensionAnalysis
  businessModel: DimensionAnalysis
  supplyChain: DimensionAnalysis
  overallReasoning: string
  historicalAnalog: string
  hedgeBookNote: string | null
  hedgeBookExposureType: 'commodity' | 'fx' | 'rates' | 'energy' | null
  epsSensitivity: string | null
  indicatorClassifications: Record<string, 'direct' | 'indirect' | 'macro_noise'>
  demandDrivenInSupplyShock: Record<string, boolean>
  error?: string
}

export async function analyzeStockImpact(
  macroTrend: string,
  duration: string,
  profile: CompanyProfile,
  correlations: CorrelationResult[],
  onThinking?: (ticker: string, snippet: string) => void,
): Promise<StockAnalysis> {
  const corrText = correlations
    .map((c) => `  - ${c.indicatorName} (${c.indicatorTicker}): r=${c.correlation} over ${c.dataPoints} weekly periods (Pearson r on weekly log returns), expected direction: ${c.direction !== undefined ? (c.direction > 0 ? `+${c.direction}` : String(c.direction)) : 'unknown'}`)
    .join('\n')

  const indicatorTickers = correlations.map((c) => `"${c.indicatorTicker}"`).join(', ')

  const prompt = `You are a financial analyst assessing how a macro trend will impact a specific stock.

MACRO TREND: "${macroTrend}"
SHOCK DURATION: "${duration}"

COMPANY:
- Name: ${profile.name} (${profile.ticker})
- Sector: ${profile.sector ?? 'Unknown'} | Industry: ${profile.industry ?? 'Unknown'}
- Country: ${profile.country ?? 'Unknown'}
- Description: ${(profile.description ?? 'No description available.').slice(0, 800)}

HISTORICAL CORRELATIONS (Pearson r on weekly log returns, last 24 months):
${corrText || '  No correlation data available.'}

The "expected direction" is the model's estimate of which way each indicator will move given the macro event (+1 = rise, -1 = fall).

Assess the likely impact across THREE dimensions. For every claim, explain the mechanism of action — the explicit causal chain from the macro event to the specific financial outcome.

1. HISTORICAL TRADING PATTERNS: How has this stock historically moved with these indicators? Explain the causal mechanism. Reference specific r values. For each indicator, assess whether the correlation is demand-driven (both stock and indicator rise/fall together due to shared demand conditions) or supply-driven.

2. BUSINESS MODEL IMPACT: How does the macro trend affect revenue, margins, and competitive position? Trace the exact causal chain: which cost lines or revenue streams are hit and through what mechanism.

3. SUPPLY CHAIN & DISTRIBUTION: How does this trend propagate through the company's supply chain to P&L? Given the shock duration of "${duration}", reason explicitly about hedging buffers: shocks of 1-4 weeks are largely buffered by existing contracts; shocks of 12+ months flow through to unhedged volumes. Trace the path: macro event → upstream commodity/FX moves → input costs or distribution impact.

For each dimension's "impact" field, use:
- "positive" / "negative": material directional impact (≥ ~1% of revenue or EPS)
- "mixed": meaningful but partially offsetting positive and negative effects
- "negligible": real impact exists but is immaterial (< ~1% revenue or EPS impact) — distinct from "neutral"
- "neutral": no meaningful causal pathway exists between this macro trend and this dimension

Set confidence based ONLY on data quality — sample size, correlation strength, and how directly the indicators relate to this company's business model.

REQUIRED FIELDS IN YOUR RESPONSE:
- timeHorizon: "1 month", "1 quarter", or "1 year" — the time window your impact estimate applies to
- historicalAnalog: cite ONE specific historical comparable event with approximate date range and what happened to this stock or comparable stocks during that period. If no strong analog exists, say so explicitly — do NOT omit this field.
- hedgeBookNote: if the company has material exposure to any of the following, state whether and how long they hedge that exposure, based on your knowledge — return null only if none apply:
  • Commodity inputs: coffee, oil, metals, agriculture, or other physical inputs (consumer staples, food & beverage, airlines, manufacturers)
  • Foreign exchange: any company deriving >10% of revenue outside its home currency
  • Interest rates: banks, insurers, REITs, or any capital-intensive firm with significant floating-rate debt
  • Energy inputs: airlines, manufacturers, utilities, or any firm with large direct energy costs
- hedgeBookExposureType: classify the PRIMARY exposure type that triggered the hedgeBookNote — "commodity", "fx", "rates", or "energy". Return null if hedgeBookNote is null.
- epsSensitivity: if you have knowledge of it, state what a 10% move in the relevant commodity typically does to this company's EPS. Flag as approximate and not investment advice. Return null if unknown.
- indicatorClassifications: for each indicator ticker (${indicatorTickers}), classify as "direct" (most causally linked to this scenario for this specific stock), "indirect" (related but not the primary driver), or "macro_noise" (broad market beta, not specifically relevant to this scenario)
- demandDrivenInSupplyShock: for each indicator ticker, set true ONLY IF: (a) this indicator's historical correlation with this stock is demand-driven (both moved together due to shared demand) AND (b) the current macro scenario is primarily a supply shock. This flags cases where the historical correlation is misleading.

Return ONLY valid JSON:
{
  "confidence": "<low|medium|high>",
  "timeHorizon": "<1 month|1 quarter|1 year>",
  "historicalPatterns": {
    "summary": "<1 sentence>",
    "detail": "<2-4 sentences citing r values, expected directions, causal mechanism>",
    "impact": "<positive|negative|neutral|mixed|negligible>"
  },
  "businessModel": {
    "summary": "<1 sentence with core mechanism>",
    "detail": "<2-4 sentences tracing causal chain to revenue/margin impact>",
    "impact": "<positive|negative|neutral|mixed|negligible>"
  },
  "supplyChain": {
    "summary": "<1 sentence with core mechanism>",
    "detail": "<2-4 sentences tracing macro event through supply chain to P&L, explicitly addressing hedge duration vs shock duration>",
    "impact": "<positive|negative|neutral|mixed|negligible>"
  },
  "overallReasoning": "<2-3 sentences synthesising all three dimensions>",
  "historicalAnalog": "<specific event, date range, and what happened to the stock>",
  "hedgeBookNote": "<hedge status and duration, or null>",
  "hedgeBookExposureType": "<commodity|fx|rates|energy|null>",
  "epsSensitivity": "<EPS impact of 10% commodity move, approximate, not investment advice — or null>",
  "indicatorClassifications": {
    "<ticker>": "<direct|indirect|macro_noise>"
  },
  "demandDrivenInSupplyShock": {
    "<ticker>": <true|false>
  }
}`

  let text = ''
  if (onThinking) {
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    })
    let lastEmitLen = 0
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        text += event.delta.text
        if (text.length - lastEmitLen >= 200) {
          onThinking(profile.ticker, text.slice(-300))
          lastEmitLen = text.length
        }
      }
    }
  } else {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })
    text = response.content[0].type === 'text' ? response.content[0].text : ''
  }
  const parsed = extractJson<{
    confidence: 'low' | 'medium' | 'high'
    timeHorizon: string
    historicalPatterns: DimensionAnalysis
    businessModel: DimensionAnalysis
    supplyChain: DimensionAnalysis
    overallReasoning: string
    historicalAnalog: string
    hedgeBookNote: string | null
    hedgeBookExposureType: 'commodity' | 'fx' | 'rates' | 'energy' | null
    epsSensitivity: string | null
    indicatorClassifications: Record<string, 'direct' | 'indirect' | 'macro_noise'>
    demandDrivenInSupplyShock: Record<string, boolean>
  }>(text)

  if (!parsed) {
    return {
      confidence: 'low',
      timeHorizon: 'unknown',
      historicalPatterns: { summary: 'Analysis unavailable', detail: '', impact: 'neutral' },
      businessModel: { summary: 'Analysis unavailable', detail: '', impact: 'neutral' },
      supplyChain: { summary: 'Analysis unavailable', detail: '', impact: 'neutral' },
      overallReasoning: 'Could not parse analysis.',
      historicalAnalog: 'Not available.',
      hedgeBookNote: null,
      hedgeBookExposureType: null,
      epsSensitivity: null,
      indicatorClassifications: {},
      demandDrivenInSupplyShock: {},
      error: 'Failed to parse Claude response',
    }
  }

  return {
    confidence: parsed.confidence,
    timeHorizon: parsed.timeHorizon ?? 'unknown',
    historicalPatterns: parsed.historicalPatterns,
    businessModel: parsed.businessModel,
    supplyChain: parsed.supplyChain,
    overallReasoning: parsed.overallReasoning,
    historicalAnalog: parsed.historicalAnalog ?? 'No strong historical analog identified.',
    hedgeBookNote: parsed.hedgeBookNote ?? null,
    hedgeBookExposureType: parsed.hedgeBookExposureType ?? null,
    epsSensitivity: parsed.epsSensitivity ?? null,
    indicatorClassifications: parsed.indicatorClassifications ?? {},
    demandDrivenInSupplyShock: parsed.demandDrivenInSupplyShock ?? {},
  }
}

// ---------------------------------------------------------------------------
// Portfolio-level narrative brief
// ---------------------------------------------------------------------------

export async function generateBrief(
  macroTrend: string,
  duration: string,
  results: StockResult[],
  indicators: Indicator[],
): Promise<AnalysisBrief> {
  const valid = results.filter((r) => !r.error)
  const confWeight: Record<string, number> = { high: 1, medium: 0.5, low: 0 }
  const avgConfidence = valid.length > 0
    ? valid.reduce((s, r) => s + confWeight[r.confidence], 0) / valid.length
    : 0
  const netScore = valid.length > 0
    ? valid.reduce((s, r) => s + r.impactScore, 0) / valid.length
    : 0

  const resultsText = results
    .map((r) => `- ${r.ticker} (${r.name}): score ${r.impactScore >= 0 ? '+' : ''}${r.impactScore.toFixed(1)}, confidence ${r.confidence}. ${r.overallReasoning ?? ''}`)
    .join('\n')

  const indicatorsText = indicators.map((i) => `${i.ticker} (${i.name})`).join(', ')

  const prompt = `You are writing a TL;DR card shown at the top of a stock analysis page. Busy users read this first. Be a sharp editor, not an analyst.

MACRO TREND: "${macroTrend}"
SHOCK DURATION: ${duration}
KEY INDICATORS: ${indicatorsText}

STOCK RESULTS (score range −5 bearish to +5 bullish):
${resultsText}

NET PORTFOLIO SCORE: ${netScore >= 0 ? '+' : ''}${netScore.toFixed(2)}
AVG CONFIDENCE: ${Math.round(avgConfidence * 100)}% (pre-computed — copy this value exactly)

STRICT STYLE RULES — violating any of these is a failure:

paragraph:
- 2 sentences MAXIMUM. Plain English. No jargon.
- Do NOT use square brackets, parentheses with scores, or analyst-speak like "COGS exposure" or "elevated sensitivity".
- Mention at most 1 ticker by name. Lead with the net verdict.
- BAD: "SBUX (score −3.4, high confidence) and JDE face elevated COGS sensitivity via direct commodity linkage."
- GOOD: "This portfolio leans bearish — Starbucks carries the most direct risk if Colombian supply dries up. A few names could quietly benefit from the shift."

watchClosely / hedges / upside:
- Each item MUST be ≤ 4 words. Ideally just a ticker or a short action.
- Arrays of labels, NOT sentences.
- BAD: ["SBUX faces significant downside risk from rising coffee input costs"]
- GOOD: ["SBUX", "JDE", "DNUT"]
- BAD: ["Consider going long Coffee Futures as a hedge against rising prices"]
- GOOD: ["Long KC=F", "Short SBUX"]

questions:
- Each question ≤ 15 words. Plain English. No citations, no brackets, no footnotes.
- These are prompts for further research, not analyst footnotes.
- BAD: "What is SBUX's disclosed Colombian sourcing % per their most recent 10-K filing [2024]?"
- GOOD: "How much of Starbucks coffee comes from Colombia?"

tailRisk:
- One sentence, plain English, ≤ 20 words.

FEW-SHOT EXAMPLES (match this style exactly):

Example 1 — coffee supply shock, bearish portfolio:
{
  "oneLineNet": "Portfolio is net bearish on this scenario.",
  "paragraph": "A Colombian supply shock hits coffee-heavy names hard. A few diversified names may actually benefit if consumers trade down.",
  "watchClosely": ["SBUX", "JDE", "DNUT"],
  "hedges": ["Long KC=F", "Short SBUX"],
  "upside": ["MCD", "KO"],
  "questions": [
    "How much of Starbucks coffee comes from Colombia?",
    "Can roasters switch to Brazilian supply within six months?",
    "What happened to coffee stocks during the 2014 rust outbreak?"
  ],
  "avgConfidence": 0.75,
  "tailRisk": "A prolonged shock beyond 12 months would overwhelm existing hedge books."
}

Example 2 — Fed rate cut, mixed portfolio:
{
  "oneLineNet": "Portfolio is modestly bullish if the Fed cuts.",
  "paragraph": "Rate-sensitive names stand to gain the most from a dovish pivot. Defensives may lag as risk appetite improves.",
  "watchClosely": ["TLT", "XLF"],
  "hedges": ["Long TLT", "Short USD"],
  "upside": ["JPM", "BAC"],
  "questions": [
    "How quickly do bank net interest margins respond to rate cuts?",
    "Which holdings have the most duration sensitivity?",
    "Did financials outperform after the 2019 Fed pivot?"
  ],
  "avgConfidence": 0.62,
  "tailRisk": "If inflation re-accelerates, the pivot could be short-lived."
}

Now write the brief for the actual analysis above. Return ONLY valid JSON:
{
  "oneLineNet": "<one sentence, plain English>",
  "paragraph": "<2 sentences max, plain English, at most 1 ticker, no parentheticals>",
  "watchClosely": ["<ticker or ≤4-word label>", ...],
  "hedges": ["<≤4-word action>", ...],
  "upside": ["<ticker or ≤4-word label>", ...],
  "questions": ["<≤15-word question>", "<≤15-word question>", "<≤15-word question>"],
  "avgConfidence": ${avgConfidence},
  "tailRisk": "<≤20-word sentence>"
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 900,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = extractJson<AnalysisBrief>(text)
  if (!parsed) throw new Error('Failed to parse brief response')

  return {
    oneLineNet:      parsed.oneLineNet ?? '',
    paragraph:       parsed.paragraph ?? '',
    watchClosely:    Array.isArray(parsed.watchClosely) ? parsed.watchClosely : [],
    hedges:          Array.isArray(parsed.hedges) ? parsed.hedges : [],
    upside:          Array.isArray(parsed.upside) ? parsed.upside : [],
    questions:       Array.isArray(parsed.questions) ? parsed.questions : [],
    avgConfidence:   typeof parsed.avgConfidence === 'number' ? parsed.avgConfidence : avgConfidence,
    tailRisk:        parsed.tailRisk ?? '',
  }
}