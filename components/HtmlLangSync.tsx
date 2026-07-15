'use client'

import { useEffect } from 'react'
import { readSavedLocale } from '@/lib/useLocale'

/** Sync document.documentElement.lang with stranded locale (upgrade 277). */
export default function HtmlLangSync() {
  useEffect(() => {
    const sync = () => {
      document.documentElement.lang = readSavedLocale()
    }
    sync()
    const handler = () => sync()
    window.addEventListener('stranded-locale-change', handler)
    return () => window.removeEventListener('stranded-locale-change', handler)
  }, [])
  return null
}