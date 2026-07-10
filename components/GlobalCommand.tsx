'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import CommandPalette from './CommandPalette'
import { loadSites, EnrichedSite } from '@/lib/sites'

export default function GlobalCommand() {
  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sitesLen = useRef(0)
  const loadingRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    sitesLen.current = sites.length
  }, [sites.length])

  const ensureSites = useCallback(() => {
    if (sitesLen.current > 0 || loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    loadSites()
      .then(data => {
        setSites(data)
        setLoading(false)
        loadingRef.current = false
      })
      .catch(() => {
        setLoading(false)
        loadingRef.current = false
        setError('Could not load sites')
      })
  }, [])

  useEffect(() => {
    const handler = () => {
      setOpen(true)
      ensureSites()
    }
    window.addEventListener('open-command-palette', handler)
    return () => window.removeEventListener('open-command-palette', handler)
  }, [ensureSites])

  const handleSelect = (site: EnrichedSite) => {
    setOpen(false)
    router.push(`/map?site=${encodeURIComponent(site.id)}`)
  }

  return (
    <CommandPalette
      sites={sites}
      open={open}
      onClose={() => setOpen(false)}
      onSelectSite={handleSelect}
      loading={loading}
      error={error}
      onRetry={ensureSites}
    />
  )
}
