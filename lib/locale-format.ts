/** Locale-aware number / currency formatting for Stranded UI locales. */

export type StrandedLocale = 'en' | 'fr' | 'de' | 'es'

const LOCALE_MAP: Record<StrandedLocale, string> = {
  en: 'en-CA',
  fr: 'fr-CA',
  de: 'de-DE',
  es: 'es-ES',
}

/** Map Stranded short locale → BCP 47 tag. */
export function localeFromStranded(locale: StrandedLocale | string): string {
  const key = (locale || 'en').toLowerCase() as StrandedLocale
  return LOCALE_MAP[key] ?? 'en-CA'
}

export function formatCurrency(
  n: number,
  locale: string = 'en',
  currency: 'CAD' | 'USD' = 'CAD',
): string {
  const value = Number.isFinite(n) ? n : 0
  const tag = locale.length <= 2 ? localeFromStranded(locale) : locale
  try {
    return new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${Math.round(value)}`
  }
}

export function formatNumber(
  n: number,
  locale: string = 'en',
  opts?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(n)) return '—'
  const tag = locale.length <= 2 ? localeFromStranded(locale) : locale
  try {
    return new Intl.NumberFormat(tag, opts).format(n)
  } catch {
    return String(n)
  }
}

/** Format a 0–1 or 0–100 style percent. Values with |n| > 1 treated as already-percent. */
export function formatPercent(n: number, locale: string = 'en'): string {
  if (!Number.isFinite(n)) return '—'
  const ratio = n > 1 || n < -1 ? n / 100 : n
  const tag = locale.length <= 2 ? localeFromStranded(locale) : locale
  try {
    return new Intl.NumberFormat(tag, {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(ratio)
  } catch {
    return `${(ratio * 100).toFixed(1)}%`
  }
}
