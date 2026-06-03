export interface MFHolding {
  scheme_name: string
  amc: string
  category: string
  folio: string
  invested: number
  current_value: number
  returns: number
  units: number
  return_pct: number
  is_active: boolean
  parsed_at: string
}

export interface EquityHolding {
  instrument: string
  qty: number
  avg_cost: number
  ltp: number
  invested: number
  current_value: number
  pnl: number
  net_chg_pct: number
  day_chg_pct: number
  type: 'stock' | 'etf'
  parsed_at: string
}

export interface FOContract {
  symbol: string
  underlying: string
  option_type: 'CE' | 'PE'
  quantity: number
  buy_value: number
  sell_value: number
  realized_pnl: number
  realized_pnl_pct: number
  parsed_at: string
}

export interface FOSummary {
  realized_pnl: number
  charges: number
  net_pnl: number
}

export interface FDEntry {
  id: string
  bank: string
  principal: number
  interest_rate: number
  compounding: 'monthly' | 'quarterly' | 'annually'
  start_date: string
  maturity_date: string
  maturity_value: number
  is_active: boolean
}

export interface WealthSnapshot {
  date: string
  total: number
  mf: number
  equity: number
  fo_pnl: number
  fd: number
}

export interface UploadLogEntry {
  filename: string
  asset_class: 'mf' | 'equity' | 'fo' | 'fd'
  parsed_at: string
  record_count: number
  warnings: string[]
}
