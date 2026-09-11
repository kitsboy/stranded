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
    /**
     * Whether ECCC publishes a venting/flaring split for this facility at all.
     * 'not-applicable' = no fugitive source is reported for it (landfill gas is
     * reported under "Waste"), so a venting/flaring claim must NEVER be rendered.
     */
    flux_scope?: 'fugitive' | 'not-applicable'
    /** Fugitive CH₄ reported as venting, kg/day. null when the split is not published. */
    ch4_vented_kg_day?: number | null
    /** Fugitive CH₄ sent to flare, kg/day. null when the split is not published. */
    ch4_flared_kg_day?: number | null
    /**
     * venting | flaring | both      — the facility reports the fugitive split
     * none                          — reports the fugitive category, zero venting and zero flaring
     * not_reported                  — ECCC publishes no split for this facility (flux_scope 'not-applicable')
     * unknown                       — no Emissions-by-Source rows at all
     * Only venting/flaring/both may be shown to a user as a flaring/venting claim.
     */
    flux_status?: 'venting' | 'flaring' | 'both' | 'none' | 'not_reported' | 'unknown'
    /** Share of reported venting+flaring CH₄ sent to flare, 0-100. null when not published. */
    flare_share_pct?: number | null
    /** Reporting year the venting/flaring figures come from; null when not published. */
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