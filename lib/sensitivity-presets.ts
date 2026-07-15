export type SensitivityPresetId = 'base' | 'bear' | 'bull'

export type SensitivityPreset = {
  id: SensitivityPresetId
  label: string
  description: string
  btcMultiplier: number
  carbonUsdPerTonne: number
  gasTreatmentDerate: number
  difficultyMultiplier: number
  revenueBandMultiplier: number
}

export const SENSITIVITY_PRESETS: Record<SensitivityPresetId, SensitivityPreset> = {
  base: {
    id: 'base',
    label: 'Base',
    description: 'Live BTC, mid carbon credits, nominal derate',
    btcMultiplier: 1.0,
    carbonUsdPerTonne: 45,
    gasTreatmentDerate: 1.0,
    difficultyMultiplier: 1.0,
    revenueBandMultiplier: 1.0,
  },
  bear: {
    id: 'bear',
    label: 'Bear',
    description: '−30% BTC, low carbon, H₂S derate stress',
    btcMultiplier: 0.7,
    carbonUsdPerTonne: 20,
    gasTreatmentDerate: 0.8,
    difficultyMultiplier: 0.85,
    revenueBandMultiplier: 0.6,
  },
  bull: {
    id: 'bull',
    label: 'Bull',
    description: '+30% BTC, high carbon, full derate',
    btcMultiplier: 1.3,
    carbonUsdPerTonne: 80,
    gasTreatmentDerate: 1.0,
    difficultyMultiplier: 1.15,
    revenueBandMultiplier: 1.8,
  },
}

export function getSensitivityPreset(id: SensitivityPresetId): SensitivityPreset {
  return SENSITIVITY_PRESETS[id]
}

/** BTC sensitivity slider % from preset (for pitch page) */
export function presetToBtcSensitivityPct(preset: SensitivityPreset): number {
  return Math.round(preset.btcMultiplier * 100)
}

/** Annual revenue band from base model USD */
export function applyPresetRevenueBand(baseAnnualUsd: number, preset: SensitivityPreset): number {
  return Math.round(baseAnnualUsd * preset.revenueBandMultiplier)
}