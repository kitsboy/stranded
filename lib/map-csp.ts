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
  'https://geoappext.nrcan.gc.ca',
  'https://maps-cartes.services.geo.ca',
] as const

export const MAP_CSP_CONNECT_DOMAINS = [
  ...MAP_CSP_IMG_DOMAINS,
  'https://s3.amazonaws.com',
  'https://elevation-tiles-prod.s3.amazonaws.com',
] as const

/** Glyph PBFs are self-hosted under /fonts/ (same-origin, covered by font-src 'self'). */
export const MAP_CSP_FONT_DOMAINS = [] as const

/**
 * Official NRCan map images. `{bbox-epsg-3857}` is filled by MapLibre.
 * Solar layers are painted: 0 = GHI, 1 = DNI.
 * Hydrokinetic export URLs stay listed so CSP still allows that host.
 * The map paints open water from the local shapefile and does not request those images.
 */
const NACEI_SOLAR_EXPORT =
  'https://geoappext.nrcan.gc.ca/arcgis/rest/services/NACEI/energy_resource_potential_of_north_america_en/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image&layers='
const HYDROKINETIC_EXPORT =
  'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/hydrokinetic_assessment_using_SAR_for_Diesel_communities_en/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image&layers='

export const ATLAS_RASTER_TILES = {
  'solar-ghi': `${NACEI_SOLAR_EXPORT}show:0`,
  'solar-dni': `${NACEI_SOLAR_EXPORT}show:1`,
  'hydrokinetic-water': `${HYDROKINETIC_EXPORT}show:1`,
  'hydrokinetic-possible': `${HYDROKINETIC_EXPORT}show:2`,
} as const

/** Tile URL patterns used by MapLibre sources in Map.tsx */
export const MAP_TILE_URL_PATTERNS = [
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
  ...Object.values(ATLAS_RASTER_TILES),
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