'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Search, Command } from 'lucide-react'

export default function Nav() {
  const pathname = usePathname()

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

  // Global Cmd/Ctrl + K from anywhere in the nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openPalette()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
          active
            ? 'bg-white/10 text-white font-medium'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#1e293b]/95 backdrop-blur border-b border-[#5BC0BE]/30">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <img src="/logo.png" alt="Stranded" className="h-7 w-auto" />
          <div className="leading-none">
            <span className="font-bold text-xl tracking-tight text-[#FF8C00]">Stranded</span>
            <div className="text-[9px] text-[#FF8C00]/70 -mt-0.5 tracking-[1px]">Value</div>
          </div>
        </Link>

        <div className="flex items-center gap-1 flex-1 justify-center">
          {navLink('/', 'Home')}
          {navLink('/map', 'Map')}
          {navLink('/education', 'Education')}
          {navLink('/sites', 'All Sites')}
          {navLink('/pitch', 'Pitch')}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={openPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 text-gray-400 hover:text-white transition"
            aria-label="Open command palette to search sites (⌘K)"
            title="Search sites (⌘K)"
          >
            <Search size={15} />
            <span className="font-mono">Search</span>
            <span className="ml-1 text-[10px] opacity-60 flex items-center gap-px"><Command size={11} />K</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-gray-400">
            <span className="font-mono">2,611</span> sites
          </div>
        </div>
      </div>
    </nav>
  )
}

