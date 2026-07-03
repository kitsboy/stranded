import Link from 'next/link'

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-600">/</span>}
            {item.href ? <Link href={item.href} className="hover:text-[#5BC0BE]">{item.label}</Link> : <span className="text-gray-300">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}