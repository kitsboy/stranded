'use client'

import { useState, useEffect, useCallback } from 'react'
import { Locale, LOCALES, t as translate } from '@/lib/i18n'

export function readSavedLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem('stranded-locale')
    if (saved && LOCALES.some(l => l.code === saved)) return saved as Locale
  } catch { /* ignore */ }
  return 'en'
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    setLocale(readSavedLocale())
    const handler = (e: Event) => setLocale((e as CustomEvent).detail as Locale)
    window.addEventListener('stranded-locale-change', handler)
    return () => window.removeEventListener('stranded-locale-change', handler)
  }, [])

  const t = useCallback((key: string) => translate(locale, key), [locale])

  return { locale, t }
}