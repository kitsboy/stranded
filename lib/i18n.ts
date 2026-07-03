export type Locale = 'en' | 'fr' | 'de' | 'es'

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
]

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    home: 'Home', map: 'Map', education: 'Education', sites: 'All Sites', pitch: 'Pitch',
    tagline: 'Stranded Energy, Bitcoin Access',
    explore: 'Explore the Full Map',
  },
  fr: {
    home: 'Accueil', map: 'Carte', education: 'Éducation', sites: 'Tous les sites', pitch: 'Pitch',
    tagline: 'Énergie bloquée, accès Bitcoin',
    explore: 'Explorer la carte',
  },
  de: {
    home: 'Start', map: 'Karte', education: 'Bildung', sites: 'Alle Standorte', pitch: 'Pitch',
    tagline: 'Strandierte Energie, Bitcoin-Zugang',
    explore: 'Karte erkunden',
  },
  es: {
    home: 'Inicio', map: 'Mapa', education: 'Educación', sites: 'Todos los sitios', pitch: 'Pitch',
    tagline: 'Energía varada, acceso Bitcoin',
    explore: 'Explorar el mapa',
  },
}

export function t(locale: Locale, key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? key
}