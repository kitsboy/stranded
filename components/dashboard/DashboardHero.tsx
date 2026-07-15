'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Activity, Download, Map, Presentation } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'

type Props = {
  stats: LiveStats
  onExportJson?: () => void
}

export default function DashboardHero({ stats, onExportJson }: Props) {
  const generated = new Date(stats.generatedAt).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <section className="dashboard-hero relative -mx-6 mb-10 overflow-hidden px-6 pb-12 pt-8 md:-mx-0 md:rounded-3xl md:border md:border-white/10">
      <div className="pitch-hero-mesh pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#FF8C00]/25 bg-[#FF8C00]/10 px-4 py-1.5 text-xs tracking-widest text-[#FF8C00]"
        >
          <span className="pitch-live-dot h-2 w-2 rounded-full bg-[#FF8C00]" aria-hidden />
          <span>Live Command Center</span>
          <span className="text-[#FF8C00]/60">·</span>
          <span className="font-mono text-[#FF8C00]/90">v{stats.version}</span>
          {stats.ecccReportingYear != null && (
            <>
              <span className="text-[#FF8C00]/60">·</span>
              <span className="text-[#5BC0BE]">ECCC {stats.ecccReportingYear}</span>
            </>
          )}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-3 text-4xl font-bold tracking-tighter md:text-5xl"
        >
          <span className="bg-gradient-to-r from-[#FF8C00] via-[#FFB347] to-[#5BC0BE] bg-clip-text text-transparent">
            Stranded Command Dashboard
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mb-6 max-w-2xl text-sm text-gray-400 md:text-base"
        >
          {stats.siteCount.toLocaleString('en-CA')} verified sites across {stats.provinceCount} provinces ·
          auto-synced {generated}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF8C00] px-5 py-2.5 text-sm font-semibold text-[#1e293b] transition hover:bg-[#FF8C00]/90"
          >
            <Map className="h-4 w-4" aria-hidden />
            Open Map
          </Link>
          <Link
            href="/pitch"
            className="inline-flex items-center gap-2 rounded-xl border border-[#5BC0BE]/50 px-5 py-2.5 text-sm text-[#5BC0BE] transition hover:bg-[#5BC0BE]/10"
          >
            <Presentation className="h-4 w-4" aria-hidden />
            Pitch Deck
          </Link>
          <Link
            href="/status"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm text-gray-300 transition hover:bg-white/10"
          >
            <Activity className="h-4 w-4" aria-hidden />
            System Status
          </Link>
          {onExportJson && (
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-2 rounded-xl border border-[#A78BFA]/40 px-5 py-2.5 text-sm text-[#A78BFA] transition hover:bg-[#A78BFA]/10"
            >
              <Download className="h-4 w-4" aria-hidden />
              Export live-stats JSON
            </button>
          )}
        </motion.div>
      </div>
    </section>
  )
}