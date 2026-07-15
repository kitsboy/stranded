'use client'

import { useState } from 'react'
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

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg border border-white/15" aria-label="Open menu" aria-expanded={open}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-[#1e293b] border-b border-white/10 z-50 p-4 grid grid-cols-2 gap-2">
          {LINK_KEYS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`px-3 py-2 rounded-lg text-sm ${pathname === l.href ? 'bg-[#FF8C00]/20 text-[#FF8C00]' : 'bg-white/5'}`}>
              {t(l.key)}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}