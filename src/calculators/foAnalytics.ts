import type { FOContract, FOSummary } from '../types'

export interface FOAnalytics {
  win_rate: number
  loss_rate: number
  profit_factor: number
  avg_winner: number
  avg_loser: number
  expectancy: number
  by_underlying: { underlying: string; pnl: number; count: number }[]
  by_type: { option_type: 'CE' | 'PE'; pnl: number; count: number }[]
  best_trades: FOContract[]
  worst_trades: FOContract[]
  all_sorted: FOContract[]
  summary: FOSummary
}

export function computeFOAnalytics(contracts: FOContract[], summary: FOSummary): FOAnalytics {
  const winners = contracts.filter((c) => c.realized_pnl > 0)
  const losers = contracts.filter((c) => c.realized_pnl < 0)

  const win_rate = contracts.length > 0 ? winners.length / contracts.length : 0
  const loss_rate = 1 - win_rate

  const sum_winners = winners.reduce((s, c) => s + c.realized_pnl, 0)
  const sum_losers = losers.reduce((s, c) => s + c.realized_pnl, 0)

  const avg_winner = winners.length > 0 ? sum_winners / winners.length : 0
  const avg_loser = losers.length > 0 ? Math.abs(sum_losers) / losers.length : 0
  const profit_factor = sum_losers !== 0 ? sum_winners / Math.abs(sum_losers) : 0
  const expectancy = win_rate * avg_winner - loss_rate * avg_loser

  const by_underlying = groupFO(contracts, 'underlying')
  const by_type = groupFO(contracts, 'option_type') as FOAnalytics['by_type']

  const all_sorted = [...contracts].sort((a, b) => b.realized_pnl - a.realized_pnl)

  return {
    win_rate,
    loss_rate,
    profit_factor,
    avg_winner,
    avg_loser,
    expectancy,
    by_underlying,
    by_type,
    best_trades: all_sorted.slice(0, 5),
    worst_trades: all_sorted.slice(-5).reverse(),
    all_sorted,
    summary,
  }
}

function groupFO(
  contracts: FOContract[],
  key: 'underlying' | 'option_type',
): { underlying: string; option_type: 'CE' | 'PE'; pnl: number; count: number }[] {
  const map = new Map<string, { pnl: number; count: number }>()
  for (const c of contracts) {
    const k = c[key]
    const existing = map.get(k) ?? { pnl: 0, count: 0 }
    map.set(k, { pnl: existing.pnl + c.realized_pnl, count: existing.count + 1 })
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({ underlying: k, option_type: k as 'CE' | 'PE', ...v }))
    .sort((a, b) => b.pnl - a.pnl)
}
