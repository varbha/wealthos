import type { PhysicalAsset } from '../types'

/** IRDAI IDV depreciation schedule */
function irdaiDepreciationPct(purchaseDate: string): number {
  const months =
    (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  if (months < 6)   return 0.05
  if (months < 12)  return 0.15
  if (months < 24)  return 0.20
  if (months < 36)  return 0.30
  if (months < 48)  return 0.40
  if (months < 60)  return 0.50
  return 0.60
}

function straightLineDepreciationPct(purchaseDate: string, usefulYears: number): number {
  const years = (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.min(years / usefulYears, 1)
}

export function currentAssetValue(asset: PhysicalAsset): number {
  if (asset.depreciation_type === 'irdai_vehicle') {
    return asset.purchase_value * (1 - irdaiDepreciationPct(asset.purchase_date))
  }
  if (asset.depreciation_type === 'straight_line') {
    const years = asset.straight_line_years ?? 10
    return asset.purchase_value * (1 - straightLineDepreciationPct(asset.purchase_date, years))
  }
  return asset.purchase_value
}

export function depreciationPct(asset: PhysicalAsset): number {
  if (asset.depreciation_type === 'irdai_vehicle')
    return irdaiDepreciationPct(asset.purchase_date) * 100
  if (asset.depreciation_type === 'straight_line') {
    const years = asset.straight_line_years ?? 10
    return straightLineDepreciationPct(asset.purchase_date, years) * 100
  }
  return 0
}

export function ageLabel(purchaseDate: string): string {
  const days = (Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24)
  if (days < 30)  return `${Math.round(days)} days`
  if (days < 365) return `${Math.round(days / 30.44)} months`
  const yrs = days / 365.25
  return `${yrs.toFixed(1)} years`
}
