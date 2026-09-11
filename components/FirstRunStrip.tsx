'use client'

import { useState } from 'react'
import { MapPin, SlidersHorizontal, Send, X } from 'lucide-react'

const DISMISS_KEY = 'stranded-map-firstrun-dismissed'

type Props = {
  /** Optional handler — pressing ⌘K / Ctrl+K is wired by the page. */
  onOpenSearch?: () => void
  commandHint?: string
}

/**
 * First-run guidance: three steps, one honest sentence each, dismissible.
 * The dismissal is remembered in localStorage inside try/catch — a bad or
 * blocked storage key can never white-screen the map (same rule as the saved
 * fleet templates in lib/fleet-template.ts).
 */
export default function FirstRunStrip({ onOpenSearch, commandHint = '⌘K' }: Props) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return !window.localStorage.getItem(DISMISS_KEY)
    } catch {
      return false
    }
  })

  if (!open) return null

  const dismiss = () => {
    setOpen(false)
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
      window.localStorage.setItem('stranded-map-search-hint-dismissed', '1')
    } catch { /* storage blocked — the strip simply comes back next visit */ }
  }

  const steps = [
    { icon: <MapPin size={13} aria-hidden />, title: 'Pick a site', body: 'Click any pin on the map.' },
    { icon: <SlidersHorizontal size={13} aria-hidden />, title: 'See the build', body: 'Drag the miner stack and watch sats/day.' },
    { icon: <Send size={13} aria-hidden />, title: 'Send it', body: 'Hand the build to the team in one click.' },
  ]

  return (
    <div
      className="absolute top-24 left-1/2 -translate-x-1/2 z-[72] w-[min(42rem,94vw)] rounded-2xl border border-[#5BC0BE]/40 bg-[#1e293b] shadow-xl px-3 py-2.5"
      data-testid="map-first-run-strip"
      role="region"
      aria-label="Getting started"
    >
      <div className="flex items-start gap-3">
        <ol className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-4 text-[11px] text-gray-300">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-2 min-w-0">
              <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-[#5BC0BE]/20 border border-[#5BC0BE]/40 text-[#5BC0BE] flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="text-white font-semibold inline-flex items-center gap-1">{s.icon}{s.title}</span>
                <span className="block text-gray-400 leading-snug">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 h-8 w-8 rounded-lg border border-white/15 text-gray-400 hover:text-white"
          aria-label="Dismiss getting-started steps"
          data-testid="first-run-dismiss"
        >
          <X className="mx-auto" size={14} aria-hidden />
        </button>
      </div>
      <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-400">
        Tip: press{' '}
        <button
          type="button"
          onClick={onOpenSearch}
          className="px-1.5 py-px bg-white/10 rounded font-mono text-gray-200 hover:bg-white/20"
        >
          {commandHint}
        </button>{' '}
        to fuzzy-search 2,611 sites by name, province or company. Numbers are measured ECCC data — verify any of them yourself on the Open data page.
      </div>
    </div>
  )
}
