'use client'

type Props = { values: number[]; width?: number; height?: number }

export default function ScoreSparkline({ values, width = 72, height = 22 }: Props) {
  if (!values.length) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : 0
  const points = values
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  const latest = values[values.length - 1]
  const prev = values.length > 1 ? values[values.length - 2] : latest
  const delta = latest - prev

  return (
    <div className="flex items-center gap-1.5" title={`Last ${values.length} visits: ${values.join(' → ')}`}>
      <svg width={width} height={height} className="shrink-0" aria-hidden>
        <polyline
          fill="none"
          stroke="#5BC0BE"
          strokeWidth="1.5"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      {values.length > 1 && (
        <span className={`text-[9px] font-mono tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  )
}