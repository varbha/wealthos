import { useState } from 'react'
import { useWealthStore } from '../store/useWealthStore'
import { fmtINR } from '../components/HoldingsTable'
import type { FDEntry } from '../types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function calcMaturity(
  principal: number,
  rate: number,
  compounding: FDEntry['compounding'],
  start: string,
  end: string,
): number {
  const n = compounding === 'monthly' ? 12 : compounding === 'quarterly' ? 4 : 1
  const years = (new Date(end).getTime() - new Date(start).getTime()) / (365.25 * 24 * 3600 * 1000)
  return parseFloat((principal * Math.pow(1 + rate / 100 / n, n * years)).toFixed(2))
}

function tenureElapsed(start: string, end: string): number {
  const now = Date.now()
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (now >= e) return 100
  if (now <= s) return 0
  return Math.round(((now - s) / (e - s)) * 100)
}

const EMPTY_FORM = {
  bank: '',
  principal: '',
  interest_rate: '',
  compounding: 'quarterly' as FDEntry['compounding'],
  start_date: '',
  maturity_date: '',
}

export default function FixedDeposits() {
  const { fdList, addFD, removeFD } = useWealthStore()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)

  const active = fdList.filter((f) => f.is_active)
  const totalPrincipal = active.reduce((s, f) => s + f.principal, 0)
  const totalMaturity = active.reduce((s, f) => s + f.maturity_value, 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const principal = parseFloat(form.principal)
    const rate = parseFloat(form.interest_rate)
    const maturity_value = calcMaturity(principal, rate, form.compounding, form.start_date, form.maturity_date)
    addFD({
      id: generateId(),
      bank: form.bank,
      principal,
      interest_rate: rate,
      compounding: form.compounding,
      start_date: form.start_date,
      maturity_date: form.maturity_date,
      maturity_value,
      is_active: true,
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fixed Deposits</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add FD'}
        </button>
      </div>

      {active.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5" style={{ borderTopColor: '#EF9F27', borderTopWidth: 3 }}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Principal</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtINR(totalPrincipal)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5" style={{ borderTopColor: '#EF9F27', borderTopWidth: 3 }}>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total at Maturity</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmtINR(totalMaturity)}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4"
        >
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">New Fixed Deposit</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bank" required>
              <input
                className={input}
                placeholder="SBI, HDFC…"
                value={form.bank}
                onChange={(e) => setForm({ ...form, bank: e.target.value })}
                required
              />
            </Field>
            <Field label="Principal (₹)" required>
              <input
                className={input}
                type="number"
                placeholder="100000"
                value={form.principal}
                onChange={(e) => setForm({ ...form, principal: e.target.value })}
                required
              />
            </Field>
            <Field label="Interest Rate (%)" required>
              <input
                className={input}
                type="number"
                step="0.01"
                placeholder="7.5"
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                required
              />
            </Field>
            <Field label="Compounding" required>
              <select
                className={input}
                value={form.compounding}
                onChange={(e) => setForm({ ...form, compounding: e.target.value as FDEntry['compounding'] })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </Field>
            <Field label="Start Date" required>
              <input
                className={input}
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </Field>
            <Field label="Maturity Date" required>
              <input
                className={input}
                type="date"
                value={form.maturity_date}
                onChange={(e) => setForm({ ...form, maturity_date: e.target.value })}
                required
              />
            </Field>
          </div>
          <button
            type="submit"
            className="w-full py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Save FD
          </button>
        </form>
      )}

      {fdList.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center h-48 text-center text-sm text-gray-400 dark:text-gray-500">
          No fixed deposits added yet. Click "+ Add FD" to get started.
        </div>
      )}

      {fdList.length > 0 && (
        <div className="space-y-3">
          {[...fdList].reverse().map((fd) => {
            const elapsed = tenureElapsed(fd.start_date, fd.maturity_date)
            const interest = fd.maturity_value - fd.principal
            return (
              <div
                key={fd.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
              >
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
                      <div
                        className="h-1.5 rounded-full bg-amber-400"
                        style={{ width: `${elapsed}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{elapsed}% tenure elapsed</p>
                  </div>
                  <button
                    onClick={() => removeFD(fd.id)}
                    className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-500 transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const input =
  'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
