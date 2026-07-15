'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Layers } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'

const SOURCE_COLORS = ['#FF8C00', '#5BC0BE', '#A78BFA', '#34D399', '#F472B6', '#FBBF24']

function formatSourceName(name: string) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

type Props = {
  stats: LiveStats
}

export default function DashboardSourceMix({ stats }: Props) {
  const sources = useMemo(() => stats.sourceTypes.slice(0, 6), [stats.sourceTypes])
  const maxCount = sources[0]?.count || 1

  return (
    <section className="dashboard-panel rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="source-mix-heading">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-[#5BC0BE]" aria-hidden />
        <div>
          <h2 id="source-mix-heading" className="font-semibold">
            Source Type Mix
          </h2>
          <p className="text-[10px] text-gray-500">Top 6 ECCC facility categories</p>
        </div>
      </div>

      <div className="space-y-3">
        {sources.map((src, i) => {
          const color = SOURCE_COLORS[i % SOURCE_COLORS.length]
          return (
            <motion.div
              key={src.name}
              initial={{ opacity: 0, x: 6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-gray-300">{formatSourceName(src.name)}</span>
                <span className="shrink-0 tabular-nums text-gray-400">
                  <span className="font-semibold" style={{ color }}>
                    {src.count.toLocaleString('en-CA')}
                  </span>
                  <span className="ml-1 text-gray-500">({src.pct}%)</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(src.count / maxCount) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.04 }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="mt-4 text-[10px] text-gray-500">
        {stats.sourceTypes.length} source categories · {stats.siteCount.toLocaleString('en-CA')} total sites
      </p>
    </section>
  )
}