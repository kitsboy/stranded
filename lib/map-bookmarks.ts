const STORAGE_KEY = 'stranded-map-view-bookmarks'
const MAX_BOOKMARKS = 12

export type MapViewFilters = {
  minEmission: number
  maxEmission: number
  minScore: number
  provinces: string[]
  sourceTypes: string[]
  viewMode: 'precise' | 'dom' | 'native-clusters'
  mapStyle?: 'dark' | 'standard' | 'satellite' | 'terrain'
}

export type MapViewBookmark = {
  id: string
  name: string
  createdAt: string
  center: { lat: number; lng: number }
  zoom: number
  filters: MapViewFilters
}

function readAll(): MapViewBookmark[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(b => b?.id && b?.center) : []
  } catch {
    return []
  }
}

function writeAll(list: MapViewBookmark[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_BOOKMARKS)))
}

export function getMapViewBookmarks(): MapViewBookmark[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function saveMapViewBookmark(
  input: {
    name: string
    center: { lat: number; lng: number }
    zoom: number
    filters: MapViewFilters
  },
): MapViewBookmark {
  const bookmark: MapViewBookmark = {
    id: `mv-${Date.now().toString(36)}`,
    name: input.name.trim() || `View ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    center: input.center,
    zoom: input.zoom,
    filters: input.filters,
  }
  const list = readAll().filter(b => b.name !== bookmark.name)
  list.unshift(bookmark)
  writeAll(list)
  return bookmark
}

export function deleteMapViewBookmark(id: string): void {
  writeAll(readAll().filter(b => b.id !== id))
}

export function getMapViewBookmark(id: string): MapViewBookmark | null {
  return readAll().find(b => b.id === id) ?? null
}