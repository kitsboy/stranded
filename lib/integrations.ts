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
} as const

export function integrationUrl(key: keyof typeof INTEGRATIONS, context?: string) {
  const base = INTEGRATIONS[key].url
  return context ? `${base}?ref=stranded&ctx=${encodeURIComponent(context)}` : `${base}?ref=stranded`
}