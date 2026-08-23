'use client'

import { useEffect } from 'react'

/**
 * TooltipBinder — global binder for the family-standard `data-tip` / `data-tip-title`
 * pattern (design-tokens.json: hover-follow on desktop, tap on touch).
 * Mount once in the root layout; it re-scans the DOM after navigation events.
 */
export default function TooltipBinder() {
  useEffect(() => {
    let tipEl: HTMLDivElement | null = null

    const ensureTip = () => {
      if (!tipEl) {
        tipEl = document.createElement('div')
        tipEl.className = 'tip-bubble'
        tipEl.setAttribute('aria-hidden', 'true')
        document.body.appendChild(tipEl)
      }
      return tipEl
    }

    const bind = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>('[data-tip]').forEach((el) => {
        if (el.dataset.tipBound === '1') return
        el.dataset.tipBound = '1'

        const show = (e: MouseEvent) => {
          const tip = ensureTip()
          const t = el.dataset.tip || ''
          const tt = el.dataset.tipTitle
          tip.innerHTML = (tt ? `<div class="tip-b-title">${tt}</div>` : '') + t
          tip.classList.add('show')
          const r = el.getBoundingClientRect()
          const tw = tip.offsetWidth || 280
          const th = tip.offsetHeight || 80
          let x = r.left + r.width / 2 - tw / 2
          let y = r.top - th - 12
          if (x < 8) x = 8
          if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8
          if (y < 8) y = r.bottom + 12
          tip.style.left = `${x}px`
          tip.style.top = `${y}px`
        }
        const hide = () => ensureTip().classList.remove('show')

        el.addEventListener('mouseenter', show)
        el.addEventListener('mousemove', show)
        el.addEventListener('mouseleave', hide)
        el.addEventListener('focus', show as EventListener)
        el.addEventListener('blur', hide)
        el.addEventListener('click', (e) => {
          if ('ontouchstart' in window) {
            e.preventDefault()
            show(e)
            setTimeout(hide, 2500)
          }
        })
      })
    }

    bind(document)

    // Re-scan after route changes / dynamic content (Next App Router)
    const observer = new MutationObserver(() => bind(document))
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
