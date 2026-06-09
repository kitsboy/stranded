'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CommandPalette from './CommandPalette'
import { loadSites, EnrichedSite } from '@/lib/sites'

export default function GlobalCommand() {
  const [open, setOpen] = useState(false)
  const [sites, setSites] = useState<EnrichedSite[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Listen for the global trigger (from Nav button or Cmd+K)
  useEffect(() => {
    const handler = () => {
      setOpen(true)
      // Lazy load the full dataset only when the user actually wants to search
      if (sites.length === 0 && !loading) {
        setLoading(true)
        loadSites()
          .then(data => {
            setSites(data)
            setLoading(false)
          })
          .catch(() => setLoading(false))
      }
    }

    window.addEventListener('open-command-palette', handler)
    return () => window.removeEventListener('open-command-palette', handler)
  }, [sites.length, loading])

  const handleSelect = (site: EnrichedSite) => {
    setOpen(false)
    // Always deep-link to the map with the site pre-selected.
    // The /map page already listens for ?site= and will fly + select.
    router.push(`/map?site=${encodeURIComponent(site.id)}`)
  }

  return (
    <CommandPalette
      sites={sites}
      open={open}
      onClose={() => setOpen(false)}
      onSelectSite={handleSelect}
    />
  )
}
