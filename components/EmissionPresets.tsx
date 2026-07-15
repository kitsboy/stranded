'use client'

import { EMISSION_PRESETS, matchEmissionPreset, type EmissionPresetId } from '@/lib/map-filters'
import { useLocale } from '@/lib/useLocale'

type EmissionPresetsProps = {
  minEmission: number
  maxEmission: number
  onSelect: (min: number, max: number) => void
}

const LABEL_KEYS: Record<EmissionPresetId, 'mapEmissionLow' | 'mapEmissionMed' | 'mapEmissionHigh' | 'mapEmissionAll'> = {
  low: 'mapEmissionLow',
  med: 'mapEmissionMed',
  high: 'mapEmissionHigh',
  all: 'mapEmissionAll',
}

export default function EmissionPresets({ minEmission, maxEmission, onSelect }: EmissionPresetsProps) {
  const { t } = useLocale()
  const active = matchEmissionPreset(minEmission, maxEmission)

  return (
    <div className="flex flex-wrap gap-1 mt-2" data-testid="emission-presets">
      {EMISSION_PRESETS.map(preset => (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelect(preset.min, preset.max)}
          className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
            active === preset.id
              ? 'border-[#FF8C00] text-[#FF8C00] bg-[#FF8C00]/10'
              : 'border-white/15 text-gray-400 hover:border-white/30 hover:text-gray-200'
          }`}
        >
          {t(LABEL_KEYS[preset.id])}
        </button>
      ))}
    </div>
  )
}