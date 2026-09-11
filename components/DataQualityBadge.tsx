'use client'

import type { DataQualityFlag, DataQualityResult } from '@/lib/data-quality'

const GRADE_CLASS: Record<string, string> = {
  A: 'bg-[#34D399]/20 text-[#34D399] border-[#34D399]/40',
  B: 'bg-[#5BC0BE]/20 text-[#5BC0BE] border-[#5BC0BE]/40',
  C: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  D: 'bg-red-500/20 text-red-300 border-red-500/40',
}

type Props = {
  report?: DataQualityResult
  grade?: string
  score?: number
  flags?: DataQualityFlag[]
  className?: string
}

export default function DataQualityBadge({ report, grade, score, flags, className = '' }: Props) {
  const g = report?.grade || grade || 'C'
  const s = report?.score ?? score
  const f = report?.flags || flags || []
  const noCh4 = f.some(x => x.id === 'no_reported_ch4')
  const title = [
    noCh4 ? 'No reported CH₄ — not modelled' : (s != null ? `Data quality ${s}/100` : 'Data quality'),
    ...f.map(x => `• ${x.label}`),
  ].join('\n')

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${noCh4 ? 'border-red-500/40 bg-red-500/15 text-red-300' : (GRADE_CLASS[g] || GRADE_CLASS.C)} ${className}`}
      title={title}
      data-testid={noCh4 ? 'data-quality-no-ch4' : 'data-quality-badge'}
    >
      {noCh4 ? 'No reported CH₄ — not modelled' : <>DQ {g}{s != null && <span className="font-mono opacity-80">{s}</span>}</>}
    </span>
  )
}
