'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { safeGetItem, safeSetItem } from '@/lib/safe-storage'

const KEY = 'stranded-checklist-v1'

type Item = { id: string; label: string; href?: string }

const ITEMS: Item[] = [
  { id: 'map', label: 'Open the live map', href: '/map' },
  { id: 'mission', label: 'Add a site to mission', href: '/map' },
  { id: 'palette', label: 'Try ⌘K command palette' },
  { id: 'bank', label: 'Export a bank pack from a site', href: '/map' },
  { id: 'pitch', label: 'Skim the live pitch', href: '/pitch' },
]

export default function OnboardingChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const raw = safeGetItem(KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.dismissed) setDismissed(true)
      if (parsed.done) setDone(parsed.done)
    } catch {
      /* ignore */
    }
  }, [])

  const persist = (nextDone: Record<string, boolean>, nextDismissed = dismissed) => {
    safeSetItem(KEY, JSON.stringify({ done: nextDone, dismissed: nextDismissed }))
  }

  if (dismissed) return null

  const completed = ITEMS.filter(i => done[i.id]).length

  return (
    <div
      className="rounded-2xl border border-[#FF8C00]/30 bg-[#FF8C00]/5 p-5 max-w-xl mx-auto"
      data-testid="onboarding-checklist"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-[#FF8C00]">Get started</h3>
          <p className="text-[11px] text-gray-400">
            {completed}/{ITEMS.length} complete
          </p>
        </div>
        <button
          type="button"
          className="text-[11px] text-gray-500 hover:text-white"
          onClick={() => {
            setDismissed(true)
            persist(done, true)
          }}
        >
          Dismiss
        </button>
      </div>
      <ul className="space-y-2">
        {ITEMS.map(item => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!done[item.id]}
              onChange={() => {
                const next = { ...done, [item.id]: !done[item.id] }
                setDone(next)
                persist(next)
              }}
              className="accent-[#FF8C00]"
              aria-label={item.label}
            />
            {item.href ? (
              <Link href={item.href} className="text-gray-200 hover:text-[#5BC0BE]">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-200">{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
