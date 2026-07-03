'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { EnrichedSite } from '@/lib/sites'

interface CommandPaletteProps {
  sites: EnrichedSite[]
  onSelectSite?: (site: EnrichedSite) => void
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ sites, onSelectSite, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<EnrichedSite[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const router = useRouter()

  // Load recent from localStorage (power-up)
  useEffect(() => {
    const saved = localStorage.getItem('stranded-recent')
    if (saved) setRecent(JSON.parse(saved))
  }, [])

  const saveRecent = (site: EnrichedSite) => {
    const updated = [site, ...recent.filter(r => r.id !== site.id)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem('stranded-recent', JSON.stringify(updated))
  }

  const results = useMemo(() => {
    if (!query.trim()) return sites.slice(0, 12)
    const q = query.toLowerCase()
    return sites
      .filter(s => {
        const p = s.properties
        return (
          (p.name || '').toLowerCase().includes(q) ||
          (p.province || '').toLowerCase().includes(q) ||
          (p.company || '').toLowerCase().includes(q) ||
          String(s.id).includes(q)
        )
      })
      .sort((a, b) => b.strandedScore - a.strandedScore)
      .slice(0, 14)
  }, [query, sites])

  // Preset quick actions (power-up for Command Palette)
  const presets = [
    { label: 'High Score (>70)', filter: (s: EnrichedSite) => s.strandedScore > 70 },
    { label: 'Top Emitters', filter: (s: EnrichedSite) => s.emission > 5000 },
    { label: 'Near Grid (<10km)', filter: (s: EnrichedSite) => (s.properties.distance_to_grid_km || 999) < 10 },
  ]

  const routes = [
    { label: 'Pitch Deck', href: '/pitch' },
    { label: 'Funding Wizard', href: '/funding' },
    { label: 'Partnerships', href: '/partnerships' },
    { label: 'Verticals', href: '/verticals' },
    { label: 'Marketing Hub', href: '/Marketing-Hub.html' },
  ]

  const handleSelect = useCallback((site: EnrichedSite) => {
    onClose()
    setQuery('')
    saveRecent(site)
    if (onSelectSite) {
      onSelectSite(site)
    } else {
      router.push(`/map?site=${encodeURIComponent(site.id)}`)
    }
  }, [onClose, onSelectSite, router])

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
      if (e.key === 'Enter' && results[selectedIdx]) handleSelect(results[selectedIdx])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose, results, selectedIdx, handleSelect])

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[18vh] bg-black/70 p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          className="command-palette w-full max-w-xl glass-strong rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-[#5BC0BE]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 2,611 sites by name, province, company... (⌘K)"
              className="flex-1 bg-transparent text-lg placeholder:text-gray-500 focus:outline-none"
            />
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>

          <div className="max-h-[420px] overflow-auto py-2 text-sm">
            {results.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400">No matches. Try a province or company name.</div>
            )}
            {results.map((site, idx) => {
              const p = site.properties
              const highlight = query.trim() && (p.name || '').toLowerCase().includes(query.toLowerCase())
              return (
                <button
                  key={site.id}
                  onClick={() => handleSelect(site)}
                  className={`w-full text-left px-5 py-3 flex items-center gap-4 group ${idx === selectedIdx ? 'bg-[#FF8C00]/15' : 'hover:bg-white/5'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white group-hover:text-[#FF8C00] truncate">{highlight ? <span>{p.name?.split(new RegExp(`(${query})`, 'i')).map((part, i) => part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="bg-[#FF8C00]/40 text-white">{part}</mark> : part)}</span> : (p.name || 'Unnamed site')}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {p.province} • {p.city || p.region || 'Remote'} • {p.source_type}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className={`stranded-score inline-block ${site.strandedScore > 72 ? 'score-high' : site.strandedScore > 45 ? 'score-med' : 'score-low'}`}>
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
                <button key={r.href} onClick={() => { onClose(); router.push(r.href) }} className="text-xs px-2 py-1 bg-[#FF8C00]/10 hover:bg-[#FF8C00]/20 rounded border border-[#FF8C00]/30 text-[#FF8C00]">
                  {r.label}
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

            {recent.length > 0 && (
              <>
                <div className="text-[10px] text-gray-400 mb-2">RECENT</div>
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
      </div>
    </AnimatePresence>
  )
}
