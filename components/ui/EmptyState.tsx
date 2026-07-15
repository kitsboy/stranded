import { type LucideIcon } from 'lucide-react'
import { type ReactNode } from 'react'
import { ButtonLink } from './Button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
  children?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="empty-state glass rounded-2xl border border-white/10 p-10 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[#FF8C00]/10 border border-[#FF8C00]/20 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#FF8C00]" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-md mx-auto mb-5">{description}</p>}
      {action && (
        <ButtonLink href={action.href} variant="secondary" className="text-sm">
          {action.label}
        </ButtonLink>
      )}
      {children}
    </div>
  )
}