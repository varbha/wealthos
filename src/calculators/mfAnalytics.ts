import type { MFHolding } from '../types'

export interface MFAnalytics {
  total_invested: number
  total_current: number
  total_gain: number
  return_pct: number
  active_count: number
  by_amc: { amc: string; invested: number; current: number; gain: number }[]
  by_category: { category: string; invested: number; current: number; gain: number }[]
  top_performers: MFHolding[]
  worst_performers: MFHolding[]
}

export function computeMFAnalytics(holdings: MFHolding[]): MFAnalytics {
  const active = holdings.filter((h) => h.is_active)

  const total_invested = holdings.reduce((s, h) => s + h.invested, 0)
  const total_current = holdings.reduce((s, h) => s + h.current_value, 0)
  const total_gain = holdings.reduce((s, h) => s + h.returns, 0)
  const return_pct = total_invested > 0 ? (total_gain / total_invested) * 100 : 0

  const by_amc = groupAndSum(active, 'amc')
  const by_category = groupAndSum(active, 'category')

  const sorted = [...active].sort((a, b) => b.return_pct - a.return_pct)

  return {
    total_invested,
    total_current,
    total_gain,
    return_pct,
    active_count: active.length,
    by_amc,
    by_category,
    top_performers: sorted.slice(0, 5),
    worst_performers: sorted.slice(-5).reverse(),
  }
}

function groupAndSum(
  holdings: MFHolding[],
  key: 'amc' | 'category',
): { amc: string; category: string; invested: number; current: number; gain: number }[] {
  const map = new Map<string, { invested: number; current: number; gain: number }>()
  for (const h of holdings) {
    const k = h[key]
    const existing = map.get(k) ?? { invested: 0, current: 0, gain: 0 }
    map.set(k, {
      invested: existing.invested + h.invested,
      current: existing.current + h.current_value,
      gain: existing.gain + h.returns,
    })
  }
  return Array.from(map.entries())
    .map(([k, v]) => ({ amc: k, category: k, ...v }))
    .sort((a, b) => b.current - a.current)
}
