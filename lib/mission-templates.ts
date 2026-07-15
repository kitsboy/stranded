import type { EnrichedSite } from './sites'

export type MissionTemplate = {
  id: string
  name: string
  description: string
  minScore: number
  minEmission: number
  maxSites: number
  provinces?: string[]
  pick: (sites: EnrichedSite[]) => EnrichedSite[]
}

function buildPicker(template: Omit<MissionTemplate, 'pick'>): MissionTemplate['pick'] {
  return (sites: EnrichedSite[]) => {
    let pool = sites.filter(
      s =>
        s.strandedScore >= template.minScore &&
        s.emission >= template.minEmission &&
        (!template.provinces?.length ||
          template.provinces.includes(s.properties.province || '')),
    )
    pool = pool.sort((a, b) => b.strandedScore - a.strandedScore)
    return pool.slice(0, template.maxSites)
  }
}

const TEMPLATE_DEFS: Omit<MissionTemplate, 'pick'>[] = [
  {
    id: 'elite-national',
    name: 'Elite National',
    description: 'Top Stranded Score sites across Canada',
    minScore: 85,
    minEmission: 500,
    maxSites: 12,
  },
  {
    id: 'alberta-high',
    name: 'Alberta High Emitters',
    description: 'Large vent rates in Alberta with strong scores',
    minScore: 65,
    minEmission: 3000,
    maxSites: 10,
    provinces: ['Alberta'],
  },
  {
    id: 'bc-landfill',
    name: 'BC Landfill Cluster',
    description: 'British Columbia landfill and waste sites',
    minScore: 45,
    minEmission: 800,
    maxSites: 8,
    provinces: ['British Columbia'],
  },
  {
    id: 'near-grid',
    name: 'Near Grid Quick Wins',
    description: 'Strong connectivity proxy + medium+ scores',
    minScore: 55,
    minEmission: 400,
    maxSites: 15,
  },
]

export const MISSION_TEMPLATES: MissionTemplate[] = TEMPLATE_DEFS.map(def => ({
  ...def,
  pick: buildPicker(def),
}))

export function sitesForMissionTemplate(
  sites: EnrichedSite[],
  template: MissionTemplate,
): EnrichedSite[] {
  return template.pick(sites)
}

export function getMissionTemplate(id: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES.find(t => t.id === id)
}