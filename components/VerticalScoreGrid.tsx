'use client'

import type { VerticalScores } from '@/lib/vertical-scores'

const LABELS: { key: keyof VerticalScores; label: string; color: string }[] = [
  { key: 'mining', label: 'Mining', color: '#FF8C00' },
  { key: 'heat', label: 'Heat', color: '#F472B6' },
  { key: 'hydrogen', label: 'H₂', color: '#60A5FA' },
  { key: 'abatement', label: 'Abatement', color: '#34D399' },
]

export default function VerticalScoreGrid({ scores, className = '' }: { scores: VerticalScores; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} data-testid="vertical-score-grid">
      <div className="text-[10px] uppercase tracking-widest text-gray-400">Multi-vertical fit</div>
      {LABELS.map(({ key, label, color }) => {
        const v = scores[key]
        return (
          <div key={key}>
            <div className="mb-0.5 flex justify-between text-[11px]">
              <span className="text-gray-300">{label}</span>
              <span className="font-mono text-gray-400">{v}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
