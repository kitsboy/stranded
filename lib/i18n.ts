export type Locale = 'en' | 'fr' | 'de' | 'es'

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
]

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    home: 'Home',
    map: 'Map',
    education: 'Education',
    sites: 'All Sites',
    pitch: 'Pitch',
    dashboard: 'Dashboard',
    verticals: 'Verticals',
    bookmarks: 'Saved',
    search: 'Search',
    sitesCount: 'sites',
    tagline: 'Stranded Energy, Bitcoin Access',
    explore: 'Explore the Full Map',
    openMap: 'Open Map',
  },
  fr: {
    home: 'Accueil',
    map: 'Carte',
    education: 'Éducation',
    sites: 'Tous les sites',
    pitch: 'Pitch',
    dashboard: 'Tableau de bord',
    verticals: 'Verticales',
    bookmarks: 'Enregistrés',
    search: 'Rechercher',
    sitesCount: 'sites',
    tagline: 'Énergie bloquée, accès Bitcoin',
    explore: 'Explorer la carte',
    openMap: 'Ouvrir la carte',
  },
  de: {
    home: 'Start',
    map: 'Karte',
    education: 'Bildung',
    sites: 'Alle Standorte',
    pitch: 'Pitch',
    dashboard: 'Dashboard',
    verticals: 'Vertikale',
    bookmarks: 'Gespeichert',
    search: 'Suche',
    sitesCount: 'Standorte',
    tagline: 'Strandierte Energie, Bitcoin-Zugang',
    explore: 'Karte erkunden',
    openMap: 'Karte öffnen',
  },
  es: {
    home: 'Inicio',
    map: 'Mapa',
    education: 'Educación',
    sites: 'Todos los sitios',
    pitch: 'Pitch',
    dashboard: 'Panel',
    verticals: 'Verticales',
    bookmarks: 'Guardados',
    search: 'Buscar',
    sitesCount: 'sitios',
    tagline: 'Energía varada, acceso Bitcoin',
    explore: 'Explorar el mapa',
    openMap: 'Abrir mapa',
  },
}

export function t(locale: Locale, key: string): string {
  return STRINGS[locale]?.[key] ?? STRINGS.en[key] ?? key
}
