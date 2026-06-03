import * as XLSX from 'xlsx'
import type { FOContract, FOSummary } from '../types'

const UNDERLYINGS = ['BANKNIFTY', 'FINNIFTY', 'SENSEX', 'NIFTY']

export function parseFO(buffer: ArrayBuffer): { contracts: FOContract[]; summary: FOSummary } {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets['F&O']
  if (!ws) throw new Error('Sheet "F&O" not found')

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  // Extract summary from rows 14 and 16 (0-indexed)
  const charges = parseFloat(String(rows[14]?.[1] ?? 0)) || 0
  const realized_pnl = parseFloat(String(rows[16]?.[1] ?? 0)) || 0

  // Header at row 37, data from row 38
  const DATA_START = 38
  const now = new Date().toISOString()
  const contracts: FOContract[] = []

  for (let i = DATA_START; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const symbol = String(row[0] ?? '').trim()
    if (!symbol) continue

    const underlying = extractUnderlying(symbol)
    if (!underlying) continue

    const option_type = symbol.slice(-2).toUpperCase() as 'CE' | 'PE'
    if (option_type !== 'CE' && option_type !== 'PE') continue

    const quantity = parseFloat(String(row[2])) || 0
    const buy_value = parseFloat(String(row[3])) || 0
    const sell_value = parseFloat(String(row[4])) || 0
    const contract_pnl = parseFloat(String(row[5])) || 0
    const realized_pnl_pct = parseFloat(String(row[6])) || 0

    contracts.push({
      symbol,
      underlying,
      option_type,
      quantity,
      buy_value,
      sell_value,
      realized_pnl: contract_pnl,
      realized_pnl_pct,
      parsed_at: now,
    })
  }

  return {
    contracts,
    summary: {
      realized_pnl,
      charges,
      net_pnl: realized_pnl - charges,
    },
  }
}

function extractUnderlying(symbol: string): string | null {
  for (const u of UNDERLYINGS) {
    if (symbol.startsWith(u)) return u
  }
  return null
}
