const ONBOARDED_KEY = 'stranded-onboarded'

export type OnboardingStep = {
  id: string
  title: string
  body: string
  target?: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Stranded',
    body: 'Explore 2,611 mapped methane sites across Canada (2,588 with reported CH₄, 675 high-confidence). The same map also has 1,049 renewable plants and 276 remote communities. Pan the map, click a methane marker for generator ROI, or click a plant or community pin for a miner build only where the file records power.',
  },
  {
    id: 'filters',
    title: 'Live filters',
    body: 'Use the left panel to filter by emission, Stranded Score, province, and source type. Filters update the map instantly.',
    target: 'map-filters',
  },
  {
    id: 'mission',
    title: 'Build a mission',
    body: 'Add sites to your mission portfolio to model cluster yield, export bank packs, and share a deep link.',
    target: 'mission-panel',
  },
  {
    id: 'command',
    title: 'Command palette',
    body: 'Press ⌘K (Ctrl+K) anywhere to fuzzy-search sites, jump to pages, and revisit recent locations.',
  },
]

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}

export function markOnboardingComplete(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDED_KEY, '1')
}

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ONBOARDED_KEY)
}