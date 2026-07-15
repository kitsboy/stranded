'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { Locale, LOCALES } from '@/lib/i18n'
import { useLocale } from '@/lib/useLocale'

export default function LanguageToggle() {
  const { locale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const change = (code: Locale) => {
    localStorage.setItem('stranded-locale', code)
    document.documentElement.lang = code
    window.dispatchEvent(new CustomEvent('stranded-locale-change', { detail: code }))
    setOpen(false)
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/15 text-xs text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5BC0BE]/50"
        aria-label={t('changeLanguage')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe size={13} />
        <span className="font-mono uppercase">{locale}</span>
        <ChevronDown size={12} className={`opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('changeLanguage')}
          className="absolute right-0 top-full mt-1 z-[80] min-w-[200px] rounded-lg border border-white/15 bg-[#1e293b] py-1 shadow-xl"
        >
          <p className="px-3 py-1.5 text-[10px] text-gray-500 border-b border-white/10">
            {t('langMenuNote')}
          </p>
          {LOCALES.map(l => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={locale === l.code}
              onClick={() => change(l.code)}
              className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 ${
                locale === l.code ? 'text-[#FF8C00] font-semibold' : 'text-gray-300'
              }`}
            >
              <span className="font-mono uppercase mr-2 opacity-70">{l.code}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}