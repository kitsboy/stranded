const BOOKMARKS_KEY = 'stranded-bookmarks'
const BOOKMARKS_V2_KEY = 'stranded-bookmarks-v2'
const NOTES_KEY = 'stranded-site-notes'
const FILTER_PRESETS_KEY = 'stranded-filter-presets'
const EDU_PROGRESS_KEY = 'stranded-edu-progress'

export type BookmarkEntry = { siteId: string; tag?: string }

function migrateBookmarks(): BookmarkEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const v2 = localStorage.getItem(BOOKMARKS_V2_KEY)
    if (v2) {
      const parsed = JSON.parse(v2)
      if (Array.isArray(parsed)) return parsed.filter(e => e?.siteId)
    }
    const legacy = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')
    if (Array.isArray(legacy) && legacy.length) {
      const migrated: BookmarkEntry[] = legacy.map((id: string) => ({ siteId: id }))
      localStorage.setItem(BOOKMARKS_V2_KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch { /* ignore */ }
  return []
}

function saveBookmarks(entries: BookmarkEntry[]) {
  localStorage.setItem(BOOKMARKS_V2_KEY, JSON.stringify(entries))
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(entries.map(e => e.siteId)))
}

export function getBookmarkEntries(): BookmarkEntry[] {
  return migrateBookmarks()
}

export function getBookmarks(): string[] {
  return getBookmarkEntries().map(e => e.siteId)
}

export function getBookmarkTag(siteId: string): string {
  return getBookmarkEntries().find(e => e.siteId === siteId)?.tag ?? ''
}

export function setBookmarkTag(siteId: string, tag: string) {
  const entries = getBookmarkEntries()
  const idx = entries.findIndex(e => e.siteId === siteId)
  if (idx < 0) return
  entries[idx] = { ...entries[idx], tag: tag.trim() || undefined }
  saveBookmarks(entries)
}

export function getBookmarkTags(): string[] {
  return Array.from(new Set(getBookmarkEntries().map(e => e.tag).filter(Boolean) as string[])).sort()
}

export function toggleBookmark(siteId: string, tag?: string): boolean {
  const list = getBookmarkEntries()
  const has = list.some(e => e.siteId === siteId)
  const next = has
    ? list.filter(e => e.siteId !== siteId)
    : [...list, { siteId, tag: tag?.trim() || undefined }]
  saveBookmarks(next)
  return !has
}

export function getSiteNote(siteId: string): string {
  if (typeof window === 'undefined') return ''
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
    return notes[siteId] || ''
  } catch { return '' }
}

export function setSiteNote(siteId: string, note: string) {
  if (typeof window === 'undefined') return
  let notes: Record<string, string> = {}
  try {
    notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
    if (!notes || typeof notes !== 'object') notes = {}
  } catch {
    notes = {}
  }
  notes[siteId] = note
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export type FilterPreset = { name: string; minScore: number; minEmission: number; provinces: string[] }

export function getFilterPresets(): FilterPreset[] {
  try { return JSON.parse(localStorage.getItem(FILTER_PRESETS_KEY) || '[]') } catch { return [] }
}

export function saveFilterPreset(preset: FilterPreset) {
  const list = getFilterPresets().filter(p => p.name !== preset.name)
  list.push(preset)
  localStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(list.slice(-8)))
}

export function getEduProgress(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(EDU_PROGRESS_KEY) || '{}') } catch { return {} }
}

export function markEduSection(id: string) {
  const p = getEduProgress()
  p[id] = true
  localStorage.setItem(EDU_PROGRESS_KEY, JSON.stringify(p))
}

export type BookmarksExport = {
  version: 2
  exportedAt: string
  entries: BookmarkEntry[]
  notes: Record<string, string>
  presets: FilterPreset[]
}

export function exportBookmarksJson(): string {
  let notes: Record<string, string> = {}
  try { notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') } catch { /* ignore */ }
  const payload: BookmarksExport = {
    version: 2,
    exportedAt: new Date().toISOString(),
    entries: getBookmarkEntries(),
    notes,
    presets: getFilterPresets(),
  }
  return JSON.stringify(payload, null, 2)
}

export function importBookmarksJson(json: string): { bookmarks: number; notes: number; presets: number } {
  const data = JSON.parse(json) as BookmarksExport & { bookmarks?: string[] }
  if (!data) throw new Error('Invalid bookmarks export format')
  let entries: BookmarkEntry[] = []
  if (data.version === 2 && Array.isArray(data.entries)) {
    entries = data.entries.filter(e => e?.siteId)
  } else if (Array.isArray(data.bookmarks)) {
    entries = data.bookmarks.filter(id => typeof id === 'string').map(siteId => ({ siteId }))
  } else {
    throw new Error('Invalid bookmarks export format')
  }
  saveBookmarks(entries)
  const notes = data.notes && typeof data.notes === 'object' ? data.notes : {}
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  const presets = Array.isArray(data.presets) ? data.presets.slice(-8) : []
  localStorage.setItem(FILTER_PRESETS_KEY, JSON.stringify(presets))
  return { bookmarks: entries.length, notes: Object.keys(notes).length, presets: presets.length }
}