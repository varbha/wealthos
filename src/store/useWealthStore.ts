import { create } from 'zustand'
import type {
  MFHolding,
  EquityHolding,
  FOContract,
  FOSummary,
  FDEntry,
  WealthSnapshot,
  UploadLogEntry,
} from '../types'

const KEYS = {
  mf: 'wealthos:mf_holdings',
  equity: 'wealthos:equity_holdings',
  fo_trades: 'wealthos:fo_trades',
  fo_summary: 'wealthos:fo_summary',
  fd: 'wealthos:fd_list',
  snapshots: 'wealthos:wealth_snapshots',
  upload_log: 'wealthos:upload_log',
  last_updated: 'wealthos:last_updated',
} as const

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

interface WealthState {
  mfHoldings: MFHolding[]
  equityHoldings: EquityHolding[]
  foTrades: FOContract[]
  foSummary: FOSummary | null
  fdList: FDEntry[]
  snapshots: WealthSnapshot[]
  uploadLog: UploadLogEntry[]
  lastUpdated: string | null

  setMFHoldings: (data: MFHolding[]) => void
  setEquityHoldings: (data: EquityHolding[]) => void
  setFOTrades: (data: FOContract[], summary: FOSummary) => void
  addFD: (fd: FDEntry) => void
  removeFD: (id: string) => void
  appendSnapshot: (snap: WealthSnapshot) => void
  appendUploadLog: (entry: UploadLogEntry) => void
  hydrate: () => void
}

export const useWealthStore = create<WealthState>((set, get) => ({
  mfHoldings: [],
  equityHoldings: [],
  foTrades: [],
  foSummary: null,
  fdList: [],
  snapshots: [],
  uploadLog: [],
  lastUpdated: null,

  hydrate() {
    set({
      mfHoldings: load<MFHolding[]>(KEYS.mf, []),
      equityHoldings: load<EquityHolding[]>(KEYS.equity, []),
      foTrades: load<FOContract[]>(KEYS.fo_trades, []),
      foSummary: load<FOSummary | null>(KEYS.fo_summary, null),
      fdList: load<FDEntry[]>(KEYS.fd, []),
      snapshots: load<WealthSnapshot[]>(KEYS.snapshots, []),
      uploadLog: load<UploadLogEntry[]>(KEYS.upload_log, []),
      lastUpdated: localStorage.getItem(KEYS.last_updated),
    })
  },

  setMFHoldings(data) {
    save(KEYS.mf, data)
    save(KEYS.last_updated, new Date().toISOString())
    set({ mfHoldings: data, lastUpdated: new Date().toISOString() })
  },

  setEquityHoldings(data) {
    save(KEYS.equity, data)
    save(KEYS.last_updated, new Date().toISOString())
    set({ equityHoldings: data, lastUpdated: new Date().toISOString() })
  },

  setFOTrades(data, summary) {
    save(KEYS.fo_trades, data)
    save(KEYS.fo_summary, summary)
    save(KEYS.last_updated, new Date().toISOString())
    set({ foTrades: data, foSummary: summary, lastUpdated: new Date().toISOString() })
  },

  addFD(fd) {
    const list = [...get().fdList, fd]
    save(KEYS.fd, list)
    set({ fdList: list })
  },

  removeFD(id) {
    const list = get().fdList.filter((f) => f.id !== id)
    save(KEYS.fd, list)
    set({ fdList: list })
  },

  appendSnapshot(snap) {
    const snaps = [...get().snapshots, snap]
    save(KEYS.snapshots, snaps)
    set({ snapshots: snaps })
  },

  appendUploadLog(entry) {
    const log = [...get().uploadLog, entry]
    save(KEYS.upload_log, log)
    set({ uploadLog: log })
  },
}))
