import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Slice {
  name: string
  value: number
  color: string
}

interface Props {
  data: Slice[]
  label?: string
}

const fmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })

export default function DonutChart({ data, label }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      {label && (
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{label}</p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [`₹${fmt.format(v)}`, '']}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
