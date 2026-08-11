'use client'

import { getFormula } from '@/lib/formula-catalog'

export default function FormulaTip({
  formulaId,
  children,
  className = '',
}: {
  formulaId: string
  children: React.ReactNode
  className?: string
}) {
  const f = getFormula(formulaId)
  const title = f ? `${f.title}\n${f.formula}\n${f.notes}` : formulaId

  return (
    <span
      className={`border-b border-dotted border-[#5BC0BE]/50 cursor-help ${className}`}
      title={title}
      data-formula={formulaId}
    >
      {children}
    </span>
  )
}
