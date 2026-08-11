import { safeGetItem, safeSetItem } from './safe-storage'

export type DensityMode = 'comfortable' | 'compact'
export const DENSITY_KEY = 'stranded-density-mode'

export function getDensity(): DensityMode {
  const v = safeGetItem(DENSITY_KEY)
  return v === 'compact' ? 'compact' : 'comfortable'
}

export function setDensity(mode: DensityMode) {
  safeSetItem(DENSITY_KEY, mode)
  applyDensityToDocument(mode)
}

export function applyDensityToDocument(mode?: DensityMode) {
  if (typeof document === 'undefined') return
  const m = mode ?? getDensity()
  document.documentElement.dataset.density = m
  document.documentElement.classList.toggle('density-compact', m === 'compact')
}
