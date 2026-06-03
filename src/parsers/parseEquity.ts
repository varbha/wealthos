import Papa from 'papaparse'
import type { EquityHolding } from '../types'

const ETF_KEYWORDS = ['CASE', 'BEES', 'ETF', 'NIFTY']

export function parseEquity(text: string): EquityHolding[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  const now = new Date().toISOString()

  return result.data
    .filter((row) => row['Instrument'] && row['Instrument'].trim() !== '')
    .map((row) => {
      const instrument = row['Instrument'].trim()
      const qty = parseFloat(row['Qty.']) || 0
      const avg_cost = parseFloat(row['Avg. cost']) || 0
      const ltp = parseFloat(row['LTP']) || 0
      const invested = parseFloat(row['Invested']) || 0
      const current_value = parseFloat(row['Cur. val']) || 0
      const pnl = parseFloat(row['P&L']) || 0
      const net_chg_pct = parseFloat(row['Net chg.']) || 0
      const day_chg_pct = parseFloat(row['Day chg.']) || 0
      const type = isETF(instrument) ? 'etf' : 'stock'

      return {
        instrument,
        qty,
        avg_cost,
        ltp,
        invested,
        current_value,
        pnl,
        net_chg_pct,
        day_chg_pct,
        type,
        parsed_at: now,
      } satisfies EquityHolding
    })
}

function isETF(instrument: string): boolean {
  const upper = instrument.toUpperCase()
  return ETF_KEYWORDS.some((kw) => upper.includes(kw))
}
