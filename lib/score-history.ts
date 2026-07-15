const SCORE_HISTORY_KEY = 'stranded-score-history'
const MAX_VISITS = 7

export type ScoreVisit = { score: number; at: string }

export function recordScoreVisit(siteId: string, score: number) {
  if (typeof window === 'undefined') return
  try {
    const all: Record<string, ScoreVisit[]> = JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || '{}')
    const list = all[siteId] || []
    const last = list[list.length - 1]
    if (last && last.score === score && Date.now() - new Date(last.at).getTime() < 60_000) return
    list.push({ score, at: new Date().toISOString() })
    all[siteId] = list.slice(-MAX_VISITS)
    localStorage.setItem(SCORE_HISTORY_KEY, JSON.stringify(all))
  } catch { /* ignore */ }
}

export function getScoreHistory(siteId: string): number[] {
  if (typeof window === 'undefined') return []
  try {
    const all: Record<string, ScoreVisit[]> = JSON.parse(localStorage.getItem(SCORE_HISTORY_KEY) || '{}')
    return (all[siteId] || []).map(v => v.score)
  } catch {
    return []
  }
}