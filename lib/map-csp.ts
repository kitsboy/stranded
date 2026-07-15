/**
 * Map tile & font CSP allowlist (#414).
 * Keep in sync with:
 *   - `public/_headers` Content-Security-Policy (img-src / connect-src / font-src)
 *   - `components/Map.tsx` raster/DEM/glyph URLs
 */
export const MAP_CSP_IMG_DOMAINS = [
  'https://tile.openstreetmap.org',
  'https://*.tile.openstreetmap.org',
  'https://basemaps.cartocdn.com',
  'https://*.basemaps.cartocdn.com',
  'https://cartocdn.com',
  'https://*.cartocdn.com',
  'https://server.arcgisonline.com',
  'https://*.arcgisonline.com',
] as const

export const MAP_CSP_CONNECT_DOMAINS = [
  ...MAP_CSP_IMG_DOMAINS,
  'https://demotiles.maplibre.org',
  'https://s3.amazonaws.com',
  'https://elevation-tiles-prod.s3.amazonaws.com',
] as const

export const MAP_CSP_FONT_DOMAINS = [
  'https://demotiles.maplibre.org',
] as const

/** Tile URL patterns used by MapLibre sources in Map.tsx */
export const MAP_TILE_URL_PATTERNS = [
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
] as const

function hostMatchesPattern(host: string, pattern: string): boolean {
  if (pattern.startsWith('https://*.')) {
    const suffix = pattern.slice('https://*.'.length)
    return host === suffix || host.endsWith('.' + suffix)
  }
  if (pattern.startsWith('https://')) {
    return host === pattern.slice('https://'.length)
  }
  return false
}

/** Returns true when every Map.tsx tile URL host is covered by CSP connect/img lists. */
export function mapTileUrlsCoveredByCsp(
  tileUrls: readonly string[],
  imgDomains: readonly string[] = MAP_CSP_IMG_DOMAINS,
  connectDomains: readonly string[] = MAP_CSP_CONNECT_DOMAINS,
): boolean {
  const allowed = [...imgDomains, ...connectDomains]
  return tileUrls.every(url => {
    try {
      const host = new URL(url.replace(/\{[^}]+\}/g, '0')).hostname
      return allowed.some(p => hostMatchesPattern(host, p))
    } catch {
      return false
    }
  })
}