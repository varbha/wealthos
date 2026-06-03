import { useWealthStore } from '../store/useWealthStore'
import { computeFOAnalytics } from '../calculators/foAnalytics'
import BarChart from '../components/BarChart'
import { fmtINR } from '../components/HoldingsTable'

const fmt2 = (v: number) => v.toFixed(2)
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`

export default function FandO() {
  const { foTrades, foSummary } = useWealthStore()

  if (foTrades.length === 0 || !foSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-sm">No F&O data. Upload your Zerodha P&L file.</p>
      </div>
    )
  }

  const a = computeFOAnalytics(foTrades, foSummary)

  const tradeDistData = a.all_sorted.map((c, i) => ({
    name: String(i + 1),
    value: c.realized_pnl,
    color: c.realized_pnl >= 0 ? '#1D9E75' : '#D4537E',
  }))

  const underlyingData = a.by_underlying.map((u) => ({
    name: u.underlying,
    value: u.pnl,
    color: u.pnl >= 0 ? '#1D9E75' : '#D4537E',
  }))

  const cepeData = a.by_type.map((t) => ({
    name: t.option_type,
    value: t.pnl,
    color: t.option_type === 'CE' ? '#378ADD' : '#D4537E',
  }))

  const stats = [
    { label: 'Realized P&L', value: fmtINR(a.summary.realized_pnl), pos: a.summary.realized_pnl >= 0 },
    { label: 'Net P&L', value: fmtINR(a.summary.net_pnl), pos: a.summary.net_pnl >= 0 },
    { label: 'Win Rate', value: fmtPct(a.win_rate), pos: a.win_rate >= 0.5 },
    { label: 'Profit Factor', value: fmt2(a.profit_factor), pos: a.profit_factor >= 1 },
    { label: 'Avg Winner', value: fmtINR(a.avg_winner), pos: true },
    { label: 'Avg Loser', value: fmtINR(a.avg_loser), pos: false },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">F&O Trading</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              {s.label}
            </p>
            <p
              className={`text-2xl font-bold ${
                s.pos ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          data={cepeData}
          label="CE vs PE — realized P&L"
          layout="horizontal"
          formatValue={(v) => fmtINR(v)}
        />
        <BarChart
          data={underlyingData}
          label="By underlying — realized P&L"
          layout="horizontal"
          formatValue={(v) => fmtINR(v)}
        />
      </div>

      <BarChart
        data={tradeDistData}
        label={`Trade P&L distribution — ${foTrades.length} contracts (best → worst)`}
        layout="horizontal"
        formatValue={(v) => fmtINR(v)}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChargesCard
          charges={a.summary.charges}
          realized={a.summary.realized_pnl}
          net={a.summary.net_pnl}
        />
        <TradesCard title="Best 5 trades" trades={a.best_trades} positive />
        <TradesCard title="Worst 5 trades" trades={a.worst_trades} positive={false} />
      </div>
    </div>
  )
}

function ChargesCard({
  charges,
  realized,
  net,
}: {
  charges: number
  realized: number
  net: number
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Charges</p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Realized P&L</dt>
          <dd className="font-medium text-green-600 dark:text-green-400">{fmtINR(realized)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500 dark:text-gray-400">Total charges</dt>
          <dd className="font-medium text-red-500">{fmtINR(charges)}</dd>
        </div>
        <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
          <dt className="font-semibold text-gray-700 dark:text-gray-300">Net P&L</dt>
          <dd className={`font-bold ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {fmtINR(net)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function TradesCard({
  title,
  trades,
  positive,
}: {
  title: string
  trades: { symbol: string; realized_pnl: number }[]
  positive: boolean
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</p>
      <dl className="space-y-2 text-sm">
        {trades.map((t) => (
          <div key={t.symbol} className="flex justify-between gap-2">
            <dt className="text-gray-500 dark:text-gray-400 font-mono text-xs truncate max-w-[130px]">
              {t.symbol}
            </dt>
            <dd
              className={`font-medium shrink-0 ${
                positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {fmtINR(t.realized_pnl)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
