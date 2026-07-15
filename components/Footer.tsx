'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'

export default function Footer() {
  const { t } = useLocale()
  const pathname = usePathname()
  const [showQR, setShowQR] = useState(false)
  const [statsDate, setStatsDate] = useState('')
  const [version, setVersion] = useState('2.3')
  const btcAddress = 'bc1qhm5ndfjhqxdk3cx0pngyps4f5nnwdckulmge6c8keyf2pk0neqtshjn8ad'
  const hideMobileCtas = pathname === '/map'

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

  return (
    <footer
      className="sticky bottom-0 z-40 w-full bg-[var(--bg-dark)]/95 backdrop-blur border-t border-white/10 px-4 sm:px-6 py-3 text-[11px] text-gray-300 mt-auto"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile primary CTAs — inside footer (not a separate fixed layer under it). Hidden on map. */}
        {!hideMobileCtas && (
          <div className="md:hidden flex gap-2 mb-2.5">
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

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-0.5 text-[10px] text-gray-400">
            <span>{t('footerData')} <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] hover:text-white hover:underline">{t('footerEccc')}</a></span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span>2026 • 2,611 {t('sitesCount')}{statsDate && <> • {t('footerStats')} {statsDate}</>}</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="font-mono text-[#FF8C00]">v{version}</span>
            <Link href="/methodology" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">{t('footerMethodology')}</Link>
            <Link href="/open-data" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">{t('footerOpenData')}</Link>
            <Link href="/roadmap" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">{t('footerRoadmap')}</Link>
            <Link href="/privacy" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">{t('footerPrivacy')}</Link>
            <Link href="/about" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">{t('footerAbout')}</Link>
            <Link href="/status" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">{t('footerStatus')}</Link>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500 hidden sm:inline">{t('footerBy')}</span>
            <a href="https://giveabit.io" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-gray-200 hover:text-white transition-all" aria-label="Visit Give A Bit">
              <span className="font-medium tracking-tight">GiveAbit Intelligence</span>
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#FF8C00] ring-1 ring-offset-1 ring-offset-[var(--bg-dark)] ring-[#FF8C00]/40 group-hover:ring-white/30 group-hover:scale-[1.08] transition">
                <span className="text-[8px] font-extrabold text-black leading-none mt-px">B</span>
              </span>
              <span className="text-[#FF8C00] group-hover:text-[#ff9d33] text-[10px] font-medium">giveabit.io</span>
            </a>
          </div>

          <div className="relative flex items-center gap-2">
            <button onClick={() => setShowQR(!showQR)} className="flex items-center gap-1.5 px-3 py-1 bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 border border-[#FF8C00]/40 rounded-lg text-xs transition" title="Donate Bitcoin" aria-expanded={showQR}>
              <span className="text-[#FF8C00] text-sm leading-none">₿</span>
              <span className="text-white font-medium">{t('footerDonate')}</span>
            </button>
            {showQR && (
              <div
                className="absolute bottom-full right-0 mb-2 p-4 bg-white rounded-lg shadow-2xl z-50"
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
            <Link href="/pitch" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border border-[#FF8C00]/40 bg-[#FF8C00]/5 hover:bg-[#FF8C00]/15 text-[#FF8C00] hover:text-white transition">{t('footerPitch')}</Link>
            <a href="/Marketing-Hub.html" className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border border-[#5BC0BE]/40 bg-white/5 hover:bg-white/10 text-[#5BC0BE] hover:text-white transition">
              <Briefcase className="w-3 h-3" /><span>{t('footerMarketingHub')}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}