import { useWealthStore } from '../store/useWealthStore'
import UploadZone from '../components/UploadZone'
import { detectParser } from '../parsers/detectParser'
import { parseMFCAS } from '../parsers/parseMFCAS'
import { parseEquity } from '../parsers/parseEquity'
import { parseFO } from '../parsers/parseFO'
import { currentAssetValue } from '../calculators/assetDepreciation'
import type { UploadLogEntry } from '../types'

const CLASS_LABELS: Record<string, string> = {
  mf: 'Mutual Funds',
  equity: 'Equity',
  fo: 'F&O',
  fd: 'Fixed Deposits',
}

export default function Upload() {
  const {
    setMFHoldings, setEquityHoldings, setFOTrades,
    appendUploadLog, appendSnapshot, uploadLog,
  } = useWealthStore()

  function takeSnapshot() {
    const state = useWealthStore.getState()
    const mf       = state.mfHoldings.reduce((s, h) => s + h.current_value, 0)
    const equity   = state.equityHoldings.reduce((s, h) => s + h.current_value, 0)
    const fo_pnl   = state.foSummary?.realized_pnl ?? 0
    const fd       = state.fdList.filter(f => f.is_active).reduce((s, f) => s + f.maturity_value, 0)
    const physical = state.physicalAssets.reduce((s, a) => s + currentAssetValue(a), 0)
    appendSnapshot({
      date: new Date().toISOString().slice(0, 10),
      total: mf + equity + fo_pnl + fd + physical,
      mf, equity, fo_pnl, fd, physical,
    })
  }

  async function handleFile(file: File, buffer: ArrayBuffer) {
    const type = detectParser(file, buffer)
    if (type === 'unknown') throw new Error('File not recognised — check format')

    let record_count = 0
    const warnings: string[] = []

    if (type === 'mf') {
      const holdings = parseMFCAS(buffer)
      record_count = holdings.length
      setMFHoldings(holdings)
    } else if (type === 'equity') {
      const text = new TextDecoder().decode(buffer)
      const holdings = parseEquity(text)
      record_count = holdings.length
      setEquityHoldings(holdings)
    } else if (type === 'fo') {
      const { contracts, summary } = parseFO(buffer)
      record_count = contracts.length
      setFOTrades(contracts, summary)
    }

    takeSnapshot()

    const entry: UploadLogEntry = {
      filename: file.name,
      asset_class: type as UploadLogEntry['asset_class'],
      parsed_at: new Date().toISOString(),
      record_count,
      warnings,
    }
    appendUploadLog(entry)
  }

  const zones = [
    {
      label: 'MF Central CAS (.xlsx)',
      accept: '.xlsx,.xls',
      color: '#378ADD',
      type: 'mf',
    },
    {
      label: 'Zerodha Equity Holdings (.csv)',
      accept: '.csv',
      color: '#1D9E75',
      type: 'equity',
    },
    {
      label: 'Zerodha F&O P&L (.xlsx)',
      accept: '.xlsx,.xls',
      color: '#D4537E',
      type: 'fo',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Upload Data</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Files are parsed entirely in your browser — nothing is sent to any server.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {zones.map((z) => (
          <UploadZone
            key={z.type}
            label={z.label}
            accept={z.accept}
            color={z.color}
            onFile={handleFile}
          />
        ))}
      </div>

      {uploadLog.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent uploads</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['File', 'Type', 'Records', 'Parsed at'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {[...uploadLog].reverse().map((entry, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-mono text-xs max-w-[180px] truncate">
                      {entry.filename}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {CLASS_LABELS[entry.asset_class] ?? entry.asset_class}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{entry.record_count}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(entry.parsed_at).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
