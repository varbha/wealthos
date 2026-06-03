import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

interface BarItem {
  name: string
  value: number
  color?: string
}

interface Props {
  data: BarItem[]
  label?: string
  layout?: 'horizontal' | 'vertical'
  defaultColor?: string
  formatValue?: (v: number) => string
  showValueLabel?: boolean
}

const fmtINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

export default function BarChart({
  data,
  label,
  layout = 'vertical',
  defaultColor = '#378ADD',
  formatValue = fmtINR,
  showValueLabel = false,
}: Props) {
  const isVertical = layout === 'vertical'

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {label && (
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{label}</p>
      )}
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
        <ReBarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 0, right: showValueLabel ? 48 : 12, bottom: 0, left: 0 }}
        >
          {isVertical ? (
            <>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
            </>
          )}
          <Tooltip
            formatter={(v: number) => [formatValue(v), '']}
            contentStyle={{ fontSize: 12 }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? defaultColor} />
            ))}
            {showValueLabel && (
              <LabelList
                dataKey="value"
                position="right"
                formatter={formatValue}
                style={{ fontSize: 11, fill: '#6b7280' }}
              />
            )}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}
