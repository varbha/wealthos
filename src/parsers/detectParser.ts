import * as XLSX from 'xlsx'

export type ParserType = 'mf' | 'equity' | 'fo' | 'unknown'

export function detectParser(file: File, buffer: ArrayBuffer): ParserType {
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv')) {
    const text = new TextDecoder().decode(buffer.slice(0, 500))
    if (text.includes('Instrument') && text.includes('Avg. cost') && text.includes('Cur. val')) {
      return 'equity'
    }
    return 'unknown'
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    try {
      const wb = XLSX.read(buffer, { type: 'array' })
      if (wb.SheetNames.includes('Portfolio Details')) return 'mf'
      if (wb.SheetNames.includes('F&O')) return 'fo'
    } catch {
      // fall through
    }
    return 'unknown'
  }

  return 'unknown'
}
