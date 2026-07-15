'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Database, ShieldAlert, ShieldCheck, Shield } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { confidenceBreakdown } from '@/lib/dashboard-metrics'

const LEVEL_META: Record<
  'high' | 'medium' | 'low',
  { label: string; color: string; icon: LucideIcon; description: string }
> = {
  high: {
    label: 'High',
    color: '#34D399',
    icon: ShieldCheck,
    description: 'Direct ECCC facility match',
  },
  medium: {
    label: 'Medium',
    color: '#FBBF24',
    icon: Shield,
    description: 'Partial or inferred attribution',
  },
  low: {
    label: 'Low',
    color: '#FB7185',
    icon: ShieldAlert,
    description: 'Sparse or proxy data',
  },
}

type Props = {
  stats: LiveStats
}

export default function DashboardConfidencePanel({ stats }: Props) {
  const breakdown = useMemo(() => confidenceBreakdown(stats), [stats])
  const total = stats.siteCount || 1

  return (
    <section
      className="pitch-panel rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6"
      aria-labelledby="confidence-panel-heading"
    >
      <div className="mb-5 flex items-center gap-2">
        <Database className="h-5 w-5 text-[#5BC0BE]" aria-hidden />
        <div>
          <h2 id="confidence-panel-heading" className="text-lg font-bold">
            Data Confidence
          </h2>
          <p className="text-xs text-gray-500">
            {total.toLocaleString('en-CA')} sites · ECCC GHGRP attribution quality
          </p>
        </div>
      </div>

      <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-white/5">
        {breakdown.map((row, i) => (
          <motion.div
            key={row.level}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: LEVEL_META[row.level].color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${row.pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.08 }}
            title={`${LEVEL_META[row.level].label}: ${row.pct}%`}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {breakdown.map((row, i) => {
          const meta = LEVEL_META[row.level]
          const Icon = meta.icon
          return (
            <motion.div
              key={row.level}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border p-4"
              style={{
                borderColor: `${meta.color}44`,
                backgroundColor: `${meta.color}0d`,
              }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                  {meta.label}
                </span>
                <Icon className="h-4 w-4 opacity-70" style={{ color: meta.color }} aria-hidden />
              </div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: meta.color }}>
                {row.count.toLocaleString('en-CA')}
              </div>
              <div className="mt-1 text-sm tabular-nums text-gray-400">{row.pct}%</div>
              <p className="mt-2 text-[10px] leading-snug text-gray-500">{meta.description}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}