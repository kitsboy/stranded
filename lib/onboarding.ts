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
    body: 'Explore 2,611 verified methane sites across Canada. Pan the map, click markers, and open site details for ROI modeling.',
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