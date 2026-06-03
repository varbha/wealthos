import { useState } from 'react'
import { useWealthStore } from '../store/useWealthStore'
import { currentAssetValue, depreciationPct, ageLabel } from '../calculators/assetDepreciation'
import { fmtINR } from '../components/HoldingsTable'
import type { FDEntry, PhysicalAsset } from '../types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function calcMaturity(
  principal: number, rate: number,
  compounding: FDEntry['compounding'],
  start: string, end: string,
): number {
  const n = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1
  const years = (new Date(end).getTime() - new Date(start).getTime()) / (365.25 * 24 * 3600 * 1000)
  return parseFloat((principal * Math.pow(1 + rate / 100 / n, n * years)).toFixed(2))
}

function tenureElapsed(start: string, end: string): number {
  const now = Date.now(), s = new Date(start).getTime(), e = new Date(end).getTime()
  if (now >= e) return 100
  if (now <= s) return 0
  return Math.round(((now - s) / (e - s)) * 100)
}

const EMPTY_FD = {
  bank: '', principal: '', interest_rate: '',
  compounding: 'quarterly' as FDEntry['compounding'],
  start_date: '', maturity_date: '',
}

const EMPTY_ASSET = {
  name: '', category: 'vehicle' as PhysicalAsset['category'],
  purchase_value: '', purchase_date: '',
  depreciation_type: 'irdai_vehicle' as PhysicalAsset['depreciation_type'],
  straight_line_years: '10',
}

const CATEGORY_ICON: Record<string, string> = { vehicle: '🚗', property: '🏠', other: '📦' }

const input = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400'

