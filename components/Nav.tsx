'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'
import DensityToggle from './DensityToggle'
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

  const navLink = (href: string, label: string, opts?: { liveDot?: boolean }) => {
    const active = pathname === href
    const showLiveDot = opts?.liveDot && active
    return (
      <Link
        href={href}
        className={`px-3 py-1.5 text-sm rounded-lg transition-colors inline-flex items-center gap-1.5 ${
          active
            ? 'bg-white/10 text-white font-medium'
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
        aria-current={active ? 'page' : undefined}
      >
        {label}
        {showLiveDot && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse shrink-0"
            aria-hidden
            data-testid="nav-dashboard-live-dot"
          />
        )}
      </Link>
    )
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t('skipToMain')}
      </a>
      <nav
        className={`nav-root sticky top-0 z-50 bg-[#1e293b]/95 backdrop-blur border-b border-[#5BC0BE]/30 ${scrolled ? 'nav-scrolled' : ''}`}
        role="navigation"
        aria-label="Main"
      >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-2 md:gap-4">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <Image
            src="/logo.png"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="nav-logo-img h-7 w-auto transition-all duration-250"
            priority
          />
          <div className="leading-none">
            <span className="nav-logo-text font-bold text-xl tracking-tight text-[#FF8C00] transition-all duration-250">Stranded</span>
            <div className="nav-logo-sub text-label text-[#FF8C00] -mt-0.5 tracking-[1px] transition-all duration-250">Value</div>
          </div>
        </Link>

        {/* Desktop (≥md) link strip. Below md the header is brand + theme +
            language + menu only and the same links live in the MobileNav
            drawer — this strip is a zero-width horizontal scroll box at phone
            widths, so its links are unreachable rather than merely cramped.
            `min-w-0` lets it shrink and scroll instead of forcing the header
            (and with it the layout viewport) wider than the screen on the
            narrow end of the md range. */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center min-w-0 overflow-x-auto">
          {navLink('/', t('home'))}
          {navLink('/map', t('map'))}
          {navLink('/education', t('education'))}
          {navLink('/sites', t('sites'))}
          {navLink('/pitch', t('pitch'))}
          {navLink('/dashboard', t('dashboard'), { liveDot: true })}
          <span className="hidden lg:inline">{navLink('/verticals', t('verticals'))}</span>
          <span className="hidden xl:inline">{navLink('/bookmarks', t('bookmarks'))}</span>
        </div>

        {/* Right cluster.
            MEASURED at 390px: brand 129.4px + this cluster 233.9px
            (menu 44 + theme 44 + density 56.5 + language 65.4 + 3 gaps) +
            px-6 48 + gap-4 16 = ~427px of in-flow min-content, which is why
            Chromium mobile inflated the LAYOUT viewport from 390 to 420 and
            anchored `position: fixed` chrome (the quick-actions FAB, right-4)
            off the visible screen at 407–408px.
            Fix: on phones the cluster keeps only real 44px controls — theme,
            language and the menu. Density is a secondary preference and moves
            into the MobileNav drawer (below), and the row spacing tightens, so
            the header's min-content fits 360px with room to spare. Language
            deliberately STAYS in the header (it is asserted visible at 390px
            by tests/e2e/legibility.spec.ts). Everything at ≥md is untouched. */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <ThemeToggle />
          <div className="hidden md:block">
            <DensityToggle />
          </div>
          <LanguageToggle />
          <MobileNav />
          <button
            onClick={openPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 text-gray-400 hover:text-white transition"
            title="Search sites (⌘K)"
          >
            <Search size={15} />
            <span className="font-mono">{t('search')}</span>
            <span className="ml-1 text-label opacity-90 flex items-center gap-px">⌘K</span>
          </button>
          <div className="hidden md:flex items-center gap-2 text-gray-400">
            <span className="font-mono">2,611</span> {t('sitesCount')}
          </div>
        </div>
      </div>
    </nav>
    </>
  )
}