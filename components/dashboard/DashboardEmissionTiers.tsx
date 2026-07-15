'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Factory } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { emissionTierItems } from '@/lib/dashboard-metrics'

const TIER_COLORS: Record<string, string> = {
  mega: '#a855f7',
  large: '#FF8C00',
  medium: '#5BC0BE',
  small: '#34D399',
  micro: '#94a3b8',
}

type Props = {
  stats: LiveStats
}

export default function DashboardEmissionTiers({ stats }: Props) {
  const tiers = useMemo(() => emissionTierItems(stats), [stats])
  const maxCount = tiers[0]?.count || 1

  return (
    <section className="dashboard-panel rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="emission-tiers-heading">
      <div className="mb-4 flex items-center gap-2">
        <Factory className="h-4 w-4 text-[#FF8C00]" aria-hidden />
        <div>
          <h2 id="emission-tiers-heading" className="font-semibold">
            Emission Tiers
          </h2>
          <p className="text-[10px] text-gray-500">kg CH₄/day bands across portfolio</p>
        </div>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, i) => {
          const color = TIER_COLORS[tier.key] || '#94a3b8'
          return (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 text-gray-300">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="truncate">{tier.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-gray-400">
                  <span className="font-semibold" style={{ color }}>
                    {tier.count.toLocaleString('en-CA')}
                  </span>
                  <span className="ml-1 text-gray-500">({tier.pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(tier.count / maxCount) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.04 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tiers.slice(0, 3).map(tier => (
          <span
            key={tier.key}
            className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-gray-400"
          >
            {tier.label.split(' ')[0]}: <strong className="text-gray-200">{tier.count}</strong>
          </span>
        ))}
      </div>
    </section>
  )
}