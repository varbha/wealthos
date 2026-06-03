import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

interface BarItem {
  name: string
  value: number
  color?: string
}

interface Props {
  data: BarItem[]
  label?: string
  sublabel?: string
  layout?: 'horizontal' | 'vertical'
  defaultColor?: string
  formatValue?: (v: number) => string
  showValueLabel?: boolean
  /** Render as a fixed-height horizontally scrollable column chart */
  scrollable?: boolean
}

const fmtINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(v)

export default function BarChart({
  data,
  label,
  sublabel,
  layout = 'vertical',
  defaultColor = '#378ADD',
  formatValue = fmtINR,
  showValueLabel = false,
  scrollable = false,
}: Props) {
  const isVertical = layout === 'vertical'

  // Scrollable mode: fixed-height container, bar width drives total width
  if (scrollable) {
    const barW = 10
    const gap  = 3
    const totalW = Math.max(800, data.length * (barW + gap))
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        {label && <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
        {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{sublabel}</p>}
        <div className="overflow-x-auto">
          <div style={{ width: totalW, height: 220 }}>
            <ReBarChart
              width={totalW}
              height={220}
              data={data}
              layout="horizontal"
              margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
              barCategoryGap={gap}
            >
              <XAxis dataKey="name" hide />
              <YAxis type="number" domain={['auto', 'auto']} hide axisLine={false} tickLine={false} />
              <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
              <Tooltip
                formatter={(v: number) => [formatValue(v), '']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="value" maxBarSize={barW} isAnimationActive={false}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color ?? defaultColor} />
                ))}
              </Bar>
            </ReBarChart>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#1D9E75]" /> Win
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#D4537E]" /> Loss
          </span>
        </div>
      </div>
    )
  }

  const height = Math.max(200, data.length * 40)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {label && <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      {sublabel && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{sublabel}</p>}
      <ResponsiveContainer width="100%" height={isVertical ? height : 220}>
        <ReBarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: showValueLabel ? 56 : 16, bottom: 4, left: 0 }}
          barCategoryGap="25%"
        >
          {isVertical ? (
            <>
              <XAxis type="number" domain={['auto', 'auto']} hide axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={148}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis type="number" domain={['auto', 'auto']} hide axisLine={false} tickLine={false} />
            </>
          )}
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
          <Tooltip
            formatter={(v: number) => [formatValue(v), '']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="value" maxBarSize={32} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? defaultColor} />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}
