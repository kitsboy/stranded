export interface StrandedSite {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  properties: {
    // Core identifiers
    id?: string
    ghgrp_id?: string
    name: string
    company?: string
    
    // Location
    province: string
    city?: string
    region?: string
    
    // Emission data
    emission_rate_kg_day?: number
    ch4_tonnes_year?: number
    co2e_tons_year?: number
    
    // Classification
    source_type: string
    naics_code?: string
    naics_description?: string
    
    // Metadata
    reference_year?: number
    /**
     * Most recent year this facility reported to the GHGRP. Equals
     * `reference_year` after a refresh run (the figures are the freshest
     * available); a value well below the newest reporting year means the site
     * may be closed or re-permitted — never present its figures as current.
     */
    last_reported_year?: number
    data_source?: string
    confidence?: 'high' | 'medium' | 'low'

    // Flux breakdown (ECCC "Emissions by Source")
    /** Fugitive CH₄ reported as venting, kg/day (0 when the facility reports none). */
    ch4_vented_kg_day?: number
    /** Fugitive CH₄ sent to flare, kg/day (0 when the facility reports none). */
    ch4_flared_kg_day?: number
    /**
     * venting | flaring | both | none | unknown
     * 'none' = the facility files Emissions-by-Source rows but reports no
     * venting and no flaring (it may still report fugitive/leakage, which ECCC
     * publishes as the separate EC_FugitiveEmissions category).
     * 'unknown' = the facility has no Emissions-by-Source rows at all (the file
     * only covers 2022-present, so stale sites are legitimately unknown).
     */
    flux_status?: 'venting' | 'flaring' | 'both' | 'none' | 'unknown'
    /** Share of reported venting+flaring CH₄ sent to flare, 0-100. */
    flare_share_pct?: number
    /** Reporting year the venting/flaring figures come from; null when unknown. */
    flux_reference_year?: number | null

    // Infrastructure
    distance_to_grid_km?: number
    grid_operator?: string
    internet_type?: string
    
    // Mining assessment
    complexity_score?: 'easy' | 'moderate' | 'hard'
    recommended_approach?: string
    
    // Status
    status?: 'active' | 'inactive' | 'captured'
  }
}

export interface StrandedSitesCollection {
  type: 'FeatureCollection'
  features: StrandedSite[]
}