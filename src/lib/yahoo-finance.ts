import YahooFinance from 'yahoo-finance2'
import type { StockInfo } from './types'
import { isFredTicker, fredTickerToSeriesId, getFredSeries } from './fred'

// v3 API: instantiate the class
const yf = new YahooFinance({ validation: { logOptionsErrors: false } })

// ---------------------------------------------------------------------------
// Curated sector stocks by region
// ---------------------------------------------------------------------------
const SECTOR_STOCKS: Record<string, Record<string, string[]>> = {
  us: {
    'Consumer Defensive': ['KO', 'PEP', 'PG', 'MO', 'PM', 'WMT', 'COST', 'KHC', 'GIS', 'K', 'CPB', 'MKC', 'CAG', 'SJM', 'HSY', 'MDLZ', 'CHD', 'CL', 'HRL', 'TSN'],
    'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'NKE', 'SBUX', 'MCD', 'TGT', 'LOW', 'YUM', 'DPZ', 'CMG', 'BKNG', 'ABNB', 'F', 'GM', 'FORD', 'RCL', 'CCL'],
    Technology: ['AAPL', 'MSFT', 'NVDA', 'META', 'GOOGL', 'AMZN', 'AVGO', 'ORCL', 'CRM', 'AMD', 'INTC', 'QCOM', 'TXN', 'IBM', 'CSCO', 'ACN', 'ADBE', 'NOW', 'INTU', 'AMAT'],
    Healthcare: ['JNJ', 'UNH', 'LLY', 'MRK', 'ABBV', 'TMO', 'ABT', 'PFE', 'DHR', 'BMY', 'AMGN', 'MDT', 'CVS', 'GILD', 'SYK', 'ZTS', 'VRTX', 'REGN', 'HUM', 'CI'],
    Energy: ['XOM', 'CVX', 'COP', 'EOG', 'SLB', 'OXY', 'MPC', 'PSX', 'VLO', 'HES', 'HAL', 'DVN', 'FANG', 'PXD', 'APA', 'BKR', 'KMI', 'WMB', 'ET', 'LNG'],
    'Financial Services': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK', 'SCHW', 'USB', 'PNC', 'TFC', 'COF', 'CB', 'MMC', 'AON', 'ICE', 'CME', 'SPGI', 'MCO'],
    'Basic Materials': ['LIN', 'APD', 'SHW', 'FCX', 'NEM', 'NUE', 'VMC', 'MLM', 'CF', 'MOS', 'ALB', 'DD', 'DOW', 'LYB', 'PKG', 'IP', 'WRK', 'CCK', 'ATI', 'X'],
    Industrials: ['RTX', 'HON', 'UPS', 'LMT', 'DE', 'CAT', 'GE', 'BA', 'MMM', 'NOC', 'GD', 'FDX', 'NSC', 'UNP', 'CSX', 'EMR', 'ETN', 'PH', 'ROK', 'AME'],
    Utilities: ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'XEL', 'ED', 'WEC', 'ES', 'AWK', 'PPL', 'DTE', 'CNP', 'EIX', 'FE', 'LNT', 'AES', 'PEG', 'NI'],
    'Real Estate': ['PLD', 'AMT', 'CCI', 'EQIX', 'PSA', 'O', 'WELL', 'AVB', 'EQR', 'SPG', 'DLR', 'VICI', 'BXP', 'ARE', 'KIM', 'REG', 'UDR', 'CPT', 'ESS', 'MAA'],
    'Communication Services': ['GOOGL', 'META', 'NFLX', 'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'CHTR', 'WBD', 'FOXA', 'PARA', 'IPG', 'OMC', 'MTCH', 'PINS', 'SNAP'],
  },
  ca: {
    'Consumer Defensive': ['ATD.TO', 'L.TO', 'MRU.TO', 'EMP-A.TO', 'SAP.TO', 'GIL.TO', 'NWC.TO', 'WN.TO'],
    Technology: ['SHOP.TO', 'CSU.TO', 'OTEX.TO', 'BB.TO', 'MAXR.TO', 'DSG.TO', 'LSPD.TO'],
    Energy: ['CNQ.TO', 'SU.TO', 'TRP.TO', 'ENB.TO', 'CVE.TO', 'IMO.TO', 'ARX.TO', 'MEG.TO'],
    'Basic Materials': ['ABX.TO', 'AEM.TO', 'WPM.TO', 'FM.TO', 'LIF.TO', 'NTR.TO', 'AGI.TO'],
    'Financial Services': ['RY.TO', 'TD.TO', 'BNS.TO', 'BMO.TO', 'CM.TO', 'MFC.TO', 'SLF.TO', 'FFH.TO'],
    Industrials: ['CP.TO', 'CNR.TO', 'WSP.TO', 'STN.TO', 'TIH.TO', 'WCN.TO', 'BYD.TO'],
    'Consumer Cyclical': ['MG.TO', 'CTC-A.TO', 'DOL.TO', 'RCI-B.TO', 'BCE.TO'],
    Utilities: ['FTS.TO', 'EMA.TO', 'H.TO', 'AQN.TO', 'BEP-UN.TO'],
    'Real Estate': ['CPR.TO', 'FCR-UN.TO', 'AP-UN.TO', 'DIR-UN.TO'],
    Healthcare: ['CSI.TO', 'GUD.TO', 'WELL.TO', 'NHC.TO'],
    'Communication Services': ['BCE.TO', 'T.TO', 'RCI-B.TO', 'QBR-B.TO'],
  },
  gb: {
    'Consumer Defensive': ['ULVR.L', 'BATS.L', 'IMB.L', 'DGE.L', 'ABI.BR', 'TSCO.L', 'MKS.L', 'SBRY.L'],
    Technology: ['SAGE.L', 'AUTO.L', 'JET.L', 'RELX.L', 'EXPN.L', 'CRH.L', 'SMDS.L'],
    Energy: ['SHEL.L', 'BP.L', 'WOOD.L', 'AMFW.L', 'ENQ.L'],
    'Basic Materials': ['RIO.L', 'AAL.L', 'BHP.L', 'GLEN.L', 'ANTO.L', 'FRES.L', 'EVR.L'],
    'Financial Services': ['HSBA.L', 'LLOY.L', 'BARC.L', 'NWG.L', 'STAN.L', 'AV.L', 'LGEN.L', 'PRU.L'],
    Industrials: ['RR.L', 'BAE.L', 'IAG.L', 'WPP.L', 'MNDI.L', 'SMWH.L'],
    Healthcare: ['AZN.L', 'GSK.L', 'HIKMA.L', 'EVO.L', 'CRDA.L', 'HALO.L'],
    'Communication Services': ['VOD.L', 'BT-A.L', 'SKY.L', 'ITV.L'],
    Utilities: ['SSE.L', 'NG.L', 'UU.L', 'SVT.L', 'DRX.L'],
    'Consumer Cyclical': ['JD.L', 'ABF.L', 'FRAS.L', 'NXT.L', 'MNG.L'],
  },
  de: {
    'Consumer Defensive': ['BEI.DE', 'HEN3.DE', 'SHL.DE', 'EVK.DE'],
    Technology: ['SAP.DE', 'IFX.DE', 'AIR.DE', 'XONA.DE', 'HXCK.DE'],
    'Financial Services': ['DBK.DE', 'CBK.DE', 'ALV.DE', 'MUV2.DE', 'DPW.DE'],
    Industrials: ['SIE.DE', 'BMW.DE', 'MBG.DE', 'VOW3.DE', 'BAS.DE', 'BAYN.DE'],
    Energy: ['ENR.DE', 'RWE.DE', 'EOAN.DE', 'TUI1.DE'],
    'Basic Materials': ['BAS.DE', 'WACKER.DE', 'K+S.DE'],
    Healthcare: ['BAYN.DE', 'FRE.DE', 'SRT3.DE', 'EVT.DE'],
  },
  fr: {
    'Consumer Defensive': ['BN.PA', 'RI.PA', 'OR.PA', 'CA.PA', 'MC.PA'],
    Technology: ['ATOS.PA', 'CAP.PA', 'SGO.PA', 'DSY.PA', 'STM.PA'],
    'Financial Services': ['BNP.PA', 'GLE.PA', 'ACA.PA', 'CS.PA', 'AXA.PA'],
    Industrials: ['AI.PA', 'SU.PA', 'ALO.PA', 'VIE.PA', 'BOL.PA'],
    Energy: ['TTE.PA', 'ENGI.PA'],
    Healthcare: ['SAN.PA', 'EL.PA', 'LR.PA'],
  },
  au: {
    'Consumer Defensive': ['WOW.AX', 'COL.AX', 'TWE.AX', 'GFF.AX', 'CKF.AX'],
    Technology: ['XRO.AX', 'WTC.AX', 'APX.AX', 'MP1.AX', 'ALU.AX'],
    'Financial Services': ['CBA.AX', 'NAB.AX', 'WBC.AX', 'ANZ.AX', 'MQG.AX', 'IAG.AX'],
    'Basic Materials': ['BHP.AX', 'RIO.AX', 'FMG.AX', 'NCM.AX', 'NST.AX', 'IGO.AX', 'OZL.AX'],
    Energy: ['WDS.AX', 'STO.AX', 'BPT.AX', 'VEA.AX'],
    Industrials: ['TCL.AX', 'SYD.AX', 'QAN.AX', 'ASX.AX', 'SKI.AX'],
    Healthcare: ['CSL.AX', 'RMD.AX', 'COH.AX', 'FPH.AX', 'NHF.AX'],
    'Real Estate': ['GMG.AX', 'SCG.AX', 'GPT.AX', 'MGR.AX', 'CLW.AX'],
    Utilities: ['AGL.AX', 'ORG.AX', 'APA.AX'],
  },
  jp: {
    'Consumer Defensive': ['2914.T', '2503.T', '2502.T', '7267.T', '2802.T', '2282.T'],
    Technology: ['6758.T', '6861.T', '7203.T', '9984.T', '6367.T', '6501.T', '8035.T', '9433.T'],
    'Financial Services': ['8306.T', '8316.T', '8411.T', '8604.T', '8766.T'],
    Industrials: ['7751.T', '6954.T', '7270.T', '6503.T', '6857.T'],
    Healthcare: ['4502.T', '4568.T', '4519.T', '7741.T', '4543.T'],
  },
  hk: {
    'Consumer Defensive': ['0291.HK', '0220.HK', '1929.HK', '2319.HK'],
    Technology: ['0700.HK', '9999.HK', '9888.HK', '3690.HK'],
    'Financial Services': ['0939.HK', '1398.HK', '0941.HK', '2318.HK', '0011.HK'],
    'Basic Materials': ['1088.HK', '1171.HK', '0386.HK', '0857.HK'],
    Energy: ['0857.HK', '0883.HK', '0386.HK'],
    'Real Estate': ['0016.HK', '0001.HK', '1109.HK', '2007.HK'],
  },
  in: {
    Technology: ['TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'TECHM.NS', 'MPHASIS.NS'],
    'Financial Services': ['HDFCBANK.NS', 'ICICIBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS'],
    'Consumer Defensive': ['ITC.NS', 'HINDUNILVR.NS', 'NESTLEIND.NS', 'BRITANNIA.NS', 'DABUR.NS'],
    Industrials: ['LT.NS', 'RELIANCE.NS', 'NTPC.NS', 'POWERGRID.NS', 'ADANIPORTS.NS'],
    'Consumer Cyclical': ['MARUTI.NS', 'M&M.NS', 'TATAMOTORS.NS', 'BAJAJ-AUTO.NS'],
    Healthcare: ['SUNPHARMA.NS', 'DRREDDY.NS', 'CIPLA.NS', 'DIVISLAB.NS', 'APOLLOHOSP.NS'],
    Energy: ['RELIANCE.NS', 'ONGC.NS', 'BPCL.NS', 'IOC.NS'],
    'Basic Materials': ['JSWSTEEL.NS', 'TATASTEEL.NS', 'HINDALCO.NS', 'VEDL.NS'],
  },
  br: {
    'Consumer Defensive': ['AMBEV3.SA', 'ABEV3.SA', 'PCAR3.SA', 'CRFB3.SA', 'BEEF3.SA'],
    Technology: ['TOTVS3.SA', 'LINX3.SA', 'LWSA3.SA', 'CASH3.SA'],
    'Financial Services': ['ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA', 'SANB11.SA', 'BPAC11.SA'],
    Energy: ['PETR4.SA', 'UGPA3.SA', 'EGIE3.SA', 'CPFE3.SA'],
    'Basic Materials': ['VALE3.SA', 'SUZB3.SA', 'KLBN11.SA', 'CSNA3.SA', 'GGBR4.SA'],
    Industrials: ['WEGE3.SA', 'EMBR3.SA', 'RENT3.SA', 'RAIL3.SA'],
    'Consumer Cyclical': ['MGLU3.SA', 'HAPV3.SA', 'ALPA4.SA', 'SRNA3.SA'],
  },
  mx: {
    'Consumer Defensive': ['BIMBOA.MX', 'GRUMAB.MX', 'LABB.MX', 'ALSEA.MX', 'WALMEX.MX'],
    'Financial Services': ['GFNORTEO.MX', 'BSMEDICO.MX', 'Q.MX'],
    'Basic Materials': ['CEMEXCPO.MX', 'AMXL.MX', 'GCARSOA1.MX'],
    'Consumer Cyclical': ['AMXL.MX', 'TLEVISACPO.MX', 'MEGACPO.MX'],
  },
  sg: {
    'Consumer Defensive': ['F34.SI', 'BN4.SI', 'Y92.SI'],
    Technology: ['V03.SI', 'S63.SI', 'U11.SI'],
    'Financial Services': ['D05.SI', 'O39.SI', 'U11.SI'],
    'Real Estate': ['C38U.SI', 'A17U.SI', 'ME8U.SI'],
    Industrials: ['C6L.SI', 'BS6.SI', 'S68.SI'],
  },
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export async function searchTickers(query: string): Promise<StockInfo[]> {
  try {
    const result = await yf.search(query, { newsCount: 0, quotesCount: 8 })
    return (result.quotes ?? [])
      .filter((q) => 'quoteType' in q && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
      .map((q) => ({
        ticker: String(q.symbol),
        name: String(('shortname' in q ? q.shortname : undefined) ?? ('longname' in q ? q.longname : undefined) ?? q.symbol),
      }))
  } catch {
    return []
  }
}

export async function getStocksBySector(
  regionCodes: string[],
  sector: string,
  limit = 30,
): Promise<StockInfo[]> {
  const tickers: string[] = []
  for (const code of regionCodes) {
    const byRegion = SECTOR_STOCKS[code] ?? {}
    const sectorTickers = byRegion[sector] ?? []
    tickers.push(...sectorTickers)
  }

  if (tickers.length === 0) return []

  const uniqueTickers = [...new Set(tickers)].slice(0, limit)

  // Enrich with live quote data
  try {
    const quotes = await yf.quote(uniqueTickers, { fields: ['shortName', 'longName', 'sector', 'industry'] })
    const quoteList = Array.isArray(quotes) ? quotes : [quotes]
    return quoteList.map((q) => ({
      ticker: q.symbol,
      name: q.shortName ?? q.longName ?? q.symbol,
      sector: (q as Record<string, string>).sector ?? sector,
      industry: (q as Record<string, string>).industry,
    }))
  } catch {
    // Return bare list if quote enrichment fails
    return uniqueTickers.map((t) => ({ ticker: t, name: t, sector }))
  }
}

export interface CompanyProfile {
  ticker: string
  name: string
  sector?: string
  industry?: string
  country?: string
  description?: string
  employees?: number
  marketCap?: number
}

export async function getCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const summary = await yf.quoteSummary(ticker, {
    modules: ['assetProfile', 'price'],
  })
  const profile = summary.assetProfile as {
    longBusinessSummary?: string
    sector?: string
    industry?: string
    country?: string
    fullTimeEmployees?: number
  } | undefined
  const price = summary.price as {
    shortName?: string
    longName?: string
    marketCap?: number
  } | undefined
  return {
    ticker,
    name: price?.shortName ?? price?.longName ?? ticker,
    sector: profile?.sector,
    industry: profile?.industry,
    country: profile?.country,
    description: profile?.longBusinessSummary,
    employees: profile?.fullTimeEmployees,
    marketCap: price?.marketCap,
  }
}

export interface PricePoint {
  date: string
  close: number
}

export async function getHistoricalPrices(
  ticker: string,
  periodMonths = 24,
): Promise<PricePoint[]> {
  if (isFredTicker(ticker)) {
    return getFredSeries(fredTickerToSeriesId(ticker), periodMonths)
  }

  const period2 = new Date()
  const period1 = new Date()
  period1.setMonth(period1.getMonth() - periodMonths)
  const history = await yf.historical(ticker, {
    period1: period1.toISOString().split('T')[0],
    period2: period2.toISOString().split('T')[0],
    interval: '1wk',
  })
  const points = history
    .filter((h: { close?: number | null; date: Date }) => h.close != null)
    .map((h: { date: Date; close: number }) => ({
      date: h.date.toISOString().split('T')[0],
      close: h.close,
    }))
  if (points.length < 10) {
    throw new Error(`Insufficient price history for ${ticker}: only ${points.length} weekly bars`)
  }
  return points
}
