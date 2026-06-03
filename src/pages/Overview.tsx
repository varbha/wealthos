import { useWealthStore } from '../store/useWealthStore'
import MetricCard from '../components/MetricCard'
import DonutChart from '../components/DonutChart'
import BarChart from '../components/BarChart'

const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const fmtINR = (v: number) => `₹${fmt.format(v)}`
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

const today = new Date().toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
})

export default function Overview() {
  const { mfHoldings, equityHoldings, foTrades, foSummary, fdList } = useWealthStore()

  const mf_current = mfHoldings.reduce((s, h) => s + h.current_value, 0)
  const mf_invested = mfHoldings.reduce((s, h) => s + h.invested, 0)
  const eq_current = equityHoldings.reduce((s, h) => s + h.current_value, 0)
  const eq_invested = equityHoldings.reduce((s, h) => s + h.invested, 0)
  const fo_pnl = foSummary?.realized_pnl ?? 0
  const fd_current = fdList.filter((f) => f.is_active).reduce((s, f) => s + f.maturity_value, 0)
  const fd_invested = fdList.reduce((s, f) => s + f.principal, 0)

  const total_current = mf_current + eq_current + fo_pnl + fd_current
  const total_invested = mf_invested + eq_invested + fd_invested
  const total_gain = total_current - total_invested
  const gain_pct = total_invested > 0 ? (total_gain / total_invested) * 100 : 0

  const hasData = mfHoldings.length > 0 || equityHoldings.length > 0 || foTrades.length > 0

  const allocationData = [
    { name: 'Mutual Funds', value: mf_current, color: '#378ADD' },
    { name: 'Equity', value: eq_current, color: '#1D9E75' },
    { name: 'F&O P&L', value: fo_pnl, color: '#D4537E' },
    { name: 'Fixed Deposits', value: fd_current, color: '#EF9F27' },
  ].filter((d) => d.value > 0)

  const performanceData = [
    { name: 'Mutual Funds', value: mf_current - mf_invested, color: '#378ADD' },
    { name: 'Equity', value: eq_current - eq_invested, color: '#1D9E75' },
    { name: 'F&O', value: fo_pnl, color: '#D4537E' },
  ].filter((d) => d.value !== 0)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No data yet.</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Go to <span className="font-medium text-gray-600 dark:text-gray-400">Upload Data</span> to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Portfolio overview</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Portfolio" value={fmtINR(total_current)} />
        <MetricCard label="Total Invested" value={fmtINR(total_invested)} />
        <MetricCard
          label="Total Gain"
          value={fmtINR(total_gain)}
          sub={fmtPct(gain_pct)}
          positive={total_gain >= 0}
          negative={total_gain < 0}
        />
        <MetricCard
          label="F&O P&L"
          value={fmtINR(fo_pnl)}
          positive={fo_pnl >= 0}
          negative={fo_pnl < 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart data={allocationData} label="Allocation" />
        <BarChart
          data={performanceData}
          label="Gain / Loss by asset class"
          layout="horizontal"
          formatValue={(v) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Mutual Funds"
          color="#378ADD"
          rows={[
            { label: 'Invested', value: fmtINR(mf_invested) },
            { label: 'Current', value: fmtINR(mf_current) },
            { label: 'Gain', value: fmtINR(mf_current - mf_invested), signed: true },
            { label: 'Schemes', value: String(mfHoldings.filter((h) => h.is_active).length) },
          ]}
        />
        <SummaryCard
          title="Equity"
          color="#1D9E75"
          rows={[
            { label: 'Invested', value: fmtINR(eq_invested) },
            { label: 'Current', value: fmtINR(eq_current) },
            { label: 'P&L', value: fmtINR(eq_current - eq_invested), signed: true },
            { label: 'Holdings', value: String(equityHoldings.length) },
          ]}
        />
        <SummaryCard
          title="F&O"
          color="#D4537E"
          rows={[
            { label: 'Realized P&L', value: fmtINR(fo_pnl), signed: true },
            { label: 'Charges', value: fmtINR(foSummary?.charges ?? 0) },
            { label: 'Net P&L', value: fmtINR(foSummary?.net_pnl ?? 0), signed: true },
            { label: 'Contracts', value: String(foTrades.length) },
          ]}
        />
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  color,
  rows,
}: {
  title: string
  color: string
  rows: { label: string; value: string; signed?: boolean }[]
}) {
  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</p>
      <dl className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">{r.label}</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
