/** Cross-Give-A-Bit integration hooks (Tadbuy ads, Sherpacarta legal templates). */

export const INTEGRATIONS = {
  tadbuy: {
    name: 'Tadbuy',
    tagline: 'ASIC marketplace & miner ads',
    url: 'https://tadbuy.giveabit.io',
    cta: 'Browse certified miners',
    mapPlacement: 'site-panel-asic-row',
  },
  sherpacarta: {
    name: 'Sherpacarta',
    tagline: 'Land-use & methane capture legal templates',
    url: 'https://sherpacarta.giveabit.io',
    cta: 'Download partnership MOU',
    mapPlacement: 'mission-export-legal',
  },
  giveabit: {
    name: 'Give A Bit',
    tagline: 'Safe Harbour sovereign giving framework',
    url: 'https://giveabit.io',
    cta: 'Learn Safe Harbour',
  },
  /** Bitcoin timestamp proofs via OpenTimestamps (thin client: lib/satohash.ts). */
  satohash: {
    name: 'Satohash',
    tagline: 'Bitcoin timestamp proofs for site snapshots & exports',
    url: 'https://satohash.io',
    apiUrl: 'https://api.satohash.io',
    cta: 'Stamp a proof',
    mapPlacement: 'export-timestamp',
  },
} as const

export function integrationUrl(key: keyof typeof INTEGRATIONS, context?: string) {
  const base = INTEGRATIONS[key].url
  return context ? `${base}?ref=stranded&ctx=${encodeURIComponent(context)}` : `${base}?ref=stranded`
}

/** Re-export thin Satohash client (stampHash, getApiHealth). No secrets. */
export {
  stampHash,
  getApiHealth,
  satohashVerifyUrl,
  satohashStampGuideUrl,
  SATOHASH_API,
  SATOHASH_SITE,
  SATOHASH_CLIENT_ID,
} from './satohash'
export type { StampResult, ApiHealth } from './satohash'