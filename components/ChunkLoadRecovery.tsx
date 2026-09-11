'use client'

import { useEffect } from 'react'

/**
 * Stale-build recovery.
 *
 * After a deploy, a browser that is still holding an older document requests the
 * chunk hashes of the build it loaded. The newest deploy no longer has them, so
 * Cloudflare answers with its HTML error page (text/html) and the browser refuses
 * to execute it — the client-side navigation dies with a "Refused to execute
 * script … MIME type ('text/html') is not executable" console error. This is the
 * "stale build" class Cam has been bitten by, and it is invisible to a fresh
 * visitor (they get the new build) — only someone who kept a tab open across a
 * deploy hits it.
 *
 * The fix is a one-shot hard reload: the moment a chunk fails to load, reload the
 * page so the browser fetches the current build. The sessionStorage guard stops a
 * reload loop if the new build is itself broken.
 */
const GUARD_KEY = 'stranded-chunk-reload-at'

const CHUNK_RE =
  /ChunkLoadError|Loading chunk \d+ failed|Loading CSS chunk|_next\/static\/chunks\/.*(404|MIME|text\/html)/i

function isChunkFailure(message: string): boolean {
  return CHUNK_RE.test(message)
}

export default function ChunkLoadRecovery() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reloadOnce = () => {
      try {
        const last = Number(sessionStorage.getItem(GUARD_KEY) || 0)
        const now = Date.now()
        // Only auto-reload once per 30s — if the new build is itself broken we
        // must not loop; the ErrorBoundary / user can take over.
        if (now - last < 30_000) return
        sessionStorage.setItem(GUARD_KEY, String(now))
      } catch {
        /* storage blocked — still attempt the reload */
      }
      window.location.reload()
    }

    const onError = (e: ErrorEvent) => {
      const src = e.target instanceof HTMLScriptElement ? e.target.src : ''
      if (isChunkFailure(e.message) || (src && /_next\/static\/chunks\//.test(src))) {
        reloadOnce()
      }
    }

    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason)
      if (isChunkFailure(msg)) reloadOnce()
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
