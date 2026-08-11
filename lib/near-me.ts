/**
 * Client-side "near me" helpers for map filters.
 */
import { haversineKm } from './map-url-state'

export type LatLng = { lat: number; lng: number }

export function sitesWithinRadius<T extends { geometry?: { coordinates?: number[] } }>(
  sites: T[],
  center: LatLng,
  radiusKm: number,
): (T & { distanceKm: number })[] {
  const out: (T & { distanceKm: number })[] = []
  for (const s of sites) {
    const coords = s.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const [lng, lat] = coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const distanceKm = haversineKm(center.lat, center.lng, lat, lng)
    if (distanceKm <= radiusKm) out.push({ ...s, distanceKm })
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm)
}

export function requestBrowserLocation(
  opts: PositionOptions = { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      opts,
    )
  })
}

export const NEAR_ME_RADIUS_OPTIONS_KM = [25, 50, 100, 250] as const
