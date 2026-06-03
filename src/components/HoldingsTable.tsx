interface Column<T> {
  header: string
  accessor: (row: T) => string | number
  className?: string
  rowClassName?: (row: T) => string
}

interface Props<T> {
  rows: T[]
  columns: Column<T>[]
  label?: string
}

const fmtCur = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export function fmtINR(v: number) {
  return `₹${fmtCur.format(v)}`
}

export function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
}

export default function HoldingsTable<T>({ rows, columns, label }: Props<T>) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {label && (
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {columns.map((col) => {
                  const val = col.accessor(row)
                  const extra = col.rowClassName?.(row) ?? ''
                  return (
                    <td
                      key={col.header}
                      className={`px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap ${col.className ?? ''} ${extra}`}
                    >
                      {val}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
