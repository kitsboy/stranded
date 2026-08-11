import { safeGetItem, safeSetItem } from './safe-storage'

const KEY = 'stranded-saved-map-views'

export type SavedMapView = {
  id: string
  name: string
  createdAt: string
  state: {
    lat?: number
    lng?: number
    zoom?: number
    filters?: Record<string, string>
  }
}

function readAll(): SavedMapView[] {
  try {
    const raw = safeGetItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(views: SavedMapView[]) {
  safeSetItem(KEY, JSON.stringify(views.slice(0, 30)))
}

export function listSavedViews(): SavedMapView[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function saveView(name: string, state: SavedMapView['state']): SavedMapView {
  const view: SavedMapView = {
    id: `view-${Date.now().toString(36)}`,
    name: name.trim() || 'Untitled view',
    createdAt: new Date().toISOString(),
    state,
  }
  const all = readAll().filter(v => v.name !== view.name)
  all.unshift(view)
  writeAll(all)
  return view
}

export function deleteView(id: string): void {
  writeAll(readAll().filter(v => v.id !== id))
}

export function renameView(id: string, name: string): void {
  writeAll(readAll().map(v => (v.id === id ? { ...v, name: name.trim() || v.name } : v)))
}
