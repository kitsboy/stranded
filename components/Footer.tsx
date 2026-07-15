'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import RecentSites from '@/components/RecentSites'
import { useRouter } from 'next/navigation'

export default function Footer() {
  const { t } = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [showQR, setShowQR] = useState(false)
  const [statsDate, setStatsDate] = useState('')
  const [version, setVersion] = useState('2.4')
  const btcAddress = 'bc1qhm5ndfjhqxdk3cx0pngyps4f5nnwdckulmge6c8keyf2pk0neqtshjn8ad'
  const isMapPage = pathname === '/map' || pathname === '/map/'
  const hideMobileCtas = isMapPage

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then(j => {
        setStatsDate(j.generatedAt ? new Date(j.generatedAt).toLocaleDateString('en-CA') : '')
        if (j.version) setVersion(String(j.version))
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

  return (
    <footer
      className="sticky bottom-0 z-40 w-full bg-[var(--bg-dark)]/95 backdrop-blur border-t border-white/10 px-4 sm:px-6 py-4 text-[11px] text-gray-300 mt-auto"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        {!hideMobileCtas && (
          <div className="md:hidden flex gap-2 mb-3">
            <Link
              href="/map"
              className="flex-1 text-center py-2.5 rounded-xl bg-[#FF8C00] text-black font-semibold text-sm touch-manipulation active:scale-[0.98]"
            >
              {t('openMap')}
            </Link>
            <Link
              href="/pitch"
              className="flex-1 text-center py-2.5 rounded-xl border border-[#5BC0BE]/50 text-[#5BC0BE] font-semibold text-sm touch-manipulation active:scale-[0.98]"
            >
              {t('pitch')}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-3">
          {/* Column 1 — Data & trust */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#FF8C00] font-semibold mb-2">
              Data & Trust
            </h3>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
              {t('footerData')}{' '}
              <a
                href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823"
                target="_blank"
                rel="noopener noreferrer"
                className="link-animated text-[#5BC0BE]"
              >
                {t('footerEccc')}
              </a>
            </p>
            <p className="text-[10px] text-gray-500">
              2026 · 2,611 {t('sitesCount')}
              {statsDate && <> · {t('footerStats')} {statsDate}</>}
            </p>
            <p className="font-mono text-[#FF8C00] text-[10px] mt-1">v{version}</p>
          </div>

          {/* Column 2 — Explore */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-[#5BC0BE] font-semibold mb-2">
              Explore
            </h3>
            <nav className="flex flex-col gap-1" aria-label="Footer navigation">
              {[
                { href: '/dashboard', label: t('dashboard') },
                { href: '/pitch', label: t('pitch') },
                { href: '/methodology', label: t('footerMethodology') },
                { href: '/open-data', label: t('footerOpenData') },
                { href: '/roadmap', label: t('footerRoadmap') },
                { href: '/about', label: t('footerAbout') },
                { href: '/status', label: t('footerStatus') },
                { href: '/privacy', label: t('footerPrivacy') },
              ].map(link => (
                <Link key={link.href} href={link.href} className="link-animated text-[10px] w-fit">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 pt-3 border-t border-white/10">
              <RecentSites
                max={5}
                onSelect={entry => router.push(`/map?site=${encodeURIComponent(entry.id)}`)}
              />
            </div>
          </div>

          {/* Column 3 — Connect */}
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-gray-300 font-semibold mb-2">
              Connect
            </h3>
            <p className="text-[10px] text-gray-500 mb-2">{t('footerBy')}</p>
            <a
              href="https://giveabit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-gray-200 hover:text-white transition-all mb-3"
              aria-label="Visit Give A Bit"
            >
              <span className="font-medium tracking-tight text-sm">GiveAbit Intelligence</span>
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#FF8C00] ring-1 ring-offset-1 ring-offset-[var(--bg-dark)] ring-[#FF8C00]/40 group-hover:ring-white/30 group-hover:scale-[1.08] transition">
                <span className="text-[8px] font-extrabold text-black leading-none mt-px">B</span>
              </span>
            </a>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 border border-[#FF8C00]/40 rounded-lg text-xs transition"
                  title="Donate Bitcoin"
                  aria-expanded={showQR}
                >
                  <span className="text-[#FF8C00] text-sm leading-none">₿</span>
                  <span className="text-white font-medium">{t('footerDonate')}</span>
                </button>
                {showQR && (
                  <div
                    className="absolute bottom-full left-0 mb-2 p-4 bg-white rounded-lg shadow-2xl z-50"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Bitcoin donation QR"
                  >
                    <QRCodeSVG value={`bitcoin:${btcAddress}`} size={140} level="M" includeMargin />
                    <p className="mt-2 text-center text-[10px] text-gray-600 max-w-[140px] break-all">{btcAddress}</p>
                    <button
                      type="button"
                      className="mt-2 w-full text-[10px] text-gray-500 hover:text-gray-800"
                      onClick={() => setShowQR(false)}
                    >
                      {t('close')}
                    </button>
                  </div>
                )}
              </div>
              <Link
                href="/pitch"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#FF8C00]/40 bg-[#FF8C00]/5 hover:bg-[#FF8C00]/15 text-[#FF8C00] hover:text-white transition"
              >
                {t('footerPitch')}
              </Link>
              <a
                href="/Marketing-Hub.html"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-[#5BC0BE]/40 bg-white/5 hover:bg-white/10 text-[#5BC0BE] hover:text-white transition"
              >
                <Briefcase className="w-3 h-3" />
                <span>{t('footerMarketingHub')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}