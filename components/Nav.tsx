'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, Command } from 'lucide-react'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'
import MobileNav from './MobileNav'
import { useLocale } from '@/lib/useLocale'

export default function Nav() {
  const pathname = usePathname()
  const { t } = useLocale()
  const [scrolled, setScrolled] = useState(false)

  const openPalette = () => {
    window.dispatchEvent(new CustomEvent('open-command-palette'))
  }

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLink = (href: string, label: string) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
          active
            ? 'bg-white/10 text-white font-medium'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav
      className={`nav-root sticky top-0 z-50 bg-[#1e293b]/95 backdrop-blur border-b border-[#5BC0BE]/30 ${scrolled ? 'nav-scrolled' : ''}`}
      role="navigation"
      aria-label="Main"
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="Stranded Value home">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="nav-logo-img h-7 w-auto transition-all duration-250"
            priority
          />
          <div className="leading-none">
            <span className="nav-logo-text font-bold text-xl tracking-tight text-[#FF8C00] transition-all duration-250">Stranded</span>
            <div className="nav-logo-sub text-[9px] text-[#FF8C00]/70 -mt-0.5 tracking-[1px] transition-all duration-250">Value</div>
          </div>
        </Link>

        <div className="flex items-center gap-0.5 flex-1 justify-center overflow-x-auto">
          {navLink('/', t('home'))}
          {navLink('/map', t('map'))}
          {navLink('/education', t('education'))}
          {navLink('/sites', t('sites'))}
          {navLink('/pitch', t('pitch'))}
          {navLink('/dashboard', t('dashboard'))}
          <span className="hidden lg:inline">{navLink('/verticals', t('verticals'))}</span>
          <span className="hidden xl:inline">{navLink('/bookmarks', t('bookmarks'))}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <MobileNav />
          <ThemeToggle />
          <LanguageToggle />
          <button
            onClick={openPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 text-gray-400 hover:text-white transition"
            aria-label="Open command palette to search sites (⌘K)"
            title="Search sites (⌘K)"
          >
            <Search size={15} />
            <span className="font-mono">{t('search')}</span>
            <span className="ml-1 text-[10px] opacity-60 flex items-center gap-px"><Command size={11} />K</span>
          </button>
          <div className="hidden md:flex items-center gap-2 text-gray-400">
            <span className="font-mono">2,611</span> {t('sitesCount')}
          </div>
        </div>
      </div>
    </nav>
  )
}