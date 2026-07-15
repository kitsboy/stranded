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
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[#FF8C00] mb-1">{t('onboardingBadge')}</div>
          <h3 id="onboarding-tour-title" className="font-semibold text-white">{t('onboardingTitle')}</h3>
        </div>
        <button
          type="button"
          data-testid="onboarding-dismiss"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-lg"
          aria-label={t('onboardingDismiss')}
        >
          <X size={18} />
        </button>
      </div>
      <ul className="space-y-2 text-gray-300 text-xs">
        <li className="flex gap-2"><Filter size={14} className="text-[#5BC0BE] shrink-0 mt-0.5" />{t('onboardingFilters')}</li>
        <li className="flex gap-2"><MapPin size={14} className="text-[#FF8C00] shrink-0 mt-0.5" />{t('onboardingPins')}</li>
        <li className="flex gap-2"><Target size={14} className="text-emerald-400 shrink-0 mt-0.5" />{t('onboardingMission')}</li>
      </ul>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-4 w-full py-2 rounded-xl bg-[#FF8C00] text-[#1e293b] font-semibold text-xs hover:bg-[#FF8C00]/90"
      >
        {t('onboardingGotIt')}
      </button>
    </div>
  )
}