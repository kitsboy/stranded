'use client'

type ProvinceRow = {
  name: string
  count: number
  pct?: number
  revenue?: number
}

export default function ProvinceLeaderboard({
  provinces,
  className = '',
}: {
  provinces: ProvinceRow[]
  className?: string
}) {
  const sorted = [...provinces].sort((a, b) => (b.revenue ?? b.count) - (a.revenue ?? a.count)).slice(0, 10)
  const max = Math.max(...sorted.map(p => p.revenue ?? p.count), 1)

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`} data-testid="province-leaderboard">
      <h3 className="font-semibold text-[#FF8C00] mb-3">Province leaderboard</h3>
      <ul className="space-y-2">
        {sorted.map((p, i) => {
          const val = p.revenue ?? p.count
          const w = (val / max) * 100
          return (
            <li key={p.name}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-gray-300">
                  <span className="text-gray-500 mr-1.5">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="font-mono text-gray-400">
                  {p.count}
                  {p.pct != null && <span className="ml-1 text-gray-500">({p.pct}%)</span>}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF8C00] to-[#5BC0BE]"
                  style={{ width: `${w}%` }}
                />
              </div>
            </li>
          )
        })}
        {!sorted.length && <li className="text-sm text-gray-500">No province data</li>}
      </ul>
    </div>
  )
}
