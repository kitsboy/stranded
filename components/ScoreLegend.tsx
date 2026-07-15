'use client'

import { useLocale } from '@/lib/useLocale'

/** Sticky Score v3 tier legend for map / list views */
export default function ScoreLegend({
  compact = false,
  horizontal = false,
}: {
  compact?: boolean
  /** Single-row layout for map corner */
  horizontal?: boolean
}) {
  const { t } = useLocale()
  const tiers = [
    { cls: 'score-elite', label: '≥85 Elite', color: '#a855f7' },
    { cls: 'score-high', label: '≥65 High', color: '#22c55e' },
    { cls: 'score-med', label: '≥45 Med', color: '#eab308' },
    { cls: 'score-low', label: '<45 Low', color: '#f97316' },
  ]

  const isMapCompact = compact && horizontal

  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/50 backdrop-blur text-[10px] ${
        isMapCompact ? 'px-2.5 py-1.5' : compact ? 'px-3 py-2' : 'px-3 py-2 shadow-lg'
      }`}
      role="img"
      aria-label={t('mapScoreLegendAria')}
      data-testid="score-legend"
    >
      {isMapCompact ? (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-gray-400 font-semibold tracking-wide uppercase text-[9px] shrink-0">
            {t('mapScoreLegendTitle')}
          </span>
          {tiers.map(tier => (
            <div key={tier.cls} className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: tier.color }} />
              <span className={`stranded-score ${tier.cls} text-[9px]`}>{tier.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="text-gray-400 mb-1.5 font-semibold tracking-wide uppercase">{t('mapScoreLegendTitle')}</div>
          <div className={`flex ${horizontal ? 'flex-row flex-wrap gap-x-3 gap-y-1' : 'flex-wrap gap-2'}`}>
            {tiers.map(tier => (
              <div key={tier.cls} className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: tier.color }} />
                <span className={`stranded-score ${tier.cls}`}>{tier.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}