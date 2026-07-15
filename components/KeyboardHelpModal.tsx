'use client'

import { X } from 'lucide-react'
import FocusTrap from './FocusTrap'
import { useLocale } from '@/lib/useLocale'
import { t as translate } from '@/lib/i18n'

const GLOBAL_SHORTCUTS = [
  { keys: '⌘K', actionKey: 'kbdCmdPalette' },
  { keys: '⌘F', actionKey: 'kbdResetFilters' },
  { keys: 'Shift+M', actionKey: 'kbdAddMission' },
  { keys: 'J / K', actionKey: 'kbdNextPrev' },
  { keys: '↑↓ ⏎', actionKey: 'kbdPaletteNav' },
  { keys: '?', actionKey: 'kbdShowHelp' },
  { keys: 'FAB +', actionKey: 'kbdFabActions' },
] as const

const MAP_SHORTCUTS = [
  { keys: 'E', actionKey: 'kbdExportGeojson' },
  { keys: 'L', actionKey: 'kbdToggleLayers' },
  { keys: '/', actionKey: 'kbdFocusSearch' },
  { keys: 'ESC', actionKey: 'kbdClosePanels' },
] as const

export default function KeyboardHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useLocale()
  const t = (key: string) => translate(locale, key)

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
      data-testid="keyboard-help-modal"
    >
      <FocusTrap active onEscape={onClose} className="w-full max-w-md">
        <div
          className="glass rounded-2xl p-6 w-full border border-white/10"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyboard-help-title"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="keyboard-help-title" className="font-semibold text-lg">{t('kbdTitle')}</h2>
            <button type="button" onClick={onClose} aria-label={t('kbdClose')} data-autofocus>
              <X size={18} />
            </button>
          </div>

          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-2">{t('kbdGlobalSection')}</h3>
          <ul className="space-y-2 text-sm mb-5">
            {GLOBAL_SHORTCUTS.map(s => (
              <li key={s.keys} className="flex justify-between gap-4">
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs shrink-0">{s.keys}</kbd>
                <span className="text-gray-400 text-right">{t(s.actionKey)}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-xs uppercase tracking-widest text-[#FF8C00] mb-2" data-testid="map-shortcuts-section">
            {t('kbdMapSection')}
          </h3>
          <ul className="space-y-2 text-sm">
            {MAP_SHORTCUTS.map(s => (
              <li key={s.keys} className="flex justify-between gap-4" data-testid={`map-shortcut-${s.keys.replace(/\s/g, '-')}`}>
                <kbd className="px-2 py-0.5 rounded bg-[#FF8C00]/15 border border-[#FF8C00]/30 font-mono text-xs shrink-0 text-[#FF8C00]">{s.keys}</kbd>
                <span className="text-gray-400 text-right">{t(s.actionKey)}</span>
              </li>
            ))}
          </ul>
        </div>
      </FocusTrap>
    </div>
  )
}