'use client'

import { Database } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import { formatRelativeTime } from '@/lib/relative-time'
import type { LiveStats } from '@/types/live-stats'

type EcccFreshnessBadgeProps = {
  stats: LiveStats
  className?: string
}

export default function EcccFreshnessBadge({ stats, className = '' }: EcccFreshnessBadgeProps) {
  const { locale, t } = useLocale()
  const reportingYear = stats.ecccReportingYear ?? 2023
  const generatedLabel = formatRelativeTime(stats.generatedAt)

  return (
    <div
      className={`absolute z-[62] max-w-[min(260px,38vw)] pointer-events-none hidden md:block
        top-[4.5rem] left-4 xl:left-[19.5rem] ${className}`}
      data-testid="eccc-freshness-badge"
    >
      <div className="glass text-[10px] px-3 py-1.5 rounded-xl border border-[#5BC0BE]/30 text-gray-300 shadow-lg leading-snug pointer-events-auto flex items-center gap-2">
        <Database size={12} className="text-[#5BC0BE] shrink-0" aria-hidden />
        <div className="min-w-0">
          <span className="text-gray-400">{t('mapEcccLabel')}</span>{' '}
          <span className="font-mono text-[#5BC0BE]">
            {tf(locale, 'mapEcccReportingYear', { year: String(reportingYear) })}
          </span>
          <span className="text-gray-500"> · </span>
          <span className="text-gray-400" title={new Date(stats.generatedAt).toLocaleString()}>
            {tf(locale, 'mapEcccGenerated', { when: generatedLabel })}
          </span>
        </div>
      </div>
    </div>
  )
}