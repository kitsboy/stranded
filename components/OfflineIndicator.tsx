'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { getOfflineCacheMeta } from '@/lib/offline-db'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false)
  const [cacheMeta, setCacheMeta] = useState({ ready: false, featureCount: 0, version: 'stranded-v11' })

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    getOfflineCacheMeta().then(setCacheMeta)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      className="fixed bottom-16 left-4 z-[90] flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] border border-white/15 bg-[#1e293b]/95 backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <WifiOff size={12} className="text-amber-400" />
      <span>
        Offline · cache {cacheMeta.version}
        {cacheMeta.ready ? ` (${cacheMeta.featureCount.toLocaleString()} sites)` : ' — site data may be unavailable'}
      </span>
    </div>
  )
}