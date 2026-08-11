'use client'

type Props = {
  score: number
  low: number
  high: number
  band?: 'high' | 'medium' | 'low'
  reason?: string
  className?: string
}

export default function ConfidenceBandBar({ score, low, high, band = 'medium', reason, className = '' }: Props) {
  const left = Math.max(0, Math.min(100, low))
  const right = Math.max(left, Math.min(100, high))
  const width = Math.max(2, right - left)
  const marker = Math.max(0, Math.min(100, score))
  const bandColor =
    band === 'high' ? 'bg-[#34D399]/50' : band === 'low' ? 'bg-amber-400/40' : 'bg-[#5BC0BE]/40'

  return (
    <div className={className} data-testid="confidence-band-bar">
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>Score confidence ({band})</span>
        <span className="font-mono">
          {low}–{high}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10">
        <div
          className={`absolute top-0 h-full rounded-full ${bandColor}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-[#FF8C00]"
          style={{ left: `${marker}%` }}
          title={`Score ${score}`}
        />
      </div>
      {reason && <p className="mt-1 text-[10px] text-gray-500">{reason}</p>}
    </div>
  )
}
