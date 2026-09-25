export type GrantQuizAnswers = {
  orgType: 'sme' | 'indigenous' | 'municipal' | 'research'
  province: string
  capexBand: 'under1m' | '1to5m' | '5to20m' | 'over20m'
  indigenousPartnership: boolean
  timeline: 'under12' | '12to36' | 'over36'
  energyType: 'gas' | 'ch4' | 'renew' | 'ccs' | 'hybrid'
  talent: 'domestic' | 'euTalent' | 'researchTeam'
  measurement: 'unmeasured' | 'measured' | 'ogmp'
  monetize: 'energyOnly' | 'carbon' | 'both'
}

export type GrantMatch = {
  id: string
  name: string
  score: number
  maxGrant: number
  matchPct: number
  reason: string
}

type Program = {
  id: string
  name: string
  max: number
  match: number
  provinces: string[]
  orgs: string[]
  indigenousBonus: number
  energy: string[]
  talentFriendly: boolean
  carbonFriendly: boolean
}

const PROGRAMS: Program[] = [
  { id: 'cleantech', name: 'CETA Cleantech SME', max: 5_000_000, match: 0.5, provinces: ['All'], orgs: ['sme', 'research'], indigenousBonus: 0, energy: ['gas', 'ch4', 'renew', 'ccs', 'hybrid'], talentFriendly: true, carbonFriendly: true },
  { id: 'methane', name: 'Methane Reduction Fund', max: 10_000_000, match: 0.25, provinces: ['Alberta', 'Saskatchewan', 'British Columbia'], orgs: ['sme', 'municipal'], indigenousBonus: 5, energy: ['gas', 'ch4'], talentFriendly: true, carbonFriendly: true },
  { id: 'indigenous', name: 'Indigenous Clean Energy', max: 3_000_000, match: 0.75, provinces: ['All'], orgs: ['indigenous'], indigenousBonus: 20, energy: ['gas', 'ch4', 'renew', 'hybrid'], talentFriendly: true, carbonFriendly: true },
  { id: 'provincial-ab', name: 'Alberta Emissions Reduction', max: 8_000_000, match: 0.3, provinces: ['Alberta'], orgs: ['sme', 'municipal'], indigenousBonus: 8, energy: ['gas', 'ch4', 'ccs', 'hybrid'], talentFriendly: true, carbonFriendly: true },
  { id: 'provincial-on', name: 'Ontario Low-Carbon Fund', max: 6_000_000, match: 0.35, provinces: ['Ontario'], orgs: ['sme', 'municipal'], indigenousBonus: 5, energy: ['gas', 'ch4', 'renew', 'hybrid'], talentFriendly: true, carbonFriendly: true },
  // EU — Horizon (research consortium) + Eurostars (SME R&D, our 2 direct EU pots)
  { id: 'horizon', name: 'Horizon Europe · Cluster 5 (research)', max: 15_000_000, match: 0.6, provinces: ['All'], orgs: ['research', 'sme'], indigenousBonus: 0, energy: ['gas', 'ch4', 'ccs', 'renew', 'hybrid'], talentFriendly: true, carbonFriendly: true },
  { id: 'eurostars', name: 'EUREKA / Eurostars (EU + Canada R&D)', max: 600_000, match: 0.5, provinces: ['All'], orgs: ['sme', 'research'], indigenousBonus: 0, energy: ['gas', 'ch4', 'ccs', 'renew', 'hybrid'], talentFriendly: true, carbonFriendly: true },
]

const CAPEX_MIN: Record<GrantQuizAnswers['capexBand'], number> = {
  under1m: 250_000,
  '1to5m': 1_000_000,
  '5to20m': 5_000_000,
  over20m: 20_000_000,
}

const QUIZ_STORAGE_KEY = 'stranded-grant-quiz-result'

