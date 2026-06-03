import type { EquityHolding } from '../types'

export interface EquityAnalytics {
  total_invested: number
  total_current: number
  total_pnl: number
  return_pct: number
  stocks_invested: number
  stocks_current: number
  etfs_invested: number
  etfs_current: number
  concentration: { instrument: string; pct: number; current_value: number }[]
  alerts_red: EquityHolding[]
  alerts_green: EquityHolding[]
  sorted_by_pnl: EquityHolding[]
}

export function computeEquityAnalytics(holdings: EquityHolding[]): EquityAnalytics {
  const total_invested = holdings.reduce((s, h) => s + h.invested, 0)
  const total_current = holdings.reduce((s, h) => s + h.current_value, 0)
  const total_pnl = holdings.reduce((s, h) => s + h.pnl, 0)
  const return_pct = total_invested > 0 ? (total_pnl / total_invested) * 100 : 0

  const stocks = holdings.filter((h) => h.type === 'stock')
  const etfs = holdings.filter((h) => h.type === 'etf')

  const concentration = holdings
    .map((h) => ({
      instrument: h.instrument,
      pct: total_current > 0 ? (h.current_value / total_current) * 100 : 0,
      current_value: h.current_value,
    }))
    .sort((a, b) => b.pct - a.pct)

  const pnl_pct = (h: EquityHolding) =>
    h.invested > 0 ? (h.pnl / h.invested) * 100 : 0

  return {
    total_invested,
    total_current,
    total_pnl,
    return_pct,
    stocks_invested: stocks.reduce((s, h) => s + h.invested, 0),
    stocks_current: stocks.reduce((s, h) => s + h.current_value, 0),
    etfs_invested: etfs.reduce((s, h) => s + h.invested, 0),
    etfs_current: etfs.reduce((s, h) => s + h.current_value, 0),
    concentration,
    alerts_red: holdings.filter((h) => pnl_pct(h) < -20),
    alerts_green: holdings.filter((h) => pnl_pct(h) > 100),
    sorted_by_pnl: [...holdings].sort((a, b) => b.pnl - a.pnl),
  }
}
