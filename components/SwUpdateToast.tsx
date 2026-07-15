'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useLocale } from '@/lib/useLocale'

export default function SwUpdateToast() {
  const { t } = useLocale()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let toastId: string | number | undefined

    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            if (toastId != null) toast.dismiss(toastId)
            toastId = toast(t('swUpdateTitle'), {
              description: t('swUpdateDesc'),
              action: {
                label: t('swUpdateAction'),
                onClick: () => {
                  worker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                },
              },
              duration: Infinity,
              id: 'stranded-sw-update',
            })
          }
        })
      })
    }).catch(() => {})
  }, [t])

  return null
}