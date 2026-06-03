import { useWealthStore } from '../store/useWealthStore'
import MetricCard from '../components/MetricCard'
import DonutChart from '../components/DonutChart'
import BarChart from '../components/BarChart'
import { currentAssetValue } from '../calculators/assetDepreciation'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts'

const fmt  = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const fmtINR = (v: number) => `₹${fmt.format(v)}`
const fmtCr  = (v: number) =>
  v >= 1e7 ? `₹${(v / 1e7).toFixed(2)} Cr`
  : v >= 1e5 ? `₹${(v / 1e5).toFixed(2)} L`
  : fmtINR(v)
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

const today = new Date().toLocaleDateString('en-IN', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

export default function Overview() {
  const { mfHoldings, equityHoldings, foTrades, foSummary, fdList, physicalAssets, snapshots } = useWealthStore()

  const mf_current    = mfHoldings.reduce((s, h) => s + h.current_value, 0)
  const mf_invested   = mfHoldings.reduce((s, h) => s + h.invested, 0)
  const eq_current    = equityHoldings.reduce((s, h) => s + h.current_value, 0)
  const eq_invested   = equityHoldings.reduce((s, h) => s + h.invested, 0)
  const fo_pnl        = foSummary?.realized_pnl ?? 0
  const fo_net        = foSummary?.net_pnl ?? 0
  const fd_current    = fdList.filter(f => f.is_active).reduce((s, f) => s + f.maturity_value, 0)
  const fd_invested   = fdList.reduce((s, f) => s + f.principal, 0)
  const phys_current  = physicalAssets.reduce((s, a) => s + currentAssetValue(a), 0)
  const phys_purchase = physicalAssets.reduce((s, a) => s + a.purchase_value, 0)

  const total_current  = mf_current + eq_current + fo_pnl + fd_current + phys_current
  const total_invested = mf_invested + eq_invested + fd_invested + phys_purchase
  const total_gain     = total_current - total_invested
  const gain_pct       = total_invested > 0 ? (total_gain / total_invested) * 100 : 0

  const hasData = mfHoldings.length > 0 || equityHoldings.length > 0 || foTrades.length > 0

  const allocationData = [
    { name: 'Mutual Funds',    value: mf_current,              color: '#378ADD' },
    { name: 'Equity',          value: eq_current,              color: '#1D9E75' },
    { name: 'F&O P&L',        value: Math.max(fo_pnl, 0),     color: '#D4537E' },
    { name: 'Fixed Deposits',  value: fd_current,              color: '#EF9F27' },
    { name: 'Physical Assets', value: phys_current,            color: '#6366f1' },
  ].filter(d => d.value > 0)

  const performanceData = [
    { name: 'Mutual Funds', value: mf_current - mf_invested,  color: '#378ADD' },
    { name: 'Equity',       value: eq_current - eq_invested,   color: '#1D9E75' },
    { name: 'F&O (net)',    value: fo_net, color: fo_net >= 0 ? '#D4537E' : '#f87171' },
  ].filter(d => d.value !== 0)

  // Trendline — pad with invested baseline if only 1 snapshot
  const snapshotChart = snapshots.length >= 1
    ? snapshots.slice(-30).map(s => ({ date: s.date, total: s.total }))
    : null

  const trendStart  = snapshotChart?.[0]?.total ?? 0
  const trendEnd    = snapshotChart?.[snapshotChart.length - 1]?.total ?? 0
  const trendChange = trendStart > 0 ? ((trendEnd - trendStart) / trendStart) * 100 : 0
  const trendUp     = trendEnd >= trendStart

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-4xl mb-4">📂</p>
        <p className="text-gray-600 dark:text-gray-400 font-medium">No data uploaded yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          Head to <span className="font-medium text-gray-600 dark:text-gray-300">Upload Data</span> to import your files.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* Net Worth Trendline — hero card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        {/* Top bar */}
        <div className="px-6 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Net Worth
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{fmtCr(total_current)}</p>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-gray-400 dark:text-gray-500">Invested {fmtCr(total_invested)}</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${total_gain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {total_gain >= 0 ? '▲' : '▼'} {fmtCr(Math.abs(total_gain))} ({fmtPct(gain_pct)})
              </span>
            </div>
          </div>
          {snapshotChart && snapshotChart.length > 1 && (
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Since first upload</p>
              <p className={`text-lg font-bold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                {trendUp ? '▲' : '▼'} {fmtPct(Math.abs(trendChange))}
              </p>
              <p className="text-xs text-gray-400">{snapshotChart.length} snapshots</p>
            </div>
          )}
        </div>

        {/* Area chart */}
        {snapshotChart && snapshotChart.length >= 1 ? (
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshotChart} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tickFormatter={v => `₹${(v / 1e5).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(v: number) => [fmtINR(v), 'Net Worth']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #374151', background: '#111827' }}
                  labelStyle={{ color: '#9ca3af', marginBottom: 2 }}
                />
                {total_invested > 0 && (
                  <ReferenceLine
                    y={total_invested}
                    stroke="#6b7280"
                    strokeDasharray="4 3"
                    label={{ value: 'Invested', position: 'insideTopRight', fontSize: 10, fill: '#6b7280' }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#378ADD"
                  strokeWidth={2}
                  fill="url(#netWorthGrad)"
                  dot={snapshotChart.length <= 5 ? { r: 4, fill: '#378ADD', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#378ADD' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="px-6 pb-5">
            <p className="text-xs text-gray-400 italic">Upload files multiple times to see your net worth trend here.</p>
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Mutual Funds"
          value={fmtCr(mf_current)}
          sub={fmtPct((mf_current - mf_invested) / mf_invested * 100)}
          positive={mf_current >= mf_invested}
          negative={mf_current < mf_invested}
          description={`${mfHoldings.filter(h => h.is_active).length} active schemes · invested ${fmtCr(mf_invested)}`}
          accent="#378ADD"
        />
        <MetricCard
          label="Equity"
          value={fmtCr(eq_current)}
          sub={fmtPct((eq_current - eq_invested) / eq_invested * 100)}
          positive={eq_current >= eq_invested}
          negative={eq_current < eq_invested}
          description={`${equityHoldings.length} holdings · invested ${fmtCr(eq_invested)}`}
          accent="#1D9E75"
        />
        <MetricCard
          label="F&O Net P&L"
          value={fmtINR(fo_net)}
          sub={`Gross: ${fmtINR(fo_pnl)}`}
          positive={fo_net >= 0}
          negative={fo_net < 0}
          description={`${foTrades.length} contracts · charges ${fmtINR(foSummary?.charges ?? 0)}`}
          accent="#D4537E"
        />
        <MetricCard
          label="Fixed Deposits"
          value={fdList.length > 0 ? fmtCr(fd_current) : '—'}
          sub={fdList.length > 0 ? `Principal: ${fmtCr(fd_invested)}` : undefined}
          positive={fd_current > 0}
          description={fdList.length > 0 ? `${fdList.filter(f => f.is_active).length} active FDs` : 'No FDs added yet'}
          accent="#EF9F27"
        />
        <MetricCard
          label="Physical Assets"
          value={physicalAssets.length > 0 ? fmtCr(phys_current) : '—'}
          sub={physicalAssets.length > 0 ? `−${fmtINR(phys_purchase - phys_current)} depreciated` : undefined}
          negative={phys_purchase > phys_current}
          description={physicalAssets.length > 0 ? `${physicalAssets.length} asset${physicalAssets.length > 1 ? 's' : ''} · IRDAI IDV schedule` : 'No physical assets'}
          accent="#6366f1"
        />
      </div>

      {/* Allocation + Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart data={allocationData} label="Asset allocation" />
        <BarChart
          data={performanceData}
          label="Gain / loss by asset class"
          layout="horizontal"
          formatValue={v => fmtINR(v)}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SummaryCard
          title="Mutual Funds"
          subtitle="Equity schemes via MF Central"
          color="#378ADD"
          rows={[
            { label: 'Invested',      value: fmtINR(mf_invested) },
            { label: 'Current value', value: fmtINR(mf_current) },
            { label: 'Absolute gain', value: fmtINR(mf_current - mf_invested), signed: true },
            { label: 'Return',        value: fmtPct((mf_current - mf_invested) / mf_invested * 100) },
            { label: 'Active schemes',value: String(mfHoldings.filter(h => h.is_active).length) },
          ]}
        />
        <SummaryCard
          title="Equity"
          subtitle="Stocks & ETFs via Zerodha demat"
          color="#1D9E75"
          rows={[
            { label: 'Invested',       value: fmtINR(eq_invested) },
            { label: 'Current value',  value: fmtINR(eq_current) },
            { label: 'Unrealised P&L', value: fmtINR(eq_current - eq_invested), signed: true },
            { label: 'Return',         value: fmtPct((eq_current - eq_invested) / eq_invested * 100) },
            { label: 'Holdings',       value: String(equityHoldings.length) },
          ]}
        />
        <SummaryCard
          title="F&O Trading"
          subtitle="Options P&L · current financial year"
          color="#D4537E"
          rows={[
            { label: 'Realized P&L',  value: fmtINR(fo_pnl),  signed: true },
            { label: 'Total charges', value: fmtINR(foSummary?.charges ?? 0) },
            { label: 'Net P&L',       value: fmtINR(fo_net),  signed: true },
            { label: 'Win rate',      value: foTrades.length > 0 ? `${((foTrades.filter(c => c.realized_pnl > 0).length / foTrades.length) * 100).toFixed(1)}%` : '—' },
            { label: 'Contracts',     value: String(foTrades.length) },
          ]}
        />
      </div>
    </div>
  )
}

function SummaryCard({ title, subtitle, color, rows }: {
  title: string
  subtitle: string
  color: string
  rows: { label: string; value: string; signed?: boolean }[]
}) {
  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 mt-0.5">{subtitle}</p>
      <dl className="space-y-2">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">{r.label}</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
