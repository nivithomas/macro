export interface StockInfo {
  ticker: string
  name: string
  sector?: string
  industry?: string
  country?: string
}

export interface Indicator {
  ticker: string
  name: string
  type: 'commodity' | 'currency' | 'index' | 'other'
  relevanceReason: string
}

export interface CorrelationResult {
  indicatorTicker: string
  indicatorName: string
  correlation: number // Pearson r on weekly log returns, -1 to 1
  dataPoints: number
  direction?: number          // expected move of indicator given macro event, -1 to +1
  directionReasoning?: string // Claude's causal explanation for the direction estimate
  chartData?: { date: string; stock: number; indicator: number }[]
  indicatorClassification?: 'direct' | 'indirect' | 'macro_noise'
  correlationMismatchWarning?: boolean // demand-driven correlation in a supply-shock scenario
}

export interface DisplaySettings {
  correlationThreshold: number // default 0.2
}

export interface DimensionAnalysis {
  summary: string
  detail: string
  impact: 'positive' | 'negative' | 'neutral' | 'mixed' | 'negligible'
}

export interface StockResult {
  ticker: string
  name: string
  sector?: string
  impactScore: number // -5 to +5
  confidence: 'low' | 'medium' | 'high'
  correlations: CorrelationResult[]
  historicalPatterns: DimensionAnalysis
  businessModel: DimensionAnalysis
  supplyChain: DimensionAnalysis
  overallReasoning: string
  timeHorizon?: string         // "1 month" | "1 quarter" | "1 year"
  historicalAnalog?: string    // specific historical comparable event
  hedgeBookNote?: string       // hedge book status for commodity/FX/rates/energy-exposed companies
  hedgeBookExposureType?: 'commodity' | 'fx' | 'rates' | 'energy' | null
  epsSensitivity?: string      // EPS impact of 10% move in relevant commodity
  weakCausalLink?: boolean     // true if max |r| < 0.15 across all indicators
  quantReliable: boolean       // false for input_cost_shock, demand_shock, geopolitical, other
  quantWarning: string | null  // explanation when quantReliable is false
  error?: string
}

export interface AnalysisBrief {
  oneLineNet: string
  paragraph: string       // uses [TICKER] format for inline highlighting
  watchClosely: string[]  // top bearish-exposed tickers
  hedges: string[]        // hedging instruments or actions
  upside: string[]        // potential beneficiaries
  questions: string[]     // 3 researchable follow-up questions
  avgConfidence: number   // 0–1
  tailRisk: string        // one-line worst-case caveat
}

export interface AnalysisRecord {
  id: string
  macroTrend: string
  duration?: string | null // "1-4 weeks" | "1-3 months" | "6-12 months" | "12+ months"
  stockUniverse: StockInfo[]
  indicators: Indicator[] | null
  results: StockResult[] | null
  status: 'pending' | 'running' | 'complete' | 'error'
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  portfolioId: string | null
  brief?: AnalysisBrief | null
}

export interface PortfolioRecord {
  id: string
  name: string
  tickers: StockInfo[]
  createdAt: string
  updatedAt: string
}

// SSE event types
export type SSEEvent =
  | { type: 'step'; message: string; step: number; total: number }
  | { type: 'thinking'; ticker?: string; snippet: string }
  | { type: 'indicators'; indicators: Indicator[] }
  | { type: 'result'; result: StockResult }
  | { type: 'complete' }
  | { type: 'error'; message: string }

export const REGIONS: Record<string, { label: string; codes: string[] }> = {
  'north-america': { label: 'North America', codes: ['us', 'ca'] },
  europe: { label: 'Europe', codes: ['gb', 'de', 'fr', 'it', 'es'] },
  'asia-pacific': { label: 'Asia-Pacific', codes: ['au', 'hk', 'sg', 'jp'] },
  'latin-america': { label: 'Latin America', codes: ['br', 'mx'] },
  india: { label: 'India', codes: ['in'] },
}

export const SECTORS: Record<string, string> = {
  Technology: 'Technology',
  Healthcare: 'Healthcare',
  'Financial Services': 'Financial Services',
  'Consumer Cyclical': 'Consumer Cyclical',
  'Consumer Defensive': 'Consumer Defensive',
  Energy: 'Energy',
  'Basic Materials': 'Basic Materials',
  Industrials: 'Industrials',
  'Real Estate': 'Real Estate',
  Utilities: 'Utilities',
  'Communication Services': 'Communication Services',
}
