'use client'

import { X } from 'lucide-react'
import FocusTrap from './FocusTrap'

const SHORTCUTS = [
  { keys: '⌘K', action: 'Open command palette' },
  { keys: '⌘F', action: 'Reset map filters' },
  { keys: 'Shift+M', action: 'Add selected site to mission' },
  { keys: '↑↓ ⏎', action: 'Navigate & select in palette' },
  { keys: 'ESC', action: 'Close panels / palette' },
  { keys: '?', action: 'Show this help' },
]

export default function KeyboardHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
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
            <h2 id="keyboard-help-title" className="font-semibold text-lg">Keyboard shortcuts</h2>
            <button type="button" onClick={onClose} aria-label="Close keyboard shortcuts" data-autofocus>
              <X size={18} />
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {SHORTCUTS.map(s => (
              <li key={s.keys} className="flex justify-between gap-4">
                <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs">{s.keys}</kbd>
                <span className="text-gray-400 text-right">{s.action}</span>
              </li>
            ))}
          </ul>
        </div>
      </FocusTrap>
    </div>
  )
}
