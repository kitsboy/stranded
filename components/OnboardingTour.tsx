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

  const shell =
    layout === 'stacked'
      ? 'relative w-full shrink-0 mb-1'
      : 'absolute left-3 right-3 z-[75] w-auto max-w-[min(320px,calc(100vw-1.5rem))] xl:hidden bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))]'

  return (
    <div
      data-testid="onboarding-tour"
      className={`${shell} glass rounded-2xl border border-[#FF8C00]/40 shadow-2xl text-sm flex flex-col max-h-[min(42vh,340px)] overflow-hidden`}
      role="dialog"
      aria-labelledby="onboarding-tour-title"
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2 shrink-0">
        <div className="min-w-0">
          <div className="text-micro uppercase tracking-widest text-[#FF8C00] mb-1">{t('onboardingBadge')}</div>
          <h3 id="onboarding-tour-title" className="font-semibold text-white leading-snug">{t('onboardingTitle')}</h3>
        </div>
        <button
          type="button"
          data-testid="onboarding-dismiss"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-lg shrink-0 min-h-[44px] min-w-[44px]"
          aria-label={t('onboardingDismiss')}
        >
          <X size={18} />
        </button>
      </div>

      <div className="overflow-y-auto overscroll-contain touch-pan-y px-4 pb-2 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <ul className="space-y-2.5 text-gray-300 text-xs">
          {STEPS.map(({ icon: Icon, color, key }) => (
            <li key={key} className="flex gap-2.5 items-start">
              <Icon size={14} className={`${color} shrink-0 mt-0.5`} aria-hidden />
              <span className="leading-relaxed">{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-2">
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-2.5 rounded-xl bg-[#FF8C00] text-[#1e293b] font-semibold text-xs hover:bg-[#FF8C00]/90 transition"
        >
          {t('onboardingGotIt')}
        </button>
      </div>
    </div>
  )
}