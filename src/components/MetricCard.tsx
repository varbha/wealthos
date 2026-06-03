interface Props {
  label: string
  value: string
  sub?: string
  accent?: string
  positive?: boolean
  negative?: boolean
}

export default function MetricCard({ label, value, sub, accent, positive, negative }: Props) {
  const valueColor = positive
    ? 'text-green-600 dark:text-green-400'
    : negative
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-900 dark:text-white'

  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
      style={accent ? { borderTopColor: accent, borderTopWidth: 3 } : undefined}
    >
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
