import * as XLSX from 'xlsx'
import type { MFHolding } from '../types'

export function parseMFCAS(buffer: ArrayBuffer): MFHolding[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets['Portfolio Details']
  if (!ws) throw new Error('Sheet "Portfolio Details" not found')

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })

  // Header at index 11, data from index 12
  const DATA_START = 12
  const now = new Date().toISOString()
  const holdings: MFHolding[] = []

  for (let i = DATA_START; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const scheme_name = String(row[0] ?? '').trim()
    if (!scheme_name || scheme_name.length < 5) continue

    const rawCategory = String(row[2] ?? '').trim()
    if (rawCategory.toUpperCase() === 'CASH') continue

    const invested = parseFloat(String(row[4])) || 0
    const current_value = parseFloat(String(row[5])) || 0
    const returns = parseFloat(String(row[6])) || 0
    const units = parseFloat(String(row[7])) || 0
    const is_active = invested > 0
    const return_pct = invested > 0 ? (returns / invested) * 100 : 0

    holdings.push({
      scheme_name,
      amc: String(row[1] ?? '').trim(),
      category: normaliseCategory(rawCategory),
      folio: String(row[3] ?? '').trim(),
      invested,
      current_value,
      returns,
      units,
      return_pct,
      is_active,
      parsed_at: now,
    })
  }

  return holdings
}

function normaliseCategory(raw: string): string {
  const upper = raw.toUpperCase()
  if (upper === 'EQUITY' || upper === 'EQUITY FUND' || upper === 'EQUITY FUNDS') return 'Equity'
  if (upper === 'CASH' || upper === 'LIQUID') return 'Liquid'
  if (upper === 'DEBT') return 'Debt'
  if (upper === 'HYBRID') return 'Hybrid'
  return raw
}
