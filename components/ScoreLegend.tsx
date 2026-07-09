'use client'

/** Sticky Score v3 tier legend for map / list views */
export default function ScoreLegend({ compact = false }: { compact?: boolean }) {
  const tiers = [
    { cls: 'score-elite', label: '≥85 Elite', color: '#a855f7' },
    { cls: 'score-high', label: '≥65 High', color: '#22c55e' },
    { cls: 'score-med', label: '≥45 Med', color: '#eab308' },
    { cls: 'score-low', label: '<45 Low', color: '#f97316' },
  ]
  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/50 backdrop-blur px-3 py-2 text-[10px] ${compact ? '' : 'shadow-lg'}`}
      role="img"
      aria-label="Stranded Score tiers: elite 85 and up, high 65 and up, medium 45 and up, low under 45"
    >
      <div className="text-gray-400 mb-1.5 font-semibold tracking-wide uppercase">Score v3</div>
      <div className="flex flex-wrap gap-2">
        {tiers.map(t => (
          <div key={t.cls} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
            <span className={`stranded-score ${t.cls}`}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
