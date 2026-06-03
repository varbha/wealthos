import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { parseMFCAS } from './parseMFCAS'
import { parseEquity } from './parseEquity'
import { parseFO } from './parseFO'

const MF_FILE = '/Users/varunb/Downloads/cas_detailed_report_2026_06_03_110846.xlsx'
const FO_FILE = '/Users/varunb/Downloads/pnl-JTK063.xlsx'
const EQ_FILE = '/Users/varunb/Downloads/holdings (2).csv'

describe('MF CAS parser', () => {
  const buf = readFileSync(MF_FILE)
  const holdings = parseMFCAS(buf.buffer)

  it('active scheme count = 10', () => {
    expect(holdings.filter((h) => h.is_active).length).toBe(10)
  })

  it('total invested ≈ 2001733.25', () => {
    const total = holdings.reduce((s, h) => s + h.invested, 0)
    expect(total).toBeCloseTo(2001733.25, 1)
  })

  it('total current ≈ 2916224.95', () => {
    const total = holdings.reduce((s, h) => s + h.current_value, 0)
    expect(total).toBeCloseTo(2916224.95, 1)
  })

  it('total gain ≈ 914491.70', () => {
    const total = holdings.reduce((s, h) => s + h.returns, 0)
    expect(total).toBeCloseTo(914491.70, 1)
  })
})

describe('Equity parser', () => {
  const text = readFileSync(EQ_FILE, 'utf-8')
  const holdings = parseEquity(text)

  it('holding count = 12', () => {
    expect(holdings.length).toBe(12)
  })

  it('total invested ≈ 816255.65', () => {
    const total = holdings.reduce((s, h) => s + h.invested, 0)
    expect(total).toBeCloseTo(816255.65, 1)
  })

  it('total current ≈ 875522.39', () => {
    const total = holdings.reduce((s, h) => s + h.current_value, 0)
    expect(total).toBeCloseTo(875522.39, 1)
  })

  it('total pnl ≈ 59266.74', () => {
    const total = holdings.reduce((s, h) => s + h.pnl, 0)
    expect(total).toBeCloseTo(59266.74, 1)
  })
})

describe('F&O parser', () => {
  const buf = readFileSync(FO_FILE)
  const { contracts, summary } = parseFO(buf.buffer)

  it('contract count = 99', () => {
    expect(contracts.length).toBe(99)
  })

  it('realized_pnl ≈ 30738.25', () => {
    expect(summary.realized_pnl).toBeCloseTo(30738.25, 1)
  })

  it('charges ≈ 4651.74', () => {
    expect(summary.charges).toBeCloseTo(4651.74, 1)
  })

  it('winners = 52', () => {
    expect(contracts.filter((c) => c.realized_pnl > 0).length).toBe(52)
  })

  it('losers = 47', () => {
    expect(contracts.filter((c) => c.realized_pnl < 0).length).toBe(47)
  })
})
