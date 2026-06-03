import { useWealthStore } from '../store/useWealthStore'
import { computeMFAnalytics } from '../calculators/mfAnalytics'
import MetricCard from '../components/MetricCard'
import BarChart from '../components/BarChart'
import DonutChart from '../components/DonutChart'
import HoldingsTable, { fmtINR, fmtPct } from '../components/HoldingsTable'
import type { MFHolding } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  Equity: '#378ADD',
  Liquid: '#EF9F27',
  Debt: '#8b5cf6',
  Hybrid: '#1D9E75',
}

export default function MutualFunds() {
  const { mfHoldings } = useWealthStore()

  if (mfHoldings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-4xl mb-4">📊</p>
        <p className="text-gray-600 dark:text-gray-400 font-medium">No MF data uploaded</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload your MF Central CAS (.xlsx) file to see your mutual fund portfolio.</p>
      </div>
    )
  }

  const a = computeMFAnalytics(mfHoldings)
  const best = a.top_performers[0]

  const amcData = a.by_amc.map(r => ({
    name: r.amc.replace(' Mutual Fund', '').replace(' Asset Management', '').replace(' Financial Mutual Fund', ''),
    value: r.current,
    color: '#378ADD',
  }))

  const categoryData = a.by_category.map(r => ({
    name: r.category,
    value: r.current,
    color: CATEGORY_COLORS[r.category] ?? '#6b7280',
  }))

  const columns = [
    {
      header: 'Scheme',
      accessor: (h: MFHolding) => h.scheme_name,
      className: 'max-w-[240px] truncate',
    },
    {
      header: 'AMC',
      accessor: (h: MFHolding) => h.amc.split(' ').slice(0, 2).join(' '),
      className: 'hidden lg:table-cell',
    },
    {
      header: 'Category',
      accessor: (h: MFHolding) => h.category,
      className: 'hidden lg:table-cell',
    },
    {
      header: 'Invested',
      accessor: (h: MFHolding) => fmtINR(h.invested),
      className: 'text-right',
    },
    {
      header: 'Current',
      accessor: (h: MFHolding) => fmtINR(h.current_value),
      className: 'text-right',
    },
    {
      header: 'Gain',
      accessor: (h: MFHolding) => fmtINR(h.returns),
      className: 'text-right',
      rowClassName: (h: MFHolding) =>
        h.returns >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
    {
      header: 'Return %',
      accessor: (h: MFHolding) => fmtPct(h.return_pct),
      className: 'text-right',
      rowClassName: (h: MFHolding) =>
        h.return_pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
  ]

  const sorted = [...mfHoldings]
    .filter(h => h.is_active)
    .sort((a, b) => b.return_pct - a.return_pct)

  const inactive = mfHoldings.filter(h => !h.is_active)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mutual Funds</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Sourced from MF Central CAS · {a.active_count} active schemes across {a.by_amc.length} AMCs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Invested"
          value={fmtINR(a.total_invested)}
          description="Capital deployed across all active schemes"
          accent="#378ADD"
        />
        <MetricCard
          label="Current Value"
          value={fmtINR(a.total_current)}
          description="Market value as of last CAS date"
          accent="#378ADD"
        />
        <MetricCard
          label="Total Gain"
          value={fmtINR(a.total_gain)}
          sub={fmtPct(a.return_pct)}
          positive={a.total_gain >= 0}
          negative={a.total_gain < 0}
          description="Absolute return since investment"
          accent="#378ADD"
        />
        <MetricCard
          label="Best Performer"
          value={best ? fmtPct(best.return_pct) : '—'}
          sub={best?.scheme_name.split(' ').slice(0, 4).join(' ')}
          positive
          description={best ? `Gain of ${fmtINR(best.returns)}` : ''}
          accent="#378ADD"
        />
      </div>

      {/* Top & worst performers highlight */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">🏆 Top performers</p>
          <p className="text-xs text-gray-400 mb-4">Sorted by absolute return %</p>
          <div className="space-y-3">
            {a.top_performers.map(h => (
              <div key={h.scheme_name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{h.scheme_name.split(' ').slice(0, 5).join(' ')}</p>
                  <p className="text-xs text-gray-400">{h.amc.split(' ').slice(0, 2).join(' ')} · {fmtINR(h.invested)} invested</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">{fmtPct(h.return_pct)}</p>
                  <p className="text-xs text-green-500">+{fmtINR(h.returns)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">📉 Worst performers</p>
          <p className="text-xs text-gray-400 mb-4">Schemes with lowest returns</p>
          <div className="space-y-3">
            {a.worst_performers.map(h => (
              <div key={h.scheme_name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{h.scheme_name.split(' ').slice(0, 5).join(' ')}</p>
                  <p className="text-xs text-gray-400">{h.amc.split(' ').slice(0, 2).join(' ')} · {fmtINR(h.invested)} invested</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${h.return_pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{fmtPct(h.return_pct)}</p>
                  <p className={`text-xs ${h.returns >= 0 ? 'text-green-500' : 'text-red-400'}`}>{fmtINR(h.returns)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          data={amcData}
          label="By AMC — current value"
          layout="vertical"
          showValueLabel
          defaultColor="#378ADD"
        />
        <DonutChart
          data={categoryData}
          label="By category — current value"
        />
      </div>

      <HoldingsTable
        rows={sorted}
        columns={columns}
        label={`All active schemes (${a.active_count}) — sorted by return %`}
      />

      {inactive.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Exited funds ({inactive.length})
          </p>
          <p className="text-xs text-gray-400 mb-3">These schemes have zero units — fully redeemed.</p>
          <div className="space-y-1">
            {inactive.map(h => (
              <p key={h.scheme_name} className="text-xs text-gray-400 dark:text-gray-500">
                {h.scheme_name.trim()} · {h.amc.split(' ').slice(0, 2).join(' ')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
