/** Site-level data quality flags and 0–100 grade (client-safe, pure). */

export type DataQualityFlag = {
  id: string
  severity: 'info' | 'warn' | 'error'
  label: string
  detail: string
}

export type DataQualityResult = {
  flags: DataQualityFlag[]
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
}

/** Map 0–100 score → letter grade. */
export function qualityGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  const s = Number.isFinite(score) ? score : 0
  if (s >= 85) return 'A'
  if (s >= 70) return 'B'
  if (s >= 50) return 'C'
  return 'D'
}

/**
 * Assess missing / weak fields on a site properties bag.
 * Optional `geometry` for coords; also reads props.geometry / props.coordinates.
 */
export function assessSiteDataQuality(
  props: Record<string, unknown>,
  geometry?: { coordinates?: number[] },
): DataQualityResult {
  const flags: DataQualityFlag[] = []
  let score = 100
  const p = props ?? {}

  const emission = p.emission_rate_kg_day ?? p.emission
  if (emission == null || !(Number(emission) > 0)) {
    flags.push({
      id: 'missing_emission',
      severity: 'error',
      label: 'Missing emission',
      detail: 'No emission_rate_kg_day',
    })
    score -= 25
  }

  if (!p.province) {
    flags.push({
      id: 'missing_province',
      severity: 'error',
      label: 'Missing province',
      detail: 'Province required for ranking',
    })
    score -= 15
  }

  if (!p.source_type) {
    flags.push({
      id: 'missing_source_type',
      severity: 'warn',
      label: 'Missing source type',
      detail: 'source_type empty',
    })
    score -= 10
  }

  if (!p.confidence) {
    flags.push({
      id: 'missing_confidence',
      severity: 'warn',
      label: 'Missing confidence',
      detail: 'confidence not set',
    })
    score -= 8
  } else if (p.confidence === 'low') {
    flags.push({
      id: 'low_confidence',
      severity: 'warn',
      label: 'Low confidence',
      detail: 'confidence=low',
    })
    score -= 10
  }

  if (p.distance_to_grid_km == null) {
    flags.push({
      id: 'missing_grid_distance',
      severity: 'info',
      label: 'Missing grid distance',
      detail: 'No measured distance_to_grid_km (may be inferred)',
    })
    score -= 5
  }

  const geom = geometry
    ?? (p.geometry as { coordinates?: number[] } | undefined)
  const coords =
    geom?.coordinates
    ?? (Array.isArray(p.coordinates) ? (p.coordinates as number[]) : undefined)

  if (coords && coords.length >= 2) {
    const lng = Number(coords[0])
    const lat = Number(coords[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01)) {
      flags.push({
        id: 'missing_coords',
        severity: 'error',
        label: 'Invalid coordinates',
        detail: 'Lat/lng missing or near 0,0',
      })
      score -= 20
    }
  }

  const year = Number(p.reference_year)
  if (Number.isFinite(year) && year < 2020) {
    flags.push({
      id: 'old_reference_year',
      severity: 'warn',
      label: 'Old reference year',
      detail: `reference_year=${year}`,
    })
    score -= 8
  }

  if (!p.name && !p.company) {
    flags.push({
      id: 'missing_company_name',
      severity: 'warn',
      label: 'Missing company/name',
      detail: 'both company and name are empty',
    })
    score -= 8
  } else {
    if (!p.name) {
      flags.push({
        id: 'missing_name',
        severity: 'info',
        label: 'Missing name',
        detail: 'Site name empty',
      })
      score -= 3
    }
    if (!p.company) {
      flags.push({
        id: 'missing_company',
        severity: 'info',
        label: 'Missing company',
        detail: 'Operator field empty',
      })
      score -= 3
    }
  }

  score = Math.max(0, Math.min(100, score))
  return { flags, score, grade: qualityGrade(score) }
}
