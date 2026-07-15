import { type ReactNode } from 'react'
import Breadcrumbs from './Breadcrumbs'

type BreadcrumbItem = { label: string; href?: string }

type PageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  badge?: ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`page-header mb-8 ${className}`.trim()}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {badge && <div className="mb-2">{badge}</div>}
          <h1 className="text-4xl font-bold tracking-tighter">{title}</h1>
          {subtitle && <p className="text-gray-400 mt-2 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  )
}