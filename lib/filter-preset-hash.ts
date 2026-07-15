import type { FilterPreset } from '@/lib/bookmarks'

/** Encode a filter preset for URL hash sharing: /map#preset=<base64url> */
export function encodePresetHash(preset: FilterPreset): string {
  const json = JSON.stringify({
    n: preset.name,
    s: preset.minScore,
    e: preset.minEmission,
    x: preset.maxEmission,
    p: preset.provinces,
    t: preset.sources,
  })
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePresetHash(hash: string): FilterPreset | null {
  try {
    const padded = hash.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4))
    const raw = JSON.parse(atob(pad)) as {
      n?: string
      s?: number
      e?: number
      x?: number
      p?: string[]
      t?: string[]
    }
    if (typeof raw.s !== 'number' || typeof raw.e !== 'number') return null
    return {
      name: raw.n || 'Shared preset',
      minScore: raw.s,
      minEmission: raw.e,
      maxEmission: typeof raw.x === 'number' ? raw.x : undefined,
      provinces: Array.isArray(raw.p) ? raw.p : [],
      sources: Array.isArray(raw.t) ? raw.t : undefined,
    }
  } catch {
    return null
  }
}

export function presetShareUrl(preset: FilterPreset, origin = 'https://stranded.giveabit.io'): string {
  return `${origin}/map#preset=${encodePresetHash(preset)}`
}