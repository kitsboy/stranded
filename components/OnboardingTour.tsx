'use client'

import { useEffect, useState } from 'react'
import { X, MapPin, Target, Filter } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'

const STORAGE_KEY = 'stranded-onboarding-dismissed'

export function isOnboardingDismissed(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

export function dismissOnboarding(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

type OnboardingTourProps = {
  /** Stacked under map filters on xl; floating on smaller breakpoints */
  layout?: 'stacked' | 'floating'
}

const STEPS = [
  { icon: Filter, color: 'text-[#5BC0BE]', key: 'onboardingFilters' as const },
  { icon: MapPin, color: 'text-[#FF8C00]', key: 'onboardingPins' as const },
  { icon: Target, color: 'text-emerald-400', key: 'onboardingMission' as const },
]

export default function OnboardingTour({ layout = 'floating' }: OnboardingTourProps) {
  const { t } = useLocale()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(!isOnboardingDismissed())
  }, [])

  if (!visible) return null

  const handleDismiss = () => {
    dismissOnboarding()
    setVisible(false)
  }

  const positionClass =
    layout === 'stacked'
      ? 'relative w-full shrink-0'
      : 'absolute bottom-24 left-4 z-[75] w-[min(320px,90vw)] xl:hidden'

  return (
    <div
      data-testid="onboarding-tour"
      className={`${positionClass} glass rounded-2xl border border-[#FF8C00]/40 p-4 shadow-2xl text-sm`}
      role="dialog"
      aria-labelledby="onboarding-tour-title"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-[#FF8C00] mb-1">{t('onboardingBadge')}</div>
          <h3 id="onboarding-tour-title" className="font-semibold text-white leading-snug">{t('onboardingTitle')}</h3>
        </div>
        <button
          type="button"
          data-testid="onboarding-dismiss"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-lg shrink-0"
          aria-label={t('onboardingDismiss')}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4 px-1" aria-hidden>
        {STEPS.map(({ icon: Icon, color }, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 ${color}`}>
              <Icon size={16} />
            </div>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">{i + 1}</span>
          </div>
        ))}
      </div>

      <ul className="space-y-2.5 text-gray-300 text-xs">
        {STEPS.map(({ icon: Icon, color, key }) => (
          <li key={key} className="flex gap-2.5 items-start">
            <Icon size={14} className={`${color} shrink-0 mt-0.5`} aria-hidden />
            <span className="leading-relaxed">{t(key)}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-4 w-full py-2.5 rounded-xl bg-[#FF8C00] text-[#1e293b] font-semibold text-xs hover:bg-[#FF8C00]/90 transition"
      >
        {t('onboardingGotIt')}
      </button>
    </div>
  )
}