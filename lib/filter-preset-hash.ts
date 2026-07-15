import type { FilterPreset } from '@/lib/bookmarks'

/** Encode a filter preset for URL hash sharing: /map#preset=<base64url> */
export function encodePresetHash(preset: FilterPreset): string {
  const json = JSON.stringify({
    n: preset.name,
    s: preset.minScore,
    e: preset.minEmission,
    p: preset.provinces,
  })
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePresetHash(hash: string): FilterPreset | null {
  try {
    const padded = hash.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4))
    const raw = JSON.parse(atob(pad)) as { n?: string; s?: number; e?: number; p?: string[] }
    if (typeof raw.s !== 'number' || typeof raw.e !== 'number') return null
    return {
      name: raw.n || 'Shared preset',
      minScore: raw.s,
      minEmission: raw.e,
      provinces: Array.isArray(raw.p) ? raw.p : [],
    }
  } catch {
    return null
  }
}

export function presetShareUrl(preset: FilterPreset, origin = 'https://stranded.giveabit.io'): string {
  return `${origin}/map#preset=${encodePresetHash(preset)}`
}