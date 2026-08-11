'use client'

import { FileDown } from 'lucide-react'
import type { LiveStats } from '@/types/live-stats'
import { buildDashboardOnePagerHtml, openOnePagerPrint } from '@/lib/dashboard-onepager'
import { useBtcUsd } from '@/components/BtcPriceProvider'

export default function DashboardExportButton({ stats }: { stats: LiveStats | null }) {
  const btc = useBtcUsd()

  if (!stats) return null

  const exportPdf = () => {
    const html = buildDashboardOnePagerHtml(
      {
        version: stats.version,
        siteCount: stats.siteCount,
        provinceCount: stats.provinceCount,
        generatedAt: stats.generatedAt,
        avgScore: (stats as { avgScore?: number }).avgScore,
        impact: stats.impact,
        topSites: stats.topSites,
        topProvinces: stats.provinces?.map(p => ({ name: p.name, count: p.count, pct: p.pct })),
      },
      { liveBtcUsd: btc || 85_000, title: 'Stranded Value — Command Center One-Pager' },
    )
    openOnePagerPrint(html)
  }

  return (
    <button
      type="button"
      onClick={exportPdf}
      className="inline-flex items-center gap-2 rounded-xl border border-[#5BC0BE]/40 bg-[#5BC0BE]/10 px-3 py-2 text-xs text-[#5BC0BE] hover:bg-[#5BC0BE]/20 transition"
      data-testid="dashboard-onepager-export"
    >
      <FileDown size={14} />
      Export one-pager (print/PDF)
    </button>
  )
}
