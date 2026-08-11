'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('stranded-pwa-dismissed') === '1') return

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setHidden(false)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  if (hidden || !deferred) return null

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 w-[min(420px,92vw)] rounded-2xl border border-[#5BC0BE]/40 bg-[#0f172a]/95 px-4 py-3 shadow-2xl backdrop-blur"
      data-testid="pwa-install-prompt"
      role="dialog"
      aria-label="Install app"
    >
      <p className="text-sm text-white mb-2">Install Stranded for offline map + bookmarks?</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl bg-[#FF8C00] text-black text-sm font-semibold py-2"
          onClick={async () => {
            await deferred.prompt()
            setHidden(true)
            setDeferred(null)
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-white/15 text-sm py-2 text-gray-300"
          onClick={() => {
            sessionStorage.setItem('stranded-pwa-dismissed', '1')
            setHidden(true)
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
