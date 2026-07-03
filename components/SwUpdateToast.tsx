'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function SwUpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(worker)
            toast('New version available', {
              description: 'Refresh to get the latest Stranded data.',
              action: { label: 'Refresh', onClick: () => window.location.reload() },
              duration: Infinity,
            })
          }
        })
      })
    }).catch(() => {})
  }, [])

  return null
}