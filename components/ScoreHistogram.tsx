'use client'

import { useMemo } from 'react'

interface ScoreHistogramProps {
  scores: number[]
  bucketSize?: number
  className?: string
}

export default function ScoreHistogram({ scores, bucketSize = 10, className = '' }: ScoreHistogramProps) {
  const buckets = useMemo(() => {
    const count = Math.ceil(100 / bucketSize)
    const bins = Array.from({ length: count }, (_, i) => ({
      label: `${i * bucketSize}–${Math.min((i + 1) * bucketSize - 1, 99)}`,
      min: i * bucketSize,
      count: 0,
    }))
    for (const s of scores) {
      const idx = Math.min(Math.floor(s / bucketSize), count - 1)
      bins[idx].count++
    }
    return bins
  }, [scores, bucketSize])

  const max = Math.max(...buckets.map(b => b.count), 1)

  return (
    <div className={className}>
      <div className="flex items-end gap-1 h-32">
        {buckets.map(b => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#FF8C00]/80 to-[#5BC0BE]/60 transition-all"
              style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count ? 4 : 0 }}
              title={`${b.label}: ${b.count} sites`}
            />
            <span className="text-[8px] text-gray-500 truncate w-full text-center">{b.min}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-2">
        <span>Stranded Score distribution</span>
        <span>{scores.length.toLocaleString()} sites</span>
      </div>
    </div>
  )
}