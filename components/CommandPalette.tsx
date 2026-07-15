'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EnrichedSite, scoreTierClass } from '@/lib/sites'
import { searchSites, SITE_SEARCH_PRESETS } from '@/lib/site-search'
import { useLocale } from '@/lib/useLocale'
import { getBookmarks } from '@/lib/bookmarks'
import { PROVINCE_CODES } from '@/lib/provinces'
import { getRecentCommands, recordRecentCommand } from '@/lib/command-history'
import RecentSites from '@/components/RecentSites'
import FocusTrap from './FocusTrap'

interface CommandPaletteProps {
  sites: EnrichedSite[]
  onSelectSite?: (site: EnrichedSite) => void
  open: boolean
  onClose: () => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

export default function CommandPalette({ sites, onSelectSite, open, onClose, loading = false, error = null, onRetry }: CommandPaletteProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<EnrichedSite[]>([])
  const [recentCommands, setRecentCommands] = useState<ReturnType<typeof getRecentCommands>>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const router = useRouter()

  // Load recent from localStorage (power-up)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stranded-recent')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setRecent(parsed)
      }
    } catch {
      localStorage.removeItem('stranded-recent')
    }
    setRecentCommands(getRecentCommands())
  }, [open])

  const saveRecent = (site: EnrichedSite) => {
    const updated = [site, ...recent.filter(r => r.id !== site.id)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem('stranded-recent', JSON.stringify(updated))
  }

  const searchMatches = useMemo(() => searchSites(sites, query, 14), [query, sites])
  const matchTypes = useMemo(() => {
    const map = new Map<string, string>()
    searchMatches.forEach(m => map.set(m.site.id, m.matchType))
    return map
  }, [searchMatches])

  const results = useMemo(
    () => (query.trim() ? searchMatches.map(m => m.site) : sites.slice(0, 12)),
    [query, sites, searchMatches],
  )

  const presets = SITE_SEARCH_PRESETS

  const provinceJumps = PROVINCE_CODES.map(p => ({
    label: `${p.code} — ${p.name}`,
    href: `/map?province=${encodeURIComponent(p.name)}`,
  }))

  const routes = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Pitch Deck', href: '/pitch' },
    { label: 'Bookmarks', href: '/bookmarks' },
    { label: 'Provinces', href: '/provinces' },
    { label: 'Funding Wizard', href: '/funding' },
    { label: 'Partnerships', href: '/partnerships' },
    { label: 'Verticals', href: '/verticals' },
    { label: 'Methodology', href: '/methodology' },
    { label: 'Global', href: '/global' },
    { label: 'Benchmarks', href: '/benchmarks' },
    { label: 'Marketing Hub', href: '/Marketing-Hub.html' },
  ]

  const bookmarkIds = typeof window !== 'undefined' ? getBookmarks() : []
  const bookmarkSites = bookmarkIds.map(id => sites.find(s => s.id === id)).filter(Boolean) as EnrichedSite[]

  const handleSelect = useCallback((site: EnrichedSite) => {
    onClose()
    setQuery('')
    const updated = [site, ...recent.filter(r => r.id !== site.id)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem('stranded-recent', JSON.stringify(updated))
    recordRecentCommand({ id: `site:${site.id}`, label: site.properties.name || site.id, kind: 'site' })
    if (onSelectSite) {
      onSelectSite(site)
    } else {
      router.push(`/map?site=${encodeURIComponent(site.id)}`)
    }
  }, [onClose, onSelectSite, router, recent])

  const runRoute = (href: string, label: string) => {
    recordRecentCommand({ id: `route:${href}`, label, kind: 'route' })
    onClose()
    router.push(href)
  }

  useEffect(() => { setSelectedIdx(0) }, [query, results.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) onClose()
        else window.dispatchEvent(new CustomEvent('open-command-palette'))
      }
      if (!open) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && !loading && results[selectedIdx]) handleSelect(results[selectedIdx])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose, results, selectedIdx, handleSelect, loading])

  if (!open) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[300] flex items-start justify-center pt-[18vh] bg-black/70 p-4"
        onClick={onClose}
        role="presentation"
      >
        <FocusTrap active onEscape={onClose} className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="command-palette w-full max-w-xl glass-strong rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-[#5BC0BE]" aria-hidden />
            <h2 id="command-palette-title" className="sr-only">Search sites</h2>
            <input
              autoFocus
              data-autofocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, GHGRP ID (G12345), NAICS, province… (⌘K)"
              aria-label="Search sites by name, province, or company"
              className="flex-1 bg-transparent text-lg placeholder:text-gray-500 focus:outline-none focus:ring-0"
            />
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close search"><X size={20} /></button>
          </div>

          <div className="max-h-[420px] overflow-auto py-2 text-sm" role="listbox" aria-label="Search results">
            {loading && (
              <div className="px-5 py-8 text-center text-gray-400" role="status">Loading sites…</div>
            )}
            {error && !loading && (
              <div className="px-5 py-8 text-center text-red-400 space-y-2" role="alert">
                <p>{error}</p>
                {onRetry && (
                  <button type="button" onClick={onRetry} className="text-sm text-[#FF8C00] underline">Retry</button>
                )}
              </div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400">{t('cmdNoMatches')}</div>
            )}
            {!loading && !error && results.map((site, idx) => {
              const p = site.properties
              const highlight = query.trim() && (p.name || '').toLowerCase().includes(query.toLowerCase())
              return (
                <button
                  key={site.id}
                  type="button"
                  role="option"
                  aria-selected={idx === selectedIdx}
                  onClick={() => handleSelect(site)}
                  className={`w-full text-left px-5 py-3 flex items-center gap-4 group ${idx === selectedIdx ? 'bg-[#FF8C00]/15' : 'hover:bg-white/5'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-[#FF8C00] truncate">{highlight ? <span>{p.name?.split(new RegExp(`(${query})`, 'i')).map((part, i) => part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-[#FF8C00]/40 text-white">{part}</mark> : part)}</span> : (p.name || 'Unnamed site')}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {p.province} • {p.city || p.region || 'Remote'} • {p.source_type}
                      {p.ghgrp_id && <span className="ml-1 text-[#5BC0BE]">{p.ghgrp_id}</span>}
                      {p.naics_code && <span className="ml-1">NAICS {p.naics_code}</span>}
                      {matchTypes.get(site.id) === 'ghgrp' && <span className="ml-1 text-[#FF8C00]">GHGRP match</span>}
                      {matchTypes.get(site.id) === 'naics' && <span className="ml-1 text-[#FF8C00]">NAICS match</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className={`stranded-score inline-block ${scoreTierClass(site.strandedScore)}`}>
                        {site.strandedScore}
                      </div>
                    </div>
                    <div className="text-xs text-[#5BC0BE] font-mono tabular-nums">
                      {site.emission.toLocaleString()} kg/d
                    </div>
                    <MapPin className="w-4 h-4 text-gray-500 group-hover:text-[#FF8C00]" />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="px-5 py-2 border-t border-white/10">
            <div className="text-[10px] text-gray-400 mb-2">PAGES</div>
            <div className="flex flex-wrap gap-2">
              {routes.map(r => (
                <button key={r.href} onClick={() => runRoute(r.href, r.label)} className="text-xs px-2 py-1 bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 rounded border border-[#FF8C00]/30 text-[#FF8C00]">
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-2 border-t border-white/10">
            <div className="text-[10px] text-gray-400 mb-2">PROVINCES (13)</div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-auto">
              {provinceJumps.map(p => (
                <button
                  key={p.href}
                  type="button"
                  onClick={() => runRoute(p.href, p.label)}
                  className="text-[10px] px-2 py-1 bg-[#5BC0BE]/10 hover:bg-[#5BC0BE]/20 rounded border border-[#5BC0BE]/25 text-[#5BC0BE]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-3 border-t border-white/10">
            <div className="text-[10px] text-gray-400 mb-2">QUICK PRESETS</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {presets.map((p, i) => (
                <button key={i} onClick={() => {
                  // Apply preset by navigating with filters or just show filtered results
                  const filtered = sites.filter(p.filter).slice(0, 5)
                  if (filtered.length) handleSelect(filtered[0])
                }} className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10">
                  {p.label}
                </button>
              ))}
            </div>

            {bookmarkSites.length > 0 && (
              <>
                <div className="text-[10px] text-gray-400 mb-2">BOOKMARKS</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {bookmarkSites.slice(0, 5).map(site => (
                    <button key={site.id} onClick={() => handleSelect(site)} className="text-xs px-2 py-1 bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 rounded border border-[#FF8C00]/30 truncate max-w-[140px]">
                      ★ {site.properties.name || site.id}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="mb-3">
              <RecentSites
                compact
                max={8}
                onSelect={entry => {
                  const site = sites.find(s => s.id === entry.id)
                  if (site) handleSelect(site)
                  else runRoute(`/map?site=${encodeURIComponent(entry.id)}`, entry.name)
                }}
              />
            </div>

            {recentCommands.length > 0 && (
              <>
                <div className="text-[10px] text-gray-400 mb-2">RECENT COMMANDS</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {recentCommands.map(cmd => (
                    <button
                      key={cmd.id + cmd.at}
                      type="button"
                      onClick={() => {
                        if (cmd.kind === 'route') {
                          const href = cmd.id.replace(/^route:/, '')
                          runRoute(href, cmd.label)
                        } else if (cmd.kind === 'site') {
                          const siteId = cmd.id.replace(/^site:/, '')
                          const site = sites.find(s => s.id === siteId)
                          if (site) handleSelect(site)
                        }
                      }}
                      className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 truncate max-w-[160px]"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {recent.length > 0 && (
              <>
                <div className="text-[10px] text-gray-400 mb-2">LEGACY RECENT</div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((site, i) => (
                    <button key={i} onClick={() => handleSelect(site)} className="text-xs px-2 py-1 bg-white/5 hover:bg-[#FF8C00]/20 rounded border border-white/10 truncate max-w-[140px]">
                      {site.properties.name || site.id}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="px-5 py-3 border-t border-white/10 text-[10px] text-gray-500 flex items-center gap-2">
            <div>Press <kbd className="px-1.5 py-px bg-white/10 rounded">↑↓</kbd> to navigate • <kbd className="px-1.5 py-px bg-white/10 rounded">⏎</kbd> to fly to site</div>
            <div className="flex-1" />
            <div>ESC to close</div>
          </div>
        </motion.div>
        </FocusTrap>
      </div>
    </AnimatePresence>
  )
}
