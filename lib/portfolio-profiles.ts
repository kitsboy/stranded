const PROFILES_KEY = 'stranded-portfolio-profiles'

export type PortfolioProfile = { id: string; name: string; siteIds: string[]; updatedAt: string }

export function getPortfolioProfiles(): PortfolioProfile[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]') } catch { return [] }
}

export function savePortfolioProfile(name: string, siteIds: string[]) {
  const profiles = getPortfolioProfiles()
  const existing = profiles.find(p => p.name === name)
  const entry: PortfolioProfile = {
    id: existing?.id || `p-${Date.now()}`,
    name,
    siteIds,
    updatedAt: new Date().toISOString(),
  }
  const next = [...profiles.filter(p => p.name !== name), entry].slice(-6)
  localStorage.setItem(PROFILES_KEY, JSON.stringify(next))
  return entry
}

export function deletePortfolioProfile(id: string) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(getPortfolioProfiles().filter(p => p.id !== id)))
}