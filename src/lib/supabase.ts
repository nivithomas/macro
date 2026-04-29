import { createClient } from '@supabase/supabase-js'
import type { StockInfo, Indicator, StockResult, AnalysisBrief, AnalysisRecord, PortfolioRecord } from './types'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side only — service role key bypasses RLS. Never expose to the browser.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ---------------------------------------------------------------------------
// DB row shapes (snake_case — standard PostgreSQL convention)
// ---------------------------------------------------------------------------

export interface DbAnalysis {
  id: string
  macro_trend: string
  duration: string | null
  stock_universe: string
  indicators: string | null
  results: string | null
  summary: string | null
  status: string
  error_message: string | null
  created_at: string
  updated_at: string
  portfolio_id: string | null
}

export interface DbPortfolio {
  id: string
  name: string
  tickers: string
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Row → TypeScript record converters
// ---------------------------------------------------------------------------

export function toAnalysisRecord(row: DbAnalysis): AnalysisRecord {
  return {
    id: row.id,
    macroTrend: row.macro_trend,
    duration: row.duration,
    stockUniverse: JSON.parse(row.stock_universe) as StockInfo[],
    indicators: row.indicators ? (JSON.parse(row.indicators) as Indicator[]) : null,
    results: row.results ? (JSON.parse(row.results) as StockResult[]) : null,
    status: row.status as AnalysisRecord['status'],
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    portfolioId: row.portfolio_id,
    brief: row.summary ? (JSON.parse(row.summary) as AnalysisBrief) : null,
  }
}

export function toPortfolioRecord(row: DbPortfolio): PortfolioRecord {
  return {
    id: row.id,
    name: row.name,
    tickers: JSON.parse(row.tickers) as StockInfo[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function now() {
  return new Date().toISOString()
}
