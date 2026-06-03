import { create } from 'zustand'
import type {
  MFHolding,
  EquityHolding,
  FOContract,
  FOSummary,
  FDEntry,
  PhysicalAsset,
  WealthSnapshot,
  UploadLogEntry,
} from '../types'

const KEYS = {
  mf:              'wealthos:mf_holdings',
  equity:          'wealthos:equity_holdings',
  fo_trades:       'wealthos:fo_trades',
  fo_summary:      'wealthos:fo_summary',
  fd:              'wealthos:fd_list',
  physical_assets: 'wealthos:physical_assets',
  snapshots:       'wealthos:wealth_snapshots',
  upload_log:      'wealthos:upload_log',
  last_updated:    'wealthos:last_updated',
} as const

const DEFAULT_ASSETS: PhysicalAsset[] = [
  {
    id: 'car-001',
    name: 'Car',
    category: 'vehicle',
    purchase_value: 900000,
    purchase_date: '2025-08-19',
    depreciation_type: 'irdai_vehicle',
  },
]

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

/** Replace today's snapshot if one exists, otherwise append. */
function upsertSnapshot(existing: WealthSnapshot[], next: WealthSnapshot): WealthSnapshot[] {
  const today = next.date
  const idx = existing.findIndex(s => s.date === today)
  if (idx >= 0) {
    const updated = [...existing]
    updated[idx] = next
    return updated
  }
  return [...existing, next]
}

interface WealthState {
  mfHoldings:     MFHolding[]
  equityHoldings: EquityHolding[]
  foTrades:       FOContract[]
  foSummary:      FOSummary | null
  fdList:         FDEntry[]
  physicalAssets: PhysicalAsset[]
  snapshots:      WealthSnapshot[]
  uploadLog:      UploadLogEntry[]
  lastUpdated:    string | null

  setMFHoldings:     (data: MFHolding[]) => void
  setEquityHoldings: (data: EquityHolding[]) => void
  setFOTrades:       (data: FOContract[], summary: FOSummary) => void
  addFD:             (fd: FDEntry) => void
  removeFD:          (id: string) => void
  addPhysicalAsset:    (asset: PhysicalAsset) => void
  removePhysicalAsset: (id: string) => void
  appendSnapshot:    (snap: WealthSnapshot) => void
  appendUploadLog:   (entry: UploadLogEntry) => void
  hydrate:           () => void
}

export const useWealthStore = create<WealthState>((set, get) => ({
  mfHoldings:     [],
  equityHoldings: [],
  foTrades:       [],
  foSummary:      null,
  fdList:         [],
  physicalAssets: [],
  snapshots:      [],
  uploadLog:      [],
  lastUpdated:    null,

  hydrate() {
    const stored = load<PhysicalAsset[]>(KEYS.physical_assets, [])
    // Seed the default car if it was never saved
    const physicalAssets = stored.length > 0 ? stored : DEFAULT_ASSETS
    if (stored.length === 0) save(KEYS.physical_assets, DEFAULT_ASSETS)

    set({
      mfHoldings:     load<MFHolding[]>(KEYS.mf, []),
      equityHoldings: load<EquityHolding[]>(KEYS.equity, []),
      foTrades:       load<FOContract[]>(KEYS.fo_trades, []),
      foSummary:      load<FOSummary | null>(KEYS.fo_summary, null),
      fdList:         load<FDEntry[]>(KEYS.fd, []),
      physicalAssets,
      snapshots:      load<WealthSnapshot[]>(KEYS.snapshots, []),
      uploadLog:      load<UploadLogEntry[]>(KEYS.upload_log, []),
      lastUpdated:    localStorage.getItem(KEYS.last_updated),
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
    const list = get().fdList.filter(f => f.id !== id)
    save(KEYS.fd, list)
    set({ fdList: list })
  },

  addPhysicalAsset(asset) {
    const list = [...get().physicalAssets, asset]
    save(KEYS.physical_assets, list)
    set({ physicalAssets: list })
  },

  removePhysicalAsset(id) {
    const list = get().physicalAssets.filter(a => a.id !== id)
    save(KEYS.physical_assets, list)
    set({ physicalAssets: list })
  },

  appendSnapshot(snap) {
    const snaps = upsertSnapshot(get().snapshots, snap)
    save(KEYS.snapshots, snaps)
    set({ snapshots: snaps })
  },

  appendUploadLog(entry) {
    const log = [...get().uploadLog, entry]
    save(KEYS.upload_log, log)
    set({ uploadLog: log })
  },
}))
