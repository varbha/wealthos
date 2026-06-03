import { useWealthStore } from '../store/useWealthStore'
import { computeEquityAnalytics } from '../calculators/equityAnalytics'
import MetricCard from '../components/MetricCard'
import BarChart from '../components/BarChart'
import HoldingsTable, { fmtINR, fmtPct } from '../components/HoldingsTable'
import type { EquityHolding } from '../types'

const fmt2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export default function Equity() {
  const { equityHoldings } = useWealthStore()

  if (equityHoldings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No equity data. Upload your Zerodha holdings CSV.</p>
      </div>
    )
  }

  const a = computeEquityAnalytics(equityHoldings)
  const best = a.sorted_by_pnl[0]
  const pnlPct = (h: EquityHolding) => h.invested > 0 ? (h.pnl / h.invested) * 100 : 0

  const concentrationData = a.concentration.map((c) => ({
    name: c.instrument,
    value: parseFloat(c.pct.toFixed(2)),
    color: '#1D9E75',
  }))

  const columns = [
    { header: 'Symbol', accessor: (h: EquityHolding) => h.instrument },
    {
      header: 'Type',
      accessor: (h: EquityHolding) => h.type.toUpperCase(),
      rowClassName: (h: EquityHolding) =>
        h.type === 'etf' ? 'text-blue-500 dark:text-blue-400' : '',
    },
    { header: 'Qty', accessor: (h: EquityHolding) => fmt2.format(h.qty), className: 'text-right' },
    { header: 'Avg Cost', accessor: (h: EquityHolding) => `₹${fmt2.format(h.avg_cost)}`, className: 'text-right' },
    { header: 'LTP', accessor: (h: EquityHolding) => `₹${fmt2.format(h.ltp)}`, className: 'text-right' },
    { header: 'Invested', accessor: (h: EquityHolding) => fmtINR(h.invested), className: 'text-right' },
    { header: 'Current', accessor: (h: EquityHolding) => fmtINR(h.current_value), className: 'text-right' },
    {
      header: 'P&L',
      accessor: (h: EquityHolding) => fmtINR(h.pnl),
      className: 'text-right',
      rowClassName: (h: EquityHolding) =>
        h.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
    {
      header: 'Return %',
      accessor: (h: EquityHolding) => fmtPct(pnlPct(h)),
      className: 'text-right',
      rowClassName: (h: EquityHolding) =>
        pnlPct(h) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Equity</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Invested" value={fmtINR(a.total_invested)} accent="#1D9E75" />
        <MetricCard label="Current Value" value={fmtINR(a.total_current)} accent="#1D9E75" />
        <MetricCard
          label="P&L"
          value={fmtINR(a.total_pnl)}
          sub={fmtPct(a.return_pct)}
          positive={a.total_pnl >= 0}
          negative={a.total_pnl < 0}
          accent="#1D9E75"
        />
        <MetricCard
          label="Biggest Winner"
          value={best ? fmtINR(best.pnl) : '—'}
          sub={best?.instrument}
          positive
          accent="#1D9E75"
        />
      </div>

      <HoldingsTable
        rows={a.sorted_by_pnl}
        columns={columns}
        label={`Holdings (${equityHoldings.length})`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarChart
            data={concentrationData}
            label="Concentration (% of equity book)"
            layout="vertical"
            defaultColor="#1D9E75"
            formatValue={(v) => `${v.toFixed(1)}%`}
            showValueLabel
          />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Stocks vs ETFs</p>
          <dl className="space-y-3">
            {[
              { label: 'Stocks — invested', value: fmtINR(a.stocks_invested) },
              { label: 'Stocks — current', value: fmtINR(a.stocks_current) },
              { label: 'ETFs — invested', value: fmtINR(a.etfs_invested) },
              { label: 'ETFs — current', value: fmtINR(a.etfs_current) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm">
                <dt className="text-gray-500 dark:text-gray-400">{r.label}</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{r.value}</dd>
              </div>
            ))}
          </dl>
          {a.alerts_red.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-red-500 mb-2">⚠ Down &gt;20%</p>
              {a.alerts_red.map((h) => (
                <p key={h.instrument} className="text-xs text-red-500">{h.instrument} ({fmtPct(pnlPct(h))})</p>
              ))}
            </div>
          )}
          {a.alerts_green.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-green-500 mb-2">★ Up &gt;100%</p>
              {a.alerts_green.map((h) => (
                <p key={h.instrument} className="text-xs text-green-500">{h.instrument} ({fmtPct(pnlPct(h))})</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
