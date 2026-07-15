'use client'

import { motion } from 'framer-motion'
import { Cog } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'

const COLORS = ['#FF8C00', '#5BC0BE', '#A78BFA', '#34D399', '#F472B6', '#60A5FA', '#FBBF24']

type Props = {
  stats: LiveStats
  maxBars?: number
}

export default function DashboardGensetMix({ stats, maxBars = 6 }: Props) {
  const items = stats.gensetRecommendations.slice(0, maxBars)
  const max = Math.max(...items.map(g => g.count), 1)

  return (
    <section className="pitch-panel mb-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6" aria-labelledby="genset-mix-heading">
      <div className="mb-5 flex items-center gap-2">
        <Cog className="h-5 w-5 text-[#34D399]" aria-hidden />
        <div>
          <h2 id="genset-mix-heading" className="text-lg font-bold">
            Genset Mix
          </h2>
          <p className="text-xs text-gray-500">Jenbacher-class recommendations across portfolio</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((g, i) => (
          <div key={g.id}>
            <div className="mb-1.5 flex justify-between gap-2 text-xs">
              <span className="truncate pr-2 font-medium text-gray-300">{g.id}</span>
              <span className="shrink-0 tabular-nums text-gray-400">
                {g.count.toLocaleString('en-CA')}
                <span className="ml-1 text-gray-500">({g.pct}%)</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(g.count / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.06 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]}88)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}