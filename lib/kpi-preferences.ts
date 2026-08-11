import { safeGetItem, safeSetItem } from './safe-storage'

export type KpiId =
  | 'sites'
  | 'provinces'
  | 'avgScore'
  | 'revenue'
  | 'co2e'
  | 'readiness'
  | 'highScore'
  | 'megaLarge'

export const DEFAULT_KPI_IDS: KpiId[] = ['sites', 'provinces', 'avgScore', 'revenue', 'co2e', 'readiness']

const KEY = 'stranded-kpi-prefs-v1'

export const KPI_META: { id: KpiId; label: string }[] = [
  { id: 'sites', label: 'Sites' },
  { id: 'provinces', label: 'Provinces' },
  { id: 'avgScore', label: 'Avg score' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'co2e', label: 'CO₂e' },
  { id: 'readiness', label: 'Readiness' },
  { id: 'highScore', label: 'High-score sites' },
  { id: 'megaLarge', label: 'Mega + large' },
]

export function listAvailableKpis() {
  return KPI_META
}

export function getSelectedKpis(): KpiId[] {
  try {
    const raw = safeGetItem(KEY)
    if (!raw) return [...DEFAULT_KPI_IDS]
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...DEFAULT_KPI_IDS]
    const valid = parsed.filter((id: string) => KPI_META.some(k => k.id === id)) as KpiId[]
    return valid.length ? valid : [...DEFAULT_KPI_IDS]
  } catch {
    return [...DEFAULT_KPI_IDS]
  }
}

export function setSelectedKpis(ids: KpiId[]) {
  const unique = Array.from(new Set(ids)).filter(id => KPI_META.some(k => k.id === id)) as KpiId[]
  safeSetItem(KEY, JSON.stringify(unique.length ? unique : DEFAULT_KPI_IDS))
}
