'use client'

import { motion } from 'framer-motion'
import { MapPin, TrendingUp } from 'lucide-react'
import type { ProvinceOpportunity } from '@/lib/pitch-metrics'
import { formatCompactNumber } from '@/lib/format-number'

function fmtUsd(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-CA')}`
}

type Props = {
  provinces: ProvinceOpportunity[]
  title: string
  desc: string
  maxRows?: number
}

export default function PitchProvinceRank({ provinces, title, desc, maxRows = 6 }: Props) {
  const slice = provinces.slice(0, maxRows)
  const top = slice[0]?.estRevenueUsd || 1

  return (
    <section className="px-6 pb-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#5BC0BE]" />
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {slice.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="pitch-province-row flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF8C00]/15 text-sm font-bold text-[#FF8C00]">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                  <span className="truncate font-medium text-gray-200">{p.name}</span>
                  <span className="shrink-0 text-xs text-gray-500">{p.sites} sites</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#5BC0BE]"
                    style={{ width: `${(p.estRevenueUsd / top) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                  <span>{formatCompactNumber(p.estKgDay, 1)} kg/day CH₄</span>
                  <span className="font-semibold text-[#F472B6]">{fmtUsd(p.estRevenueUsd)}/yr model</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}