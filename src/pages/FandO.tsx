import { useWealthStore } from '../store/useWealthStore'
import { computeFOAnalytics } from '../calculators/foAnalytics'
import BarChart from '../components/BarChart'
import { fmtINR } from '../components/HoldingsTable'

const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`
const fmt2   = (v: number) => v.toFixed(2)

export default function FandO() {
  const { foTrades, foSummary } = useWealthStore()

  if (foTrades.length === 0 || !foSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-4xl mb-4">📉</p>
        <p className="text-gray-600 dark:text-gray-400 font-medium">No F&O data uploaded</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload your Zerodha F&O P&L Excel file to analyse your options trading.</p>
      </div>
    )
  }

  const a = computeFOAnalytics(foTrades, foSummary)
  const winners = foTrades.filter(c => c.realized_pnl > 0).length
  const losers  = foTrades.filter(c => c.realized_pnl < 0).length

  const tradeDistData = a.all_sorted.map((c, i) => ({
    name: String(i + 1),
    value: c.realized_pnl,
    color: c.realized_pnl >= 0 ? '#1D9E75' : '#D4537E',
  }))

  const underlyingData = a.by_underlying.map(u => ({
    name: u.underlying,
    value: u.pnl,
    color: u.pnl >= 0 ? '#1D9E75' : '#D4537E',
  }))

  const cepeData = a.by_type.map(t => ({
    name: t.option_type === 'CE' ? 'Call (CE)' : 'Put (PE)',
    value: t.pnl,
    color: t.option_type === 'CE' ? '#378ADD' : '#D4537E',
  }))

  const statCards = [
    {
      label: 'Realized P&L',
      value: fmtINR(a.summary.realized_pnl),
      pos: a.summary.realized_pnl >= 0,
      desc: 'Gross P&L before brokerage & taxes',
    },
    {
      label: 'Net P&L',
      value: fmtINR(a.summary.net_pnl),
      pos: a.summary.net_pnl >= 0,
      desc: `After charges of ${fmtINR(a.summary.charges)}`,
    },
    {
      label: 'Win Rate',
      value: fmtPct(a.win_rate),
      pos: a.win_rate >= 0.5,
      desc: `${winners} winners · ${losers} losers · ${foTrades.length} total`,
    },
    {
      label: 'Profit Factor',
      value: fmt2(a.profit_factor),
      pos: a.profit_factor >= 1,
      desc: a.profit_factor >= 1 ? 'Profitable — gross wins exceed gross losses' : 'Losing — gross losses exceed gross wins',
    },
    {
      label: 'Avg Winner',
      value: fmtINR(a.avg_winner),
      pos: true,
      desc: `Avg profit per winning trade`,
    },
    {
      label: 'Avg Loser',
      value: fmtINR(a.avg_loser),
      pos: false,
      desc: `Avg loss per losing trade`,
    },
    {
      label: 'Expectancy',
      value: fmtINR(a.expectancy),
      pos: a.expectancy >= 0,
      desc: 'Expected P&L per trade on average',
    },
    {
      label: 'Total Charges',
      value: fmtINR(a.summary.charges),
      pos: false,
      desc: 'Brokerage, STT, GST, exchange fees',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">F&O Trading</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Options P&L from Zerodha · {foTrades.length} contracts · NIFTY & SENSEX weekly/monthly options
        </p>
      </div>

      {/* P&L hero */}
      <div className={`rounded-2xl p-6 text-white ${a.summary.net_pnl >= 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-rose-600 to-pink-700'}`}>
        <p className="text-sm font-medium opacity-80 mb-1">Net P&L (after charges)</p>
        <p className="text-4xl font-bold">{fmtINR(a.summary.net_pnl)}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm opacity-90">
          <span>Realized: {fmtINR(a.summary.realized_pnl)}</span>
          <span>Charges: −{fmtINR(a.summary.charges)}</span>
          <span>Win rate: {fmtPct(a.win_rate)}</span>
          <span>Profit factor: {fmt2(a.profit_factor)}</span>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(s => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.pos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* CE vs PE and underlying */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          data={cepeData}
          label="Calls vs Puts — realized P&L"
          layout="horizontal"
          formatValue={v => fmtINR(v)}
        />
        <BarChart
          data={underlyingData}
          label="By underlying — realized P&L"
          layout="horizontal"
          formatValue={v => fmtINR(v)}
        />
      </div>

      {/* Trade distribution */}
      <BarChart
        data={tradeDistData}
        label={`Individual trade P&L — ${foTrades.length} contracts`}
        sublabel="Sorted best → worst · scroll to explore"
        scrollable
        formatValue={v => fmtINR(v)}
      />

      {/* Best / Worst / Charges */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TradesCard title="🏆 Best 5 trades" trades={a.best_trades} positive />
        <TradesCard title="💸 Worst 5 trades" trades={a.worst_trades} positive={false} />
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Charges breakdown</p>
          <p className="text-xs text-gray-400 mb-4">Brokerage, STT, exchange, GST — drag on P&L</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Realized P&L</dt>
              <dd className={`font-medium ${a.summary.realized_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {fmtINR(a.summary.realized_pnl)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Total charges</dt>
              <dd className="font-medium text-red-500">−{fmtINR(a.summary.charges)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
              <dt className="font-semibold text-gray-700 dark:text-gray-300">Net P&L</dt>
              <dd className={`font-bold ${a.summary.net_pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {fmtINR(a.summary.net_pnl)}
              </dd>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400">
                Charges are {a.summary.realized_pnl !== 0
                  ? `${Math.abs(a.summary.charges / a.summary.realized_pnl * 100).toFixed(1)}% of gross P&L`
                  : '—'}
              </p>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

function TradesCard({
  title, trades, positive,
}: {
  title: string
  trades: { symbol: string; realized_pnl: number }[]
  positive: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-4">{positive ? 'Highest earning contracts' : 'Biggest losing contracts'}</p>
      <dl className="space-y-3 text-sm">
        {trades.map(t => (
          <div key={t.symbol} className="flex justify-between gap-2">
            <dt className="text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[140px]">{t.symbol}</dt>
            <dd className={`font-semibold shrink-0 ${positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {fmtINR(t.realized_pnl)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
