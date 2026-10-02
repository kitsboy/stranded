/**
 * Official Canadian energy overlays. Colours are deliberately not the methane
 * score colours (purple / green / yellow / orange) and plants use a dark stroke
 * so they do not read as methane pins. Remote communities are rings, not fills.
 */

export type RenewableCatId =
  | 'wind'
  | 'solar'
  | 'hydro'
  | 'biomass'
  | 'tidal'
  | 'pumped'
  | 'geothermal'
  | 'other'
  | 'remote-fossil'
  | 'remote-hydro'
  | 'remote-grid'
  | 'remote-unknown'

export type RenewableCat = {
  id: RenewableCatId
  labelKey: string
  color: string
  /** plant = filled dot, remote = ring */
  shape: 'plant' | 'remote'
}

export const RENEWABLE_SOURCE_ID = 'renewable-energy'
export const RENEWABLE_DATA_URL = '/data/renewable-plants.geojson'
export const RENEWABLE_MANIFEST_URL = '/data/renewable-layers.json'

export const RENEWABLE_CATS: RenewableCat[] = [
  { id: 'wind', labelKey: 'mapOverlayWind', color: '#38bdf8', shape: 'plant' },
  { id: 'solar', labelKey: 'mapOverlaySolar', color: '#fb7185', shape: 'plant' },
  { id: 'hydro', labelKey: 'mapOverlayHydro', color: '#3b82f6', shape: 'plant' },
  { id: 'biomass', labelKey: 'mapOverlayBiomass', color: '#bef264', shape: 'plant' },
  { id: 'tidal', labelKey: 'mapOverlayTidal', color: '#14b8a6', shape: 'plant' },
  { id: 'pumped', labelKey: 'mapOverlayPumped', color: '#818cf8', shape: 'plant' },
  { id: 'geothermal', labelKey: 'mapOverlayGeothermal', color: '#e11d48', shape: 'plant' },
  { id: 'other', labelKey: 'mapOverlayOther', color: '#94a3b8', shape: 'plant' },
  { id: 'remote-fossil', labelKey: 'mapOverlayRemoteFossil', color: '#f9a8d4', shape: 'remote' },
  { id: 'remote-hydro', labelKey: 'mapOverlayRemoteHydro', color: '#67e8f9', shape: 'remote' },
  { id: 'remote-grid', labelKey: 'mapOverlayRemoteGrid', color: '#e5e7eb', shape: 'remote' },
  { id: 'remote-unknown', labelKey: 'mapOverlayRemoteUnknown', color: '#a8a29e', shape: 'remote' },
]

export function renewableLayerId(cat: string): string {
  return `renew-${cat}`
}

export function emptyOverlayState(): Record<RenewableCatId, boolean> {
  return {
    wind: false,
    solar: false,
    hydro: false,
    biomass: false,
    tidal: false,
    pumped: false,
    geothermal: false,
    other: false,
    'remote-fossil': false,
    'remote-hydro': false,
    'remote-grid': false,
    'remote-unknown': false,
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => (
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&quot;'
  ))
}

function fmtMw(n: unknown): string {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return ''
  return v >= 100 ? `${Math.round(v).toLocaleString()} MW` : `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW`
}

function row(label: string, value: unknown): string {
  const text = str(value)
  if (!text) return ''
  return `<div class="text-micro text-gray-300">${escapeHtml(label)}: ${escapeHtml(text)}</div>`
}

function str(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

/** Click / hover card. Every number is a field from the official file. */
export function renewablePopupHtml(props: Record<string, unknown> | null | undefined): string {
  const p = props || {}
  const name = escapeHtml(p.name || 'Unnamed')
  const cat = RENEWABLE_CATS.find((c) => c.id === p.cat)
  const color = cat?.color || '#94a3b8'
  const kind = p.kind === 'remote' ? 'Remote community' : 'Renewable plant'
  const mw = fmtMw(p.mw)
  const breakdown = [
    ['Hydro', p.hydroMw],
    ['Pumped storage', p.pumpedMw],
    ['Solar', p.solarMw],
    ['Wind', p.windMw],
    ['Biomass', p.bioMw],
    ['Geothermal', p.geoMw],
    ['Tidal', p.tidalMw],
  ].map(([label, value]) => {
    const text = fmtMw(value)
    return text ? `${label} ${text}` : ''
  }).filter(Boolean)

  const sourceUrl = str(p.sourceUrl)
  const source = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:#FF8C00">${escapeHtml(p.sourceTitle || 'Source')}</a>`
    : escapeHtml(p.sourceTitle || '')

  return [
    `<div class="text-xs font-semibold max-w-[240px]" style="color:${color}">${name}</div>`,
    `<div class="text-micro text-gray-300 mt-0.5">${kind}${mw ? ` · ${mw}` : ''}</div>`,
    p.kind === 'remote' ? row('Main power', p.mainPower) : '',
    p.altName ? row('Also called', p.altName) : '',
    row('Province', p.province),
    row('Place', p.place),
    row('Owner', p.owner),
    row('Operator', p.operator),
    breakdown.length ? `<div class="text-micro text-gray-300">${escapeHtml(breakdown.join(' · '))}</div>` : '',
    p.kind === 'remote' ? row('Fossil capacity', p.fossilKw ? `${Number(p.fossilKw).toLocaleString()} kW` : '') : '',
    p.kind === 'remote' ? row('Renewable capacity', p.renewableKw ? `${Number(p.renewableKw).toLocaleString()} kW` : '') : '',
    p.kind === 'remote' && num(p.annualFossilMwh) > 0 ? row('Fossil generation', `${Number(p.annualFossilMwh).toLocaleString()} MWh/yr`) : '',
    p.kind === 'remote' && p.fuelPrice != null && str(p.fuelPrice) !== '' ? row('Fuel price at site', `${p.fuelPrice} ${str(p.fuelUnits)}`) : '',
    p.kind === 'remote' && num(p.population) > 0 ? row('Population', Number(p.population).toLocaleString()) : '',
    row('Year-round road', p.roadAccess),
    row('Fly-in', p.flyIn),
    row('Utility', p.provider),
    row('Community', p.indigenous),
    row('Type', p.communityType),
    row('Status', p.status),
    row('Filing agency', p.agency),
    row('Reference period', p.period || p.vintage),
    `<div class="text-micro mt-1">${source}${p.licence ? ` · ${escapeHtml(p.licence)}` : ''}</div>`,
  ].filter(Boolean).join('')
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
