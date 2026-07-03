const BOOKMARKS_KEY = 'stranded-bookmarks'
const NOTES_KEY = 'stranded-site-notes'
const FILTER_PRESETS_KEY = 'stranded-filter-presets'
const EDU_PROGRESS_KEY = 'stranded-edu-progress'

export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]') } catch { return [] }
}

export function toggleBookmark(siteId: string): boolean {
  const list = getBookmarks()
  const has = list.includes(siteId)
  const next = has ? list.filter(id => id !== siteId) : [...list, siteId]
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
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
  const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
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