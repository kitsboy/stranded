'use client'

import type { ReactNode } from 'react'
import { glossaryLookup } from '@/lib/glossary'

/** Inline term with hover/focus definition from shared glossary. */
export default function GlossaryTip({ term, children }: { term: string; children?: ReactNode }) {
  const entry = glossaryLookup(term)
  const label = children ?? term
  if (!entry) return <span>{label}</span>
  return (
    <abbr
      title={entry.def}
      className="cursor-help border-b border-dotted border-[#5BC0BE]/50 text-inherit no-underline decoration-transparent"
    >
      {label}
    </abbr>
  )
}
