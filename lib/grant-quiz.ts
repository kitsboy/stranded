export type GrantQuizAnswers = {
  orgType: 'sme' | 'indigenous' | 'municipal' | 'research'
  province: string
  capexBand: 'under1m' | '1to5m' | '5to20m' | 'over20m'
  indigenousPartnership: boolean
  timeline: 'under12' | '12to36' | 'over36'
}

export type GrantMatch = {
  id: string
  name: string
  score: number
  maxGrant: number
  matchPct: number
  reason: string
}

const PROGRAMS = [
  { id: 'cleantech', name: 'CETA Cleantech SME', max: 5_000_000, match: 0.5, provinces: ['All'], orgs: ['sme', 'research'], indigenousBonus: 0 },
  { id: 'methane', name: 'Methane Reduction Fund', max: 10_000_000, match: 0.25, provinces: ['Alberta', 'Saskatchewan', 'British Columbia'], orgs: ['sme', 'municipal'], indigenousBonus: 5 },
  { id: 'indigenous', name: 'Indigenous Clean Energy', max: 3_000_000, match: 0.75, provinces: ['All'], orgs: ['indigenous'], indigenousBonus: 20 },
  { id: 'provincial-ab', name: 'Alberta Emissions Reduction', max: 8_000_000, match: 0.3, provinces: ['Alberta'], orgs: ['sme', 'municipal'], indigenousBonus: 8 },
  { id: 'provincial-on', name: 'Ontario Low-Carbon Fund', max: 6_000_000, match: 0.35, provinces: ['Ontario'], orgs: ['sme', 'municipal'], indigenousBonus: 5 },
  { id: 'horizon', name: 'Horizon Europe (research track)', max: 2_500_000, match: 0.6, provinces: ['All'], orgs: ['research'], indigenousBonus: 0 },
]

const CAPEX_MIN: Record<GrantQuizAnswers['capexBand'], number> = {
  under1m: 250_000,
  '1to5m': 1_000_000,
  '5to20m': 5_000_000,
  over20m: 20_000_000,
}

const QUIZ_STORAGE_KEY = 'stranded-grant-quiz-result'

export function matchGrants(answers: GrantQuizAnswers): GrantMatch[] {
  const capex = CAPEX_MIN[answers.capexBand]
  return PROGRAMS.map(p => {
    let score = 0
    const provinceOk = p.provinces.includes('All') || p.provinces.includes(answers.province)
    if (!provinceOk) return { id: p.id, name: p.name, score: 0, maxGrant: p.max, matchPct: p.match * 100, reason: 'Province not eligible' }
    if (p.orgs.includes(answers.orgType)) score += 40
    else score += 10
    if (answers.indigenousPartnership) score += p.indigenousBonus
    if (answers.timeline === 'under12') score += 15
    else if (answers.timeline === '12to36') score += 10
    else score += 5
    if (capex >= 1_000_000) score += 10
    if (capex >= 5_000_000) score += 10
    const estGrant = Math.min(capex * p.match, p.max)
    const reason =
      score >= 70 ? 'Strong fit — verify with program officer' :
      score >= 45 ? 'Possible fit — gather community + emissions data' :
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
    const data = JSON.parse(json) as { a?: GrantQuizAnswers; m?: string }
    if (!data?.a?.orgType) return null
    return { answers: data.a, topMatchId: data.m }
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