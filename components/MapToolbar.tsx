'use client'

import { Camera, ChevronLeft, ChevronRight, Maximize2, Printer } from 'lucide-react'
import { useLocale } from '@/lib/useLocale'

type MapToolbarProps = {
  canHistoryBack: boolean
  canHistoryForward: boolean
  onHistoryBack: () => void
  onHistoryForward: () => void
  onFitBounds: () => void
  onScreenshot: () => void
  onPrint: () => void
}

export default function MapToolbar({
  canHistoryBack,
  canHistoryForward,
  onHistoryBack,
  onHistoryForward,
  onFitBounds,
  onScreenshot,
  onPrint,
}: MapToolbarProps) {
  const { t } = useLocale()

  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-[69] no-print mt-10 sm:mt-0 sm:top-[4.25rem]"
      data-testid="map-toolbar"
    >
      <div className="map-toolbar-pill flex items-center">
        <button
          type="button"
          onClick={onHistoryBack}
          disabled={!canHistoryBack}
          className="map-toolbar-pill__btn"
          aria-label={t('mapHistoryBack')}
          title={t('mapHistoryBack')}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={onHistoryForward}
          disabled={!canHistoryForward}
          className="map-toolbar-pill__btn"
          aria-label={t('mapHistoryForward')}
          title={t('mapHistoryForward')}
        >
          <ChevronRight size={14} />
        </button>
        <span className="map-toolbar-pill__divider" aria-hidden />
        <button
          type="button"
          onClick={onFitBounds}
          className="map-toolbar-pill__btn map-toolbar-pill__btn--accent map-toolbar-pill__fit flex items-center"
          title={t('mapFitBounds')}
        >
          <Maximize2 size={12} /> {t('mapFitBounds')}
        </button>
        <span className="map-toolbar-pill__divider" aria-hidden />
        <button
          type="button"
          onClick={onScreenshot}
          className="map-toolbar-pill__btn"
          aria-label={t('mapScreenshot')}
          title={t('mapScreenshot')}
        >
          <Camera size={14} />
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="map-toolbar-pill__btn print-show"
          aria-label={t('mapPrint')}
          title={t('mapPrint')}
        >
          <Printer size={14} />
        </button>
      </div>
    </div>
  )
}