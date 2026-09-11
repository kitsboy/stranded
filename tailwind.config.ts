import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'midnight': '#1e293b',
        'orange': '#FF8C00',
        'teal': '#5BC0BE',
      },
      // ── Type floor (mobile legibility) ──────────────────────────────────
      // Hard rule, enforced by tests/e2e/legibility.spec.ts: no text a user is
      // meant to READ renders below 12px. Map/chart chrome whose box is fixed
      // by an absolutely-positioned layout may use text-micro (11px), which is
      // the absolute minimum — and only for labels that are decoration, never
      // for the only copy of a number or a name.
      fontSize: {
        micro: ['11px', { lineHeight: '1.4' }],
        label: ['12px', { lineHeight: '1.45' }],
      },
    },
  },
  plugins: [],
};

export default config;