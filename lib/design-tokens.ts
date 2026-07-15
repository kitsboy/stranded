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
    /** WCAG-friendly on dark surfaces */
    textPrimary: '#f1f5f9',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#fb7185',
    scoreElite: '#c084fc',
    scoreHigh: '#4ade80',
    scoreMed: '#facc15',
    scoreLow: '#fb923c',
  },
  radius: { sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '1rem', '3xl': '1.5rem' },
  font: {
    sans: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
  spacing: { nav: '3.5rem', footer: '3rem' },
} as const