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
    data_source?: string
    confidence?: 'high' | 'medium' | 'low'
    
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