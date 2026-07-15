const NOTES_KEY = 'stranded-site-notes'

function loadNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const notes = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}')
    return notes && typeof notes === 'object' ? notes : {}
  } catch {
    return {}
  }
}

export function getSiteNote(siteId: string): string {
  return loadNotes()[siteId] || ''
}

export function setSiteNote(siteId: string, note: string): void {
  if (typeof window === 'undefined') return
  const notes = loadNotes()
  if (note.trim()) notes[siteId] = note
  else delete notes[siteId]
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export function getAllSiteNotes(): Record<string, string> {
  return loadNotes()
}

export function deleteSiteNote(siteId: string): void {
  setSiteNote(siteId, '')
}