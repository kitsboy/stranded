'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

export type PitchStatCardProps = {
  label: string
  value: string
  compactValue?: string
  sub?: string
  accent?: string
  icon?: LucideIcon
  delay?: number
}

export default function PitchStatCard({
  label,
  value,
  compactValue,
  sub,
  accent = '#FF8C00',
  icon: Icon,
  delay = 0,
}: PitchStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      className="pitch-stat-card group relative flex min-h-[8.25rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] via-white/[0.03] to-transparent p-4 sm:p-5"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-35"
        style={{ background: accent }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <span className="text-[10px] font-medium uppercase leading-snug tracking-[0.14em] text-gray-400 line-clamp-2">
          {label}
        </span>
        {Icon && (
          <Icon
            className="h-4 w-4 shrink-0 opacity-50 transition-opacity group-hover:opacity-80"
            style={{ color: accent }}
            aria-hidden
          />
        )}
      </div>
      <div
        className="pitch-stat-value relative mt-3 font-bold tabular-nums leading-none tracking-tight"
        style={{ color: accent }}
        title={value}
      >
        <span className="hidden xl:inline">{value}</span>
        <span className="xl:hidden">{compactValue ?? value}</span>
      </div>
      {sub && (
        <p className="relative mt-auto pt-2.5 text-[10px] leading-snug text-gray-500 line-clamp-2">
          {sub}
        </p>
      )}
    </motion.div>
  )
}