export function matchGrants(answers: GrantQuizAnswers): GrantMatch[] {
  const capex = CAPEX_MIN[answers.capexBand] || 1_000_000
  const energy = answers.energyType || 'hybrid'
  const talent = answers.talent || 'domestic'
  const measurement = answers.measurement || 'unmeasured'
  const monetize = answers.monetize || 'energyOnly'
  return PROGRAMS.map(p => {
    let score = 0
    let notes: string[] = []
    const provinceOk = p.provinces.includes('All') || p.provinces.includes(answers.province)
    if (!provinceOk) return { id: p.id, name: p.name, score: 0, maxGrant: p.max, matchPct: p.match * 100, reason: 'Province not eligible' }
    if (p.orgs.includes(answers.orgType)) { score += 34; notes.push('org fit') } else score += 6
    if (answers.indigenousPartnership) { score += p.indigenousBonus; if (p.indigenousBonus > 0) notes.push('partnership bonus') }
    if (answers.timeline === 'under12') score += 10
    else if (answers.timeline === '12to36') score += 8
    else score += 4
    if (capex >= 1_000_000) score += 8
    if (capex >= 5_000_000) score += 8
    if (p.energy.includes(energy)) { score += 12; notes.push('energy fit') } else score += 2
    // foreign-EU talent: rewards R&D / research-linked programmes
    if (talent !== 'domestic' && p.talentFriendly) {
      score += (talent === 'researchTeam' ? 8 : 5)
      if (p.id === 'horizon' || p.id === 'eurostars') score += 6
    }
    // verified emissions + carbon monetization → EU-compliance / carbon niche fit
    if (monetize !== 'energyOnly' && p.carbonFriendly) { score += 8; notes.push('carbon revenue') }
    if (measurement !== 'unmeasured' && p.carbonFriendly) score += (measurement === 'ogmp' ? 7 : 4)
    const estGrant = Math.min(capex * p.match, p.max)
    const reason =
      score >= 70 ? 'Strong fit — verify with program officer' :
      score >= 45 ? 'Possible fit — gather emissions + partnership data' :
      'Low fit for current answers'
    return { id: p.id, name: p.name, score: Math.min(100, score), maxGrant: estGrant, matchPct: p.match * 100, reason }
  }).sort((a, b) => b.score - a.score)
}

export function saveGrantQuizResult(answers: GrantQuizAnswers, matches: GrantMatch[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ answers, matches, at: new Date().toISOString() }))
}

export function loadGrantQuizResult(): { answers: GrantQuizAnswers; matches: GrantMatch[]; at: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Compact base64url payload for shareable URL hash (#grant=...) */
export function encodeGrantQuizHash(answers: GrantQuizAnswers, topMatchId?: string): string {
  const payload = JSON.stringify({ a: answers, m: topMatchId })
  if (typeof btoa === 'undefined') return ''
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeGrantQuizHash(token: string): { answers: GrantQuizAnswers; topMatchId?: string } | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    const data = JSON.parse(json) as { a?: Partial<GrantQuizAnswers>; m?: string }
    if (!data?.a?.orgType) return null
    return {
      answers: {
        orgType: data.a.orgType!,
        province: data.a.province || 'Alberta',
        capexBand: data.a.capexBand || '1to5m',
        indigenousPartnership: data.a.indigenousPartnership ?? false,
        timeline: data.a.timeline || '12to36',
        energyType: (data.a as any).energyType || 'hybrid',
        talent: (data.a as any).talent || 'domestic',
        measurement: (data.a as any).measurement || 'unmeasured',
        monetize: (data.a as any).monetize || 'energyOnly',
      },
      topMatchId: data.m,
    }
  } catch {
    return null
  }
}

export function grantQuizShareUrl(answers: GrantQuizAnswers, matches: GrantMatch[], origin?: string): string {
  const top = matches.filter(m => m.score > 0)[0]
  const hash = encodeGrantQuizHash(answers, top?.id)
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://stranded.giveabit.io')
  return `${base}/funding#grant=${hash}`
}
