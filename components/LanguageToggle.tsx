'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { Locale, LOCALES, t } from '@/lib/i18n'

export default function LanguageToggle() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('stranded-locale') as Locale
    if (saved && LOCALES.some(l => l.code === saved)) setLocale(saved)
  }, [])

  const change = (code: Locale) => {
    setLocale(code)
    localStorage.setItem('stranded-locale', code)
    document.documentElement.lang = code
    window.dispatchEvent(new CustomEvent('stranded-locale-change', { detail: code }))
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/15 text-xs text-gray-400 hover:text-white" aria-label="Change language">
        <Globe size={13} />
        {locale.toUpperCase()}
      </button>
      <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block group-focus-within:block bg-[#1e293b] border border-white/15 rounded-lg py-1 min-w-[100px] z-50">
        {LOCALES.map(l => (
          <button key={l.code} onClick={() => change(l.code)} className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 ${locale === l.code ? 'text-[#FF8C00]' : 'text-gray-300'}`}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function useLocaleString(key: string): string {
  const [locale, setLocale] = useState<Locale>('en')
  useEffect(() => {
    const saved = (localStorage.getItem('stranded-locale') || 'en') as Locale
    setLocale(saved)
    const handler = (e: Event) => setLocale((e as CustomEvent).detail)
    window.addEventListener('stranded-locale-change', handler)
    return () => window.removeEventListener('stranded-locale-change', handler)
  }, [])
  return t(locale, key)
}