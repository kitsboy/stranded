'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Navigation, Share2, RefreshCw, X } from 'lucide-react'

export type QuickAction = {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  accent?: string
}

type QuickActionsProps = {
  actions: QuickAction[]
  position?: 'bottom-right' | 'bottom-left'
  className?: string
}

export default function QuickActions({
  actions,
  position = 'bottom-right',
  className = '',
}: QuickActionsProps) {
  const [open, setOpen] = useState(false)
  const posClass = position === 'bottom-right' ? 'right-4 md:right-6' : 'left-4 md:left-6'

  return (
    <div className={`fixed bottom-20 ${posClass} z-[68] flex flex-col items-end gap-2 ${className}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-col gap-2 mb-1"
          >
            {actions.map((action, i) => (
              <motion.button
                key={action.id}
                type="button"
                data-testid={action.id === 'locate' ? 'geolocate-btn' : undefined}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { action.onClick(); setOpen(false) }}
                className="flex items-center gap-2 glass-strong rounded-2xl px-4 py-2.5 border border-white/15 text-xs font-medium hover:border-[#FF8C00]/40 shadow-lg"
              >
                <span className="text-[#FF8C00]">{action.icon}</span>
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center border transition ${
          open
            ? 'bg-white/10 border-white/30 text-white'
            : 'bg-gradient-to-br from-[#FF8C00] to-[#f59e0b] border-[#FF8C00]/50 text-black'
        }`}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Plus size={22} className="rotate-0" />}
      </button>
    </div>
  )
}

/** Preset icons for common map FAB actions */
export const MapFabIcons = {
  locate: <Navigation size={16} />,
  share: <Share2 size={16} />,
  reset: <RefreshCw size={16} />,
}