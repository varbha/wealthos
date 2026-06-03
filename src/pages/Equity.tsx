import { useWealthStore } from '../store/useWealthStore'
import { computeEquityAnalytics } from '../calculators/equityAnalytics'
import MetricCard from '../components/MetricCard'
import BarChart from '../components/BarChart'
import HoldingsTable, { fmtINR, fmtPct } from '../components/HoldingsTable'
import type { EquityHolding } from '../types'

const fmt2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })
const pnlPct = (h: EquityHolding) => h.invested > 0 ? (h.pnl / h.invested) * 100 : 0

export default function Equity() {
  const { equityHoldings } = useWealthStore()

  if (equityHoldings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-4xl mb-4">📈</p>
        <p className="text-gray-600 dark:text-gray-400 font-medium">No equity data uploaded</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload your Zerodha holdings CSV to see your stock & ETF portfolio.</p>
      </div>
    )
  }

  const a = computeEquityAnalytics(equityHoldings)
  const best = a.sorted_by_pnl[0]
  const stocks = equityHoldings.filter(h => h.type === 'stock')
  const etfs   = equityHoldings.filter(h => h.type === 'etf')

  const dayPnL = equityHoldings.reduce((s, h) => s + (h.current_value * h.day_chg_pct / 100), 0)

  const pnlBarData = a.sorted_by_pnl.map(h => ({
    name: h.instrument,
    value: h.pnl,
    color: h.pnl >= 0 ? '#1D9E75' : '#D4537E',
  }))

  const concentrationData = a.concentration.map(c => ({
    name: c.instrument,
    value: parseFloat(c.pct.toFixed(1)),
    color: '#1D9E75',
  }))

  const columns = [
    { header: 'Symbol', accessor: (h: EquityHolding) => h.instrument },
    {
      header: 'Type',
      accessor: (h: EquityHolding) => h.type.toUpperCase(),
      rowClassName: (h: EquityHolding) =>
        h.type === 'etf' ? 'text-blue-500 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400',
    },
    { header: 'Qty', accessor: (h: EquityHolding) => fmt2.format(h.qty), className: 'text-right hidden sm:table-cell' },
    { header: 'Avg Cost', accessor: (h: EquityHolding) => `₹${fmt2.format(h.avg_cost)}`, className: 'text-right hidden md:table-cell' },
    { header: 'LTP', accessor: (h: EquityHolding) => `₹${fmt2.format(h.ltp)}`, className: 'text-right hidden md:table-cell' },
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
    {
      header: 'Day %',
      accessor: (h: EquityHolding) => `${h.day_chg_pct >= 0 ? '+' : ''}${h.day_chg_pct.toFixed(2)}%`,
      className: 'text-right hidden lg:table-cell',
      rowClassName: (h: EquityHolding) =>
        h.day_chg_pct >= 0 ? 'text-green-500' : 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equity</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {stocks.length} stocks · {etfs.length} ETFs · sourced from Zerodha demat holdings
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Invested"
          value={fmtINR(a.total_invested)}
          description={`Stocks: ${fmtINR(a.stocks_invested)} · ETFs: ${fmtINR(a.etfs_invested)}`}
          accent="#1D9E75"
        />
        <MetricCard
          label="Current Value"
          value={fmtINR(a.total_current)}
          description={`Stocks: ${fmtINR(a.stocks_current)} · ETFs: ${fmtINR(a.etfs_current)}`}
          accent="#1D9E75"
        />
        <MetricCard
          label="Unrealised P&L"
          value={fmtINR(a.total_pnl)}
          sub={fmtPct(a.return_pct)}
          positive={a.total_pnl >= 0}
          negative={a.total_pnl < 0}
          description="Total gain/loss on open positions"
          accent="#1D9E75"
        />
        <MetricCard
          label="Today's Change"
          value={fmtINR(dayPnL)}
          sub={`Best: ${best?.instrument}`}
          positive={dayPnL >= 0}
          negative={dayPnL < 0}
          description="Estimated from last day change %"
          accent="#1D9E75"
        />
      </div>

      {/* Alert banners */}
      {(a.alerts_red.length > 0 || a.alerts_green.length > 0) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {a.alerts_red.length > 0 && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Holdings down more than 20%</p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                  {a.alerts_red.map(h => `${h.instrument} (${fmtPct(pnlPct(h))})`).join(' · ')}
                </p>
              </div>
            </div>
          )}
          {a.alerts_green.length > 0 && (
            <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <span className="text-xl mt-0.5">🚀</span>
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Multi-baggers — up over 100%</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {a.alerts_green.map(h => `${h.instrument} (${fmtPct(pnlPct(h))})`).join(' · ')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <HoldingsTable
        rows={a.sorted_by_pnl}
        columns={columns}
        label="All holdings — sorted by P&L"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          data={pnlBarData}
          label="P&L per holding"
          layout="vertical"
          formatValue={v => fmtINR(v)}
          showValueLabel
        />
        <BarChart
          data={concentrationData}
          label="Portfolio concentration (% of book)"
          layout="vertical"
          defaultColor="#1D9E75"
          formatValue={v => `${v}%`}
          showValueLabel
        />
      </div>

      {/* Stocks vs ETFs breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Stocks</p>
          <p className="text-xs text-gray-400 mb-4">Individual company bets · {stocks.length} positions</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Invested</dt><dd className="font-medium">{fmtINR(a.stocks_invested)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Current</dt><dd className="font-medium">{fmtINR(a.stocks_current)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">P&L</dt>
              <dd className={`font-medium ${a.stocks_current - a.stocks_invested >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmtINR(a.stocks_current - a.stocks_invested)}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Return %</dt>
              <dd className={`font-medium ${a.stocks_current - a.stocks_invested >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmtPct(a.stocks_invested > 0 ? (a.stocks_current - a.stocks_invested) / a.stocks_invested * 100 : 0)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ETFs & Index Funds</p>
          <p className="text-xs text-gray-400 mb-4">Passive market exposure · {etfs.length} positions</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Invested</dt><dd className="font-medium">{fmtINR(a.etfs_invested)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Current</dt><dd className="font-medium">{fmtINR(a.etfs_current)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">P&L</dt>
              <dd className={`font-medium ${a.etfs_current - a.etfs_invested >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmtINR(a.etfs_current - a.etfs_invested)}
              </dd>
            </div>
            <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Return %</dt>
              <dd className={`font-medium ${a.etfs_current - a.etfs_invested >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmtPct(a.etfs_invested > 0 ? (a.etfs_current - a.etfs_invested) / a.etfs_invested * 100 : 0)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
