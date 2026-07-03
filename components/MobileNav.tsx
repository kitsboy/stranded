'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/map', label: 'Map' },
  { href: '/pitch', label: 'Pitch' },
  { href: '/education', label: 'Education' },
  { href: '/sites', label: 'Sites' },
  { href: '/verticals', label: 'Verticals' },
  { href: '/funding', label: 'Funding' },
  { href: '/partnerships', label: 'Partnerships' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-lg border border-white/15" aria-label="Open menu" aria-expanded={open}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-[#1e293b] border-b border-white/10 z-50 p-4 grid grid-cols-2 gap-2">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`px-3 py-2 rounded-lg text-sm ${pathname === l.href ? 'bg-[#FF8C00]/20 text-[#FF8C00]' : 'bg-white/5'}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}