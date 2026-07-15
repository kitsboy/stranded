import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight
                size={12}
                className="text-gray-600 shrink-0 mx-0.5"
                aria-hidden
              />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="breadcrumb-link rounded px-1 py-0.5 transition-colors hover:text-[#5BC0BE] hover:bg-white/5"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-300 px-1" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}