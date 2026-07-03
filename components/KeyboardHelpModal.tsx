'use client'

import { X } from 'lucide-react'

const SHORTCUTS = [
  { keys: '⌘K', action: 'Open command palette' },
  { keys: '⌘F', action: 'Reset map filters' },
  { keys: '⌘C', action: 'Add selected site to mission' },
  { keys: '↑↓ ⏎', action: 'Navigate & select in palette' },
  { keys: 'ESC', action: 'Close panels / palette' },
]

export default function KeyboardHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-label="Keyboard shortcuts">
      <div className="glass rounded-2xl p-6 max-w-md w-full border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Keyboard shortcuts</h2>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
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
    </div>
  )
}