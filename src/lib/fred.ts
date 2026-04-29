import type { PricePoint } from './yahoo-finance'

export const FRED_INDICATORS: Record<string, string> = {
  'FRED:T10Y2Y':           '10Y-2Y Yield Spread',
  'FRED:BAMLH0A0HYM2':     'High Yield Credit Spread',
  'FRED:T10YIE':           '10Y Breakeven Inflation',
  'FRED:DTWEXBGS':         'Trade-Weighted USD Index',
  'FRED:MORTGAGE30US':     '30Y Mortgage Rate',
  'FRED:UMCSENT':          'Consumer Sentiment',
  'FRED:ICSA':             'Initial Jobless Claims',
  'FRED:CPALTT01USM657N':  'US CPI YoY',
}

export function isFredTicker(ticker: string): boolean {
  return ticker.startsWith('FRED:')
}

export function fredTickerToSeriesId(ticker: string): string {
  return ticker.slice('FRED:'.length)
}

interface FredObservation {
  date: string
  value: string
}

interface FredResponse {
  observations: FredObservation[]
}

/**
 * Fetch a FRED series and resample to weekly (last observation per ISO week).
 * Returns PricePoint[] compatible with computeCorrelation / alignByDate.
 */
export async function getFredSeries(
  seriesId: string,
  periodMonths = 24,
): Promise<PricePoint[]> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) throw new Error('FRED_API_KEY is not set')

  const period1 = new Date()
  period1.setMonth(period1.getMonth() - periodMonths)
  const startDate = period1.toISOString().split('T')[0]

  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=${seriesId}` +
    `&api_key=${apiKey}` +
    `&file_type=json` +
    `&observation_start=${startDate}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`FRED API error for ${seriesId}: ${res.status} ${res.statusText}`)
  }
  const data = await res.json() as FredResponse

  // Filter out missing values (FRED uses "." for missing)
  const valid = data.observations.filter(
    (o) => o.value !== '.' && o.value !== '' && isFinite(parseFloat(o.value)),
  )

  if (valid.length === 0) {
    throw new Error(`No valid observations returned from FRED for ${seriesId}`)
  }

  // Resample to weekly: keep last observation per ISO week
  // ISO week key: YYYY-Www (e.g. "2024-W03")
  const weekMap = new Map<string, PricePoint>()
  for (const obs of valid) {
    const weekKey = isoWeekKey(obs.date)
    weekMap.set(weekKey, { date: obs.date, close: parseFloat(obs.value) })
  }

  const points = [...weekMap.values()].sort((a, b) => a.date.localeCompare(b.date))

  if (points.length < 10) {
    throw new Error(`Insufficient data from FRED for ${seriesId}: only ${points.length} weekly observations`)
  }

  return points
}

/** Returns an ISO week key string like "2024-W03" for grouping observations. */
function isoWeekKey(dateStr: string): string {
  const date = new Date(dateStr)
  // ISO week: Thursday-based week number
  const thursday = new Date(date)
  thursday.setDate(date.getDate() + (4 - (date.getDay() || 7)))
  const year = thursday.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const week = Math.ceil(((thursday.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
