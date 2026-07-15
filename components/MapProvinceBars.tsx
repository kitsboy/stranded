'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import type { ProvinceCount } from '@/lib/map-stats'

type Props = {
  provinces: ProvinceCount[]
  maxBars?: number
  className?: string
}

const BAR_COLORS = ['#FF8C00', '#5BC0BE', '#A78BFA', '#34D399', '#F472B6', '#60A5FA', '#FBBF24', '#FB7185']

export default function MapProvinceBars({ provinces, maxBars = 6, className = '' }: Props) {
  const { locale, t } = useLocale()
  const [expanded, setExpanded] = useState(false)

  const display = useMemo(() => {
    if (expanded) return provinces
    return provinces.slice(0, maxBars)
  }, [provinces, maxBars, expanded])

  const maxCount = provinces[0]?.count ?? 1

  if (!provinces.length) {
    return (
      <div className={`text-[10px] text-gray-500 ${className}`} data-testid="map-province-bars">
        {t('mapProvinceBarsEmpty')}
      </div>
    )
  }

  return (
    <div className={className} data-testid="map-province-bars" role="img" aria-label={t('mapProvinceBarsAria')}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase tracking-widest text-gray-400">{t('mapProvinceBarsTitle')}</span>
        {provinces.length > maxBars && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-0.5 text-[9px] text-gray-400 hover:text-[#FF8C00]"
            aria-expanded={expanded}
          >
            {expanded ? t('mapCollapse') : t('mapExpand')}
            <ChevronDown size={10} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      <div className="space-y-1" aria-hidden>
        {display.map((p, i) => (
          <div key={p.province} className="flex items-center gap-2">
            <span className="text-[9px] text-gray-400 w-[4.5rem] truncate shrink-0" title={p.province}>
              {p.province}
            </span>
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 motion-reduce:transition-none"
                style={{
                  width: `${(p.count / maxCount) * 100}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  opacity: 1 - i * 0.05,
                }}
              />
            </div>
            <span className="text-[9px] text-gray-500 tabular-nums w-6 text-right shrink-0">{p.count}</span>
          </div>
        ))}
      </div>
      <div className="sr-only">
        {provinces.map(p =>
          tf(locale, 'mapProvinceBarsEntry', { province: p.province, count: p.count }),
        ).join('; ')}
      </div>
    </div>
  )
}