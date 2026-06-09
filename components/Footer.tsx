'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

export default function Footer() {
  const [showQR, setShowQR] = useState(false)
  const btcAddress = 'bc1qhm5ndfjhqxdk3cx0pngyps4f5nnwdckulmge6c8keyf2pk0neqtshjn8ad'
  const buildNumber = 'v1.0'

  return (
    <footer className="sticky bottom-0 z-40 w-full bg-[var(--bg-dark)]/95 backdrop-blur border-t border-white/10 px-4 sm:px-6 py-3 text-[11px] text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-5">
          {/* Left: provenance + version (clean, compact) */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-gray-400">
            <span>Data: <a href="https://open.canada.ca/data/en/dataset/a8ba14b7-7f23-462a-bdbb-83b0ef629823" target="_blank" rel="noopener noreferrer" className="text-[#5BC0BE] hover:text-white hover:underline">ECCC Verified</a></span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span>2026 • 2,611 sites</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="font-mono text-[#FF8C00]">{buildNumber}</span>
            <Link href="/education" className="hover:text-[#5BC0BE] hidden md:inline text-[10px]">Methodology</Link>
          </div>

          {/* Center: bright, legible GiveAbit branding + logo (the main fix) */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-gray-500 hidden sm:inline">by</span>
            <a
              href="https://giveabit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-gray-200 hover:text-white transition-all"
              aria-label="Visit Give A Bit at giveabit.io"
            >
              <span className="font-medium tracking-tight">GiveAbit Intelligence</span>
              {/* Bright, visible GiveAbit logo mark (orange circled B) */}
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#FF8C00] ring-1 ring-offset-1 ring-offset-[var(--bg-dark)] ring-[#FF8C00]/40 group-hover:ring-white/30 group-hover:scale-[1.08] transition">
                <span className="text-[8px] font-extrabold text-black leading-none mt-px">B</span>
              </span>
              <span className="text-[#FF8C00] group-hover:text-[#ff9d33] text-[10px] font-medium">giveabit.io</span>
            </a>
          </div>

          {/* Right: action buttons with breathing room (not cramped) */}
          <div className="relative flex items-center gap-2">
            {/* Donate (BTC) — keeps QR reveal, brighter accents */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 active:bg-[#FF8C00]/25 border border-[#FF8C00]/40 hover:border-[#FF8C00]/70 rounded-lg text-xs transition focus:outline-none focus:ring-1 focus:ring-[#FF8C00]/50"
              title="Donate Bitcoin to support Stranded"
            >
              <span className="text-[#FF8C00] text-sm leading-none">₿</span>
              <span className="text-white font-medium">Donate</span>
            </button>

            {showQR && (
              <div className="absolute bottom-full right-0 mb-2 p-4 bg-white rounded-lg shadow-2xl z-50">
                <QRCodeSVG value={`bitcoin:${btcAddress}`} size={140} level="M" includeMargin />
                <p className="mt-2 text-center text-[10px] text-gray-600 max-w-[140px] break-all">{btcAddress}</p>
              </div>
            )}

            {/* Marketing Hub — modern lucide icon, consistent styling, teal accent */}
            <a
              href="/Marketing-Hub.html"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border border-[#5BC0BE]/40 bg-white/5 hover:bg-white/10 hover:border-[#5BC0BE]/70 text-[#5BC0BE] hover:text-white transition focus:outline-none focus:ring-1 focus:ring-[#5BC0BE]/40"
              title="Professional Marketing & Sales Hub (5 docs + visuals + charts + print)"
            >
              <Briefcase className="w-3 h-3" />
              <span>Marketing Hub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
