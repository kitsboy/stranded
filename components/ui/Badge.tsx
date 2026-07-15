import { scoreTierClass } from '@/lib/scoring'

type ScoreTierBadgeProps = {
  score: number
  className?: string
}

type StatusBadgeProps = {
  status: 'operational' | 'degraded' | 'offline' | 'beta' | 'new'
  className?: string
}

const statusStyles: Record<StatusBadgeProps['status'], string> = {
  operational: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/40',
  degraded: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  offline: 'bg-red-500/15 text-red-400 border-red-500/40',
  beta: 'bg-[#5BC0BE]/15 text-[#5BC0BE] border-[#5BC0BE]/40',
  new: 'bg-[#FF8C00]/15 text-[#FF8C00] border-[#FF8C00]/40',
}

const statusLabels: Record<StatusBadgeProps['status'], string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  offline: 'Offline',
  beta: 'Beta',
  new: 'New',
}

export function ScoreTierBadge({ score, className = '' }: ScoreTierBadgeProps) {
  return (
    <span className={`stranded-score ${scoreTierClass(score)} ${className}`.trim()}>
      {score}
    </span>
  )
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyles[status]} ${className}`.trim()}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {statusLabels[status]}
    </span>
  )
}