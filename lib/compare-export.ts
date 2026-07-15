import type { EnrichedSite } from './sites'
import { computeSiteValue } from './sites'

export type CompareSlot = 'a' | 'b' | 'c'

function esc(s: string) {
  return `"${String(s ?? '').replace(/"/g, '""')}"`
}

export type CompareExportRow = {
  label: string
  values: Record<CompareSlot, string>
}

/** Build metric rows for compare export (mirrors compare page table). */
export function buildCompareMetricRows(
  sites: Record<CompareSlot, EnrichedSite | null>,
): CompareExportRow[] {
  const active: CompareSlot[] = (['a', 'b', 'c'] as const).filter(s => sites[s] != null)
  if (active.length < 2) return []

  const fields: { label: string; pick: (s: EnrichedSite) => string }[] = [
    { label: 'id', pick: s => s.id },
    { label: 'name', pick: s => s.properties.name || s.id },
    { label: 'Stranded Score', pick: s => String(s.strandedScore) },
    { label: 'Emission (kg/day)', pick: s => String(s.emission) },
    { label: 'Province', pick: s => s.properties.province || '—' },
    { label: 'Source type', pick: s => s.properties.source_type || '—' },
    { label: 'Confidence', pick: s => s.properties.confidence || '—' },
    { label: 'Genset', pick: s => s.recommendedGenset || '—' },
    { label: 'Generator kW', pick: s => String(s.maxGeneratorPowerKW ?? '') },
    { label: 'Daily profit (CAD)', pick: s => String(s.potentialDailyProfitCAD) },
    {
      label: 'Annual BTC (est.)',
      pick: s => {
        const roi = computeSiteValue(s)
        return String(+(roi.dailyBtc * 365).toFixed(6))
      },
    },
    {
      label: 'Payback (days)',
      pick: s => {
        const roi = computeSiteValue(s)
        return isFinite(roi.paybackDays) ? String(roi.paybackDays) : ''
      },
    },
  ]

  return fields.map(f => ({
    label: f.label,
    values: {
      a: sites.a ? f.pick(sites.a) : '',
      b: sites.b ? f.pick(sites.b) : '',
      c: sites.c ? f.pick(sites.c) : '',
    },
  }))
}

/** CSV export for side-by-side compare (metric rows × site columns). */
export function exportCompareCsv(
  sites: Record<CompareSlot, EnrichedSite | null>,
): string {
  const active: CompareSlot[] = (['a', 'b', 'c'] as const).filter(s => sites[s] != null)
  if (active.length < 2) return 'metric,' + active.join(',') + '\n'

  const rows = buildCompareMetricRows(sites)
  const headers = ['metric', ...active.map(s => `site_${s}`)]
  const lines = rows.map(row =>
    [esc(row.label), ...active.map(s => esc(row.values[s]))].join(','),
  )
  return [headers.join(','), ...lines].join('\n')
}