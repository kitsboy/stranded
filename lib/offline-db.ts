const DB_NAME = 'stranded-offline'
const DB_VERSION = 1
const GEO_STORE = 'geojson'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(GEO_STORE)) {
        db.createObjectStore(GEO_STORE)
      }
    }
  })
}

export async function getCachedGeojson(): Promise<GeoJSON.FeatureCollection | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GEO_STORE, 'readonly')
      const req = tx.objectStore(GEO_STORE).get('sites')
      req.onsuccess = () => resolve((req.result as GeoJSON.FeatureCollection) || null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function setCachedGeojson(data: GeoJSON.FeatureCollection) {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return
  try {
    const db = await openDb()
    const tx = db.transaction(GEO_STORE, 'readwrite')
    tx.objectStore(GEO_STORE).put(data, 'sites')
  } catch {
    // silent — network cache is fallback
  }
}

export async function isOfflineReady(): Promise<boolean> {
  const cached = await getCachedGeojson()
  return !!(cached?.features?.length)
}