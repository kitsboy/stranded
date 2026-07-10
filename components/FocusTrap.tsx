'use client'

import { useEffect, useRef, type ReactNode } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Lightweight focus trap for modal dialogs.
 * - Restores focus on unmount
 * - Traps Tab / Shift+Tab within container
 * - Escape calls onEscape
 */
export default function FocusTrap({
  active = true,
  onEscape,
  children,
  className,
  initialFocus = true,
}: {
  active?: boolean
  onEscape?: () => void
  children: ReactNode
  className?: string
  initialFocus?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    prevFocus.current = document.activeElement as HTMLElement | null
    const root = rootRef.current
    if (!root) return

    if (initialFocus) {
      const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE)
      const first = nodes[0]
      // Prefer first input/button that is not a pure icon close if possible
      const preferred =
        root.querySelector<HTMLElement>('input:not([type=hidden]), [data-autofocus]') || first
      preferred?.focus()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onEscape?.()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        el => !el.hasAttribute('disabled') && el.offsetParent !== null
      )
      if (!nodes.length) {
        e.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first || !root.contains(document.activeElement)) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      prevFocus.current?.focus?.()
    }
  }, [active, onEscape, initialFocus])

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  )
}
