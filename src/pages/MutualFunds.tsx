import { useWealthStore } from '../store/useWealthStore'
import { computeMFAnalytics } from '../calculators/mfAnalytics'
import MetricCard from '../components/MetricCard'
import BarChart from '../components/BarChart'
import HoldingsTable, { fmtINR, fmtPct } from '../components/HoldingsTable'
import type { MFHolding } from '../types'

export default function MutualFunds() {
  const { mfHoldings } = useWealthStore()

  if (mfHoldings.length === 0) {
    return <EmptyState />
  }

  const a = computeMFAnalytics(mfHoldings)
  const best = a.top_performers[0]

  const amcData = a.by_amc.map((r) => ({
    name: r.amc.replace(' Mutual Fund', '').replace(' Asset Management', ''),
    value: r.current,
    color: '#378ADD',
  }))

  const columns = [
    {
      header: 'Scheme',
      accessor: (h: MFHolding) => h.scheme_name,
      className: 'max-w-[260px] truncate',
    },
    { header: 'AMC', accessor: (h: MFHolding) => h.amc.split(' ').slice(0, 2).join(' ') },
    { header: 'Invested', accessor: (h: MFHolding) => fmtINR(h.invested), className: 'text-right' },
    { header: 'Current', accessor: (h: MFHolding) => fmtINR(h.current_value), className: 'text-right' },
    { header: 'Gain', accessor: (h: MFHolding) => fmtINR(h.returns), className: 'text-right',
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

  const sorted = [...mfHoldings].filter(h => h.is_active).sort((a, b) => b.return_pct - a.return_pct)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mutual Funds</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Invested" value={fmtINR(a.total_invested)} accent="#378ADD" />
        <MetricCard label="Current Value" value={fmtINR(a.total_current)} accent="#378ADD" />
        <MetricCard
          label="Total Gain"
          value={fmtINR(a.total_gain)}
          sub={fmtPct(a.return_pct)}
          positive={a.total_gain >= 0}
          negative={a.total_gain < 0}
          accent="#378ADD"
        />
        <MetricCard
          label="Best Return"
          value={best ? fmtPct(best.return_pct) : '—'}
          sub={best?.scheme_name.split(' ').slice(0, 3).join(' ')}
          positive
          accent="#378ADD"
        />
      </div>

      <BarChart
        data={amcData}
        label="By AMC — current value"
        layout="vertical"
        showValueLabel
      />

      <HoldingsTable
        rows={sorted}
        columns={columns}
        label={`All schemes (${a.active_count} active)`}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-gray-400 dark:text-gray-500 text-sm">No MF data. Upload your MF Central CAS file.</p>
    </div>
  )
}