export default function FixedDeposits() {
  const { fdList, addFD, removeFD, physicalAssets, addPhysicalAsset, removePhysicalAsset } = useWealthStore()
  const [fdForm, setFdForm] = useState(EMPTY_FD)
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET)
  const [showFdForm, setShowFdForm] = useState(false)
  const [showAssetForm, setShowAssetForm] = useState(false)

  const activeFDs     = fdList.filter(f => f.is_active)
  const totalPrincipal = activeFDs.reduce((s, f) => s + f.principal, 0)
  const totalMaturity  = activeFDs.reduce((s, f) => s + f.maturity_value, 0)
  const totalAssets    = physicalAssets.reduce((s, a) => s + currentAssetValue(a), 0)
  const totalPurchase  = physicalAssets.reduce((s, a) => s + a.purchase_value, 0)

  function handleAddFD(e: React.FormEvent) {
    e.preventDefault()
    const principal = parseFloat(fdForm.principal)
    const rate = parseFloat(fdForm.interest_rate)
    addFD({
      id: generateId(), bank: fdForm.bank, principal, interest_rate: rate,
      compounding: fdForm.compounding, start_date: fdForm.start_date,
      maturity_date: fdForm.maturity_date,
      maturity_value: calcMaturity(principal, rate, fdForm.compounding, fdForm.start_date, fdForm.maturity_date),
      is_active: true,
    })
    setFdForm(EMPTY_FD)
    setShowFdForm(false)
  }

  function handleAddAsset(e: React.FormEvent) {
    e.preventDefault()
    addPhysicalAsset({
      id: generateId(),
      name: assetForm.name,
      category: assetForm.category,
      purchase_value: parseFloat(assetForm.purchase_value),
      purchase_date: assetForm.purchase_date,
      depreciation_type: assetForm.depreciation_type,
      straight_line_years: parseInt(assetForm.straight_line_years) || 10,
    })
    setAssetForm(EMPTY_ASSET)
    setShowAssetForm(false)
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── PHYSICAL ASSETS ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Physical Assets</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
              Vehicles, property — depreciated to current market value
            </p>
          </div>
          <button
            onClick={() => setShowAssetForm(v => !v)}
            className="px-4 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            {showAssetForm ? 'Cancel' : '+ Add asset'}
          </button>
        </div>

        {physicalAssets.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5" style={{ borderTopColor: '#6366f1', borderTopWidth: 3 }}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Purchase Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtINR(totalPurchase)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5" style={{ borderTopColor: '#6366f1', borderTopWidth: 3 }}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Value (depreciated)</p>
              <p className="text-2xl font-bold text-orange-500">{fmtINR(totalAssets)}</p>
              <p className="text-xs text-gray-400 mt-1">−{fmtINR(totalPurchase - totalAssets)} depreciated</p>
            </div>
          </div>
        )}

        {showAssetForm && (
          <form onSubmit={handleAddAsset} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Physical Asset</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <input className={input} placeholder="Honda City, Apartment…" value={assetForm.name} onChange={e => setAssetForm({ ...assetForm, name: e.target.value })} required />
              </Field>
              <Field label="Category" required>
                <select className={input} value={assetForm.category} onChange={e => setAssetForm({ ...assetForm, category: e.target.value as PhysicalAsset['category'] })}>
                  <option value="vehicle">Vehicle</option>
                  <option value="property">Property</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Purchase / IDV Value (₹)" required>
                <input className={input} type="number" placeholder="900000" value={assetForm.purchase_value} onChange={e => setAssetForm({ ...assetForm, purchase_value: e.target.value })} required />
              </Field>
              <Field label="Purchase Date" required>
                <input className={input} type="date" value={assetForm.purchase_date} onChange={e => setAssetForm({ ...assetForm, purchase_date: e.target.value })} required />
              </Field>
              <Field label="Depreciation method" required>
                <select className={input} value={assetForm.depreciation_type} onChange={e => setAssetForm({ ...assetForm, depreciation_type: e.target.value as PhysicalAsset['depreciation_type'] })}>
                  <option value="irdai_vehicle">IRDAI vehicle schedule (IDV)</option>
                  <option value="straight_line">Straight-line</option>
                  <option value="none">No depreciation</option>
                </select>
              </Field>
              {assetForm.depreciation_type === 'straight_line' && (
                <Field label="Useful life (years)" required>
                  <input className={input} type="number" value={assetForm.straight_line_years} onChange={e => setAssetForm({ ...assetForm, straight_line_years: e.target.value })} required />
                </Field>
              )}
            </div>
            <button type="submit" className="w-full py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
              Save asset
            </button>
          </form>
        )}

        {physicalAssets.length === 0 && !showAssetForm && (
          <div className="flex flex-col items-center justify-center h-32 text-center text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No physical assets yet. Click "+ Add asset" to get started.
          </div>
        )}

        <div className="space-y-3">
          {physicalAssets.map(asset => {
            const current = currentAssetValue(asset)
            const deprPct = depreciationPct(asset)
            const loss    = asset.purchase_value - current
            return (
              <div key={asset.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{CATEGORY_ICON[asset.category]}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{asset.name}</p>
                        <p className="text-xs text-gray-400">{ageLabel(asset.purchase_date)} old · {asset.depreciation_type === 'irdai_vehicle' ? 'IRDAI IDV schedule' : asset.depreciation_type === 'straight_line' ? `Straight-line ${asset.straight_line_years}yr` : 'No depreciation'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Purchase value</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{fmtINR(asset.purchase_value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Current value</p>
                        <p className="font-semibold text-orange-500">{fmtINR(current)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Depreciation</p>
                        <p className="font-semibold text-red-500">−{fmtINR(loss)} ({deprPct.toFixed(0)}%)</p>
                      </div>
                    </div>
                    {/* Depreciation progress bar */}
                    <div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-orange-400 transition-all" style={{ width: `${deprPct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{deprPct.toFixed(0)}% of value depreciated</p>
                    </div>
                  </div>
                  <button onClick={() => removePhysicalAsset(asset.id)} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FIXED DEPOSITS ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fixed Deposits</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Bank FDs — compounding interest calculator</p>
          </div>
          <button
            onClick={() => setShowFdForm(v => !v)}
            className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            {showFdForm ? 'Cancel' : '+ Add FD'}
          </button>
        </div>

        {activeFDs.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5" style={{ borderTopColor: '#EF9F27', borderTopWidth: 3 }}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Principal</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtINR(totalPrincipal)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5" style={{ borderTopColor: '#EF9F27', borderTopWidth: 3 }}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total at Maturity</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmtINR(totalMaturity)}</p>
              <p className="text-xs text-gray-400 mt-1">+{fmtINR(totalMaturity - totalPrincipal)} interest</p>
            </div>
          </div>
        )}

        {showFdForm && (
          <form onSubmit={handleAddFD} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Fixed Deposit</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bank" required><input className={input} placeholder="SBI, HDFC…" value={fdForm.bank} onChange={e => setFdForm({ ...fdForm, bank: e.target.value })} required /></Field>
              <Field label="Principal (₹)" required><input className={input} type="number" placeholder="100000" value={fdForm.principal} onChange={e => setFdForm({ ...fdForm, principal: e.target.value })} required /></Field>
              <Field label="Interest Rate (%)" required><input className={input} type="number" step="0.01" placeholder="7.5" value={fdForm.interest_rate} onChange={e => setFdForm({ ...fdForm, interest_rate: e.target.value })} required /></Field>
              <Field label="Compounding" required>
                <select className={input} value={fdForm.compounding} onChange={e => setFdForm({ ...fdForm, compounding: e.target.value as FDEntry['compounding'] })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </Field>
              <Field label="Start Date" required><input className={input} type="date" value={fdForm.start_date} onChange={e => setFdForm({ ...fdForm, start_date: e.target.value })} required /></Field>
              <Field label="Maturity Date" required><input className={input} type="date" value={fdForm.maturity_date} onChange={e => setFdForm({ ...fdForm, maturity_date: e.target.value })} required /></Field>
            </div>
            <button type="submit" className="w-full py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">Save FD</button>
          </form>
        )}

        {fdList.length === 0 && !showFdForm && (
          <div className="flex flex-col items-center justify-center h-32 text-center text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No fixed deposits yet. Click "+ Add FD" to get started.
          </div>
        )}

        <div className="space-y-3">
          {[...fdList].reverse().map(fd => {
            const elapsed  = tenureElapsed(fd.start_date, fd.maturity_date)
            const interest = fd.maturity_value - fd.principal
            return (
              <div key={fd.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{fd.bank}</p>
                      <span className="text-xs text-gray-400">{fd.interest_rate}% {fd.compounding}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-3">
                      <span className="text-gray-500 dark:text-gray-400">Principal: <span className="text-gray-900 dark:text-white font-medium">{fmtINR(fd.principal)}</span></span>
                      <span className="text-gray-500 dark:text-gray-400">Maturity: <span className="text-green-600 dark:text-green-400 font-medium">{fmtINR(fd.maturity_value)}</span></span>
                      <span className="text-gray-500 dark:text-gray-400">Interest: <span className="text-green-600 dark:text-green-400 font-medium">{fmtINR(interest)}</span></span>
                      <span className="text-gray-500 dark:text-gray-400">Matures: <span className="text-gray-900 dark:text-white font-medium">{new Date(fd.maturity_date).toLocaleDateString('en-IN')}</span></span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${elapsed}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{elapsed}% tenure elapsed</p>
                  </div>
                  <button onClick={() => removeFD(fd.id)} className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-500 transition-colors text-lg leading-none">×</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
