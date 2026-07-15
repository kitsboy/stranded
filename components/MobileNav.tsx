'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'

const LINK_KEYS = [
  { href: '/', key: 'home' },
  { href: '/dashboard', key: 'dashboard' },
  { href: '/map', key: 'map' },
  { href: '/pitch', key: 'pitch' },
  { href: '/education', key: 'education' },
  { href: '/sites', key: 'sites' },
  { href: '/verticals', key: 'verticals' },
  { href: '/funding', key: 'funding' },
  { href: '/partnerships', key: 'partnerships' },
  { href: '/bookmarks', key: 'bookmarks' },
  { href: '/methodology', key: 'methodology' },
  { href: '/global', key: 'global' },
  { href: '/benchmarks', key: 'benchmarks' },
] as const

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useLocale()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg border border-white/15"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <>
          <button
            type="button"
            className="mobile-nav-backdrop fixed inset-0 top-14 bg-black/50 z-40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="mobile-nav-drawer absolute top-14 left-0 right-0 bg-[#1e293b]/98 backdrop-blur-xl border-b border-[#5BC0BE]/25 z-50 p-4 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="grid grid-cols-2 gap-2">
              {LINK_KEYS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    pathname === l.href
                      ? 'bg-[#FF8C00]/20 text-[#FF8C00] border border-[#FF8C00]/30'
                      : 'bg-white/5 border border-transparent hover:border-white/10 hover:bg-white/8'
                  }`}
                >
                  {t(l.key)}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}