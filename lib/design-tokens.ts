/**
 * Design tokens — keep in sync with CSS variables in app/globals.css (:root).
 * Prefer CSS vars in components; this module is for JS/chart/export use.
 */
export const tokens = {
  color: {
    brand: '#FF8C00',
    accent: '#5BC0BE',
    /** App canvas — matches --bg-dark */
    bg: '#243447',
    surface: '#1e293b',
    surfaceDeep: '#0f172a',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#f43f5e',
    scoreElite: '#a855f7',
    scoreHigh: '#22c55e',
    scoreMed: '#eab308',
    scoreLow: '#f97316',
  },
  radius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '1rem', '3xl': '1.5rem' },
  font: {
    sans: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
  spacing: { nav: '3.5rem', footer: '3rem' },
} as const