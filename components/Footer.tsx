'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Briefcase, ExternalLink } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import RecentSites from '@/components/RecentSites'

type FooterLink = { href: string; label: string; external?: boolean }

function FooterNavLink({ href, label, external }: FooterLink) {
  const className =
    'footer-link group inline-flex items-center gap-1 min-h-[28px] text-[12px] text-gray-400 transition-colors duration-200 hover:text-[#5BC0BE] focus-visible:text-[#5BC0BE] focus-visible:outline-none'

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <span className="border-b border-transparent group-hover:border-[#5BC0BE]/40 transition-colors">
          {label}
        </span>
        <ExternalLink
          className="w-2.5 h-2.5 opacity-0 -translate-x-0.5 group-hover:opacity-70 group-hover:translate-x-0 transition-all text-[#5BC0BE]"
          aria-hidden
        />
      </a>
    )
  }

  return (
    <Link href={href} className={className}>
      <span className="border-b border-transparent group-hover:border-[#5BC0BE]/40 transition-colors">
        {label}
      </span>
    </Link>
  )
}

function FooterCol({
  title,
  accent = 'teal',
  children,
}: {
  title: string
  accent?: 'orange' | 'teal' | 'muted'
  children: React.ReactNode
}) {
  const accentClass =
    accent === 'orange'
      ? 'text-[#FF8C00]'
      : accent === 'muted'
        ? 'text-gray-300'
        : 'text-[#5BC0BE]'

  return (
    <div className="min-w-0">
      <h3
        className={`text-[10px] uppercase tracking-[0.18em] font-semibold mb-3 ${accentClass}`}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function Footer() {
  const { t } = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const [statsDate, setStatsDate] = useState('')
  const [version, setVersion] = useState('2.10')
  const [siteCount, setSiteCount] = useState(2611)
  const btcAddress = 'bc1qhm5ndfjhqxdk3cx0pngyps4f5nnwdckulmge6c8keyf2pk0neqtshjn8ad'
  const isMapPage = pathname === '/map' || pathname === '/map/'

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(j => {
        setStatsDate(j.generatedAt ? new Date(j.generatedAt).toLocaleDateString('en-CA') : '')
        if (j.version) setVersion(String(j.version))
        if (j.siteCount) setSiteCount(Number(j.siteCount))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!showQR) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQR(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showQR])

  if (isMapPage) return null

  const platform: FooterLink[] = [
    { href: '/', label: t('home') },
    { href: '/map', label: t('map') },
    { href: '/sites', label: t('sites') },
    { href: '/dashboard', label: t('dashboard') },
    { href: '/education', label: t('education') },
    { href: '/pitch', label: t('pitch') },
    { href: '/compare', label: 'Compare' },
    { href: '/bookmarks', label: t('bookmarks') },
    { href: '/provinces', label: 'Provinces' },
  ]

  const resources: FooterLink[] = [
    { href: '/methodology', label: t('footerMethodology') },
    { href: '/open-data', label: t('footerOpenData') },
    { href: '/funding', label: t('funding') },
    { href: '/partnerships', label: t('partnerships') },
    { href: '/verticals', label: t('verticals') },
    { href: '/benchmarks', label: t('benchmarks') },
    { href: '/global', label: t('global') },
    { href: '/docs/api', label: 'Data API' },
    { href: '/changelog', label: 'Changelog' },
    { href: '/Marketing-Hub.html', label: t('footerMarketingHub'), external: true },
  ]

  const companyLegal: FooterLink[] = [
    { href: '/about', label: t('footerAbout') },
    { href: '/roadmap', label: t('footerRoadmap') },
    { href: '/status', label: t('footerStatus') },
    { href: '/privacy', label: t('footerPrivacy') },
    { href: '/print/province', label: 'Print province' },
  ]

  const suite: FooterLink[] = [
    { href: 'https://giveabit.io', label: 'Give A Bit', external: true },
    { href: 'https://satohash.io', label: 'Satohash', external: true },
    { href: 'https://hq.giveabit.io', label: 'HQ', external: true },
    { href: 'https://api.satohash.io/health', label: 'Proof API', external: true },
  ]

  return (
    <footer
      className="site-footer w-full mt-auto shrink-0 border-t border-white/10 bg-gradient-to-b from-[#1a2433]/90 to-[var(--bg-dark)]"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        {/* Mobile primary CTAs — only at end of page, not sticky */}
        <div className="md:hidden flex gap-2 mb-8">
          <Link
            href="/map"
            className="flex-1 text-center py-2.5 rounded-xl bg-[#FF8C00] text-black font-semibold text-sm touch-manipulation active:scale-[0.98] hover:bg-[#ff9d33] transition-colors"
          >
            {t('openMap')}
          </Link>
          <Link
            href="/pitch"
            className="flex-1 text-center py-2.5 rounded-xl border border-[#5BC0BE]/50 text-[#5BC0BE] font-semibold text-sm touch-manipulation active:scale-[0.98] hover:bg-[#5BC0BE]/10 hover:border-[#5BC0BE] transition-colors"
          >
            {t('pitch')}
          </Link>
        </div>

        {/* 4-column main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 lg:gap-12">
          {/* Col 1 — Brand */}
          <FooterCol title="Stranded Value" accent="orange">
            <p className="text-[12px] text-gray-400 leading-relaxed mb-4 max-w-[220px]">
              {t('tagline')}. {siteCount.toLocaleString()} verified methane sites — model, compare, and fund capture with honest economics.
            </p>

            <a
              href="https://giveabit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-col gap-1.5 mb-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]/50"
              aria-label="Visit giveabit.io"
            >
              <span className="text-[10px] uppercase tracking-[0.14em] text-gray-500 group-hover:text-gray-300 transition-colors">
                {t('footerBy')}
              </span>
              {/* Prefer wordmark; mark is fallback if wordmark missing later */}
              <span className="inline-flex items-center gap-2">
                <Image
                  src="/images/giveabit-logo.png"
                  alt="giveabit.io"
                  width={140}
                  height={36}
                  className="h-7 w-auto opacity-85 group-hover:opacity-100 transition-opacity duration-200"
                />
              </span>
              <span className="text-[11px] text-gray-500 group-hover:text-[#FF8C00] transition-colors">
                giveabit.io ↗
              </span>
            </a>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-gray-500">
              <span className="font-mono text-[#FF8C00]/90">v{version}</span>
              <span className="text-white/15">·</span>
              <span>
                {siteCount.toLocaleString()} {t('sitesCount')}
              </span>
              {statsDate && (
                <>
                  <span className="text-white/15">·</span>
                  <span>
                    {t('footerStats')} {statsDate}
                  </span>
                </>
              )}
            </div>
          </FooterCol>

          {/* Col 2 — Platform */}
          <FooterCol title="Platform" accent="teal">
            <nav className="flex flex-col gap-0.5" aria-label="Platform">
              {platform.map(link => (
                <FooterNavLink key={link.href} {...link} />
              ))}
            </nav>
          </FooterCol>

          {/* Col 3 — Resources */}
          <FooterCol title="Resources" accent="teal">
            <nav className="flex flex-col gap-0.5" aria-label="Resources">
              {resources.map(link => (
                <FooterNavLink key={link.href} {...link} />
              ))}
            </nav>
          </FooterCol>

          {/* Col 4 — Company, legal, connect */}
          <FooterCol title="Company & legal" accent="muted">
            <nav className="flex flex-col gap-0.5 mb-4" aria-label="Company and legal">
              {companyLegal.map(link => (
                <FooterNavLink key={link.href} {...link} />
              ))}
            </nav>

            <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500 mb-1.5">Suite</div>
            <nav className="flex flex-col gap-0.5 mb-5" aria-label="GiveAbit suite">
              {suite.map(link => (
                <FooterNavLink key={link.href} {...link} />
              ))}
            </nav>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#FF8C00]/35 bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00]/20 hover:border-[#FF8C00]/60 hover:text-white transition-colors duration-200"
                  title="Donate Bitcoin"
                  aria-expanded={showQR}
                >
                  <span className="text-sm leading-none">₿</span>
                  <span className="font-medium">{t('footerDonate')}</span>
                </button>
                {showQR && (
                  <div
                    className="absolute bottom-full left-0 mb-2 p-4 bg-white rounded-lg shadow-2xl z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Bitcoin donation QR"
                  >
                    <QRCodeSVG value={`bitcoin:${btcAddress}`} size={140} level="M" includeMargin />
                    <p className="mt-2 text-center text-[10px] text-gray-600 max-w-[140px] break-all">
                      {btcAddress}
                    </p>
                    <button
                      type="button"
                      className="mt-2 w-full text-[10px] text-gray-500 hover:text-gray-800 transition-colors"
                      onClick={() => setShowQR(false)}
                    >
                      {t('close')}
                    </button>
                  </div>
                )}
              </div>
              <Link
                href="/pitch"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#FF8C00]/35 bg-[#FF8C00]/5 text-[#FF8C00] hover:bg-[#FF8C00]/15 hover:text-white transition-colors duration-200"
              >
                {t('footerPitch')}
              </Link>
              <a
                href="/Marketing-Hub.html"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#5BC0BE]/35 bg-white/5 text-[#5BC0BE] hover:bg-[#5BC0BE]/15 hover:border-[#5BC0BE]/60 hover:text-white transition-colors duration-200"
              >
                <Briefcase className="w-3 h-3" />
                <span>{t('footerMarketingHub')}</span>
              </a>
            </div>
          </FooterCol>
        </div>

        {/* Recent sites strip */}
        <div className="mt-8 pt-6 border-t border-white/8">
          <RecentSites
            max={5}
            onSelect={entry => router.push(`/map?site=${encodeURIComponent(entry.id)}`)}
          />
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] text-gray-500">
          <p className="leading-relaxed max-w-2xl">
            <span className="text-gray-400">© {new Date().getFullYear()} Stranded Value</span>
            <span className="text-white/15 mx-1.5">·</span>
            {t('footerData')}{' '}
            <a
              href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#5BC0BE] transition-colors duration-200 underline-offset-2 hover:underline"
            >
              {t('footerEccc')}
            </a>
            <span className="text-white/15 mx-1.5">·</span>
            Models illustrative — not investment advice
          </p>
          <p className="sm:text-right text-gray-500">
            <span className="text-gray-400">Safe Harbour</span>
            <span className="text-white/15 mx-1.5">·</span>
            <a
              href="https://giveabit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FF8C00] transition-colors duration-200"
            >
              Part of the Give A Bit family
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
