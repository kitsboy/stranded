'use client'

import { BarChart3, Droplets, MapPin, Target } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'
import type { MapFilterStats } from '@/lib/map-stats'

type Props = {
  stats: MapFilterStats
  className?: string
}

export default function MapStatsBar({ stats, className = '' }: Props) {
  const { locale, t } = useLocale()

  if (!stats.count) {
    return (
      <div
        className={`glass rounded-2xl border border-white/10 px-4 py-2.5 text-xs text-gray-400 ${className}`}
        data-testid="map-stats-bar"
        role="status"
      >
        {t('mapStatsEmpty')}
      </div>
    )
  }

  const emissionLabel =
    stats.totalEmissionKgDay >= 1000
      ? `${(stats.totalEmissionKgDay / 1000).toFixed(1)}k`
      : stats.totalEmissionKgDay.toLocaleString()

  return (
    <div
      className={`glass rounded-2xl border border-[#5BC0BE]/25 px-4 py-2.5 ${className}`}
      data-testid="map-stats-bar"
      role="status"
      aria-label={t('mapStatsAria')}
    >
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Target size={14} className="text-[#FF8C00] shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-gray-500">{t('mapStatsAvgScore')}</div>
            <div className="font-mono font-semibold text-white tabular-nums">{stats.avgScore}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Droplets size={14} className="text-[#5BC0BE] shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-gray-500">{t('mapStatsEmission')}</div>
            <div className="font-mono font-semibold text-[#5BC0BE] tabular-nums truncate" title={`${stats.totalEmissionKgDay.toLocaleString()} kg/day`}>
              {emissionLabel} <span className="text-[9px] text-gray-500 font-normal">kg/d</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin size={14} className="text-emerald-400 shrink-0" aria-hidden />
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-gray-500">{t('mapStatsTopProvince')}</div>
            <div className="font-semibold text-white truncate" title={stats.topProvince ?? undefined}>
              {stats.topProvince ?? '—'}
              {stats.topProvince && (
                <span className="text-[9px] text-gray-400 font-normal ml-1">
                  ({tf(locale, 'mapStatsProvinceCount', { count: stats.topProvinceCount })})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[9px] text-gray-500">
        <BarChart3 size={10} aria-hidden />
        <span>{tf(locale, 'mapStatsFiltered', { count: stats.count.toLocaleString() })}</span>
      </div>
    </div>
  )
}