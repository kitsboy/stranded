'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useLocale } from '@/lib/useLocale'
import { tf } from '@/lib/i18n'

export default function SwUpdateToast() {
  const { locale, t } = useLocale()
  const [liveVersion, setLiveVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.version) setLiveVersion(String(data.version))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let toastId: string | number | undefined
    const version = liveVersion || 'latest'

    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            if (toastId != null) toast.dismiss(toastId)
            toastId = toast(tf(locale, 'swUpdateTitle', { version }), {
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
  }, [t, locale, liveVersion])

  return null
}