'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import type { LiveStats } from '@/types/live-stats'

type ChangelogSection = {
  version: string
  date: string
  body: string
  lines: string[]
}

function parseChangelog(content: string): ChangelogSection[] {
  const sections: ChangelogSection[] = []
  const blocks = content.split(/\n(?=## \[)/)

  for (const block of blocks) {
    const header = block.match(/^## \[([^\]]+)\]\s*[—–-]\s*([^\n]+)/)
    if (!header) continue
    const body = block.slice(header[0].length).trim()
    const lines = body.split('\n').filter(l => l.trim().length > 0)
    sections.push({
      version: header[1].trim(),
      date: header[2].trim(),
      body,
      lines,
    })
  }

  return sections
}

export default function ChangelogView({ initialContent }: { initialContent: string }) {
  const [version, setVersion] = useState<string | null>(null)
  const [buildId, setBuildId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const sections = useMemo(() => parseChangelog(initialContent), [initialContent])

  useEffect(() => {
    fetch('/data/live-stats.json')
      .then(r => r.json())
      .then((s: LiveStats) => {
        setVersion(s.version)
        setBuildId(s.buildId ?? null)
        if (sections.length) {
          setExpanded({ [sections[0].version]: true })
        }
      })
      .catch(() => {
        if (sections.length) setExpanded({ [sections[0].version]: true })
      })
  }, [sections])

  const toggle = (v: string) => {
    setExpanded(prev => ({ ...prev, [v]: !prev[v] }))
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Changelog' }]} />
      <h1 className="text-3xl font-bold mb-2">Changelog</h1>
      {version && (
        <p className="text-sm text-gray-400 mb-6">
          Live deploy: <span className="font-mono text-[#FF8C00]">v{version}</span>
          {buildId && <span className="text-gray-500"> · build {buildId}</span>}
          <span className="text-gray-600"> — from live-stats.json</span>
        </p>
      )}

      {sections.length > 0 ? (
        <div className="space-y-3" data-testid="changelog-sections">
          {sections.map((section, idx) => {
            const isOpen = expanded[section.version] ?? idx < 2
            const bulletCount = section.lines.filter(l => /^[-*]/.test(l.trim())).length
            return (
              <section
                key={section.version}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(section.version)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition"
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <ChevronDown size={18} className="text-[#FF8C00] shrink-0" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#FF8C00] font-mono">[{section.version}]</div>
                    <div className="text-xs text-gray-500">{section.date}{bulletCount ? ` · ${bulletCount} items` : ''}</div>
                  </div>
                  {section.version === version && (
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full border border-[#34D399]/30 text-[#34D399]">
                      current
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                    {section.lines.map((line, i) => {
                      const trimmed = line.trim()
                      if (trimmed.startsWith('### ')) {
                        return <h3 key={i} className="text-[#5BC0BE] font-semibold mt-3 mb-1">{trimmed.slice(4)}</h3>
                      }
                      if (trimmed.startsWith('- **') || trimmed.startsWith('- ')) {
                        return (
                          <div key={i} className="flex gap-2 my-1">
                            <span className="text-[#FF8C00] shrink-0">·</span>
                            <span>{trimmed.replace(/^-\s*/, '')}</span>
                          </div>
                        )
                      }
                      if (trimmed.length === 0) return null
                      return <p key={i} className="my-1 text-gray-400">{trimmed}</p>
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">{initialContent}</pre>
      )}

      <p className="mt-8 text-xs text-gray-500">
        Full git history on{' '}
        <Link href="https://github.com/kitsboy/stranded" className="link-animated" target="_blank" rel="noreferrer">
          GitHub
        </Link>
        .
      </p>
    </div>
  )
}