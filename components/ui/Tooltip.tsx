'use client'

import { useId, type ReactNode } from 'react'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

export default function Tooltip({ content, children, side = 'top', className = '' }: TooltipProps) {
  const id = useId()

  return (
    <span className={`tooltip-wrap relative inline-flex ${className}`.trim()}>
      <span
        tabIndex={0}
        aria-describedby={id}
        className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)] rounded"
      >
        {children}
      </span>
      <span
        id={id}
        role="tooltip"
        className={`tooltip-bubble tooltip-bubble--${side}`}
      >
        {content}
      </span>
    </span>
  )
}