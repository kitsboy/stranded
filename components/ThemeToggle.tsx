'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Contrast } from 'lucide-react'

type ThemeMode = 'dark' | 'light' | 'high-contrast'

const THEME_CYCLE: ThemeMode[] = ['dark', 'light', 'high-contrast']

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('theme-light', 'theme-high-contrast')
  if (mode === 'light') root.classList.add('theme-light')
  if (mode === 'high-contrast') root.classList.add('theme-high-contrast')
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('stranded-theme') as ThemeMode | null
    const initial = saved && THEME_CYCLE.includes(saved) ? saved : 'dark'
    setMode(initial)
    applyTheme(initial)
  }, [])

  const cycle = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length]
    setMode(next)
    const root = document.documentElement
    root.classList.add('theme-transition')
    applyTheme(next)
    localStorage.setItem('stranded-theme', next)
    window.setTimeout(() => root.classList.remove('theme-transition'), 400)
  }

  const labels: Record<ThemeMode, string> = {
    dark: 'Switch to light theme',
    light: 'Switch to high contrast theme',
    'high-contrast': 'Switch to dark theme',
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="p-1.5 rounded-lg border border-white/15 text-gray-400 hover:text-white hover:border-[#5BC0BE]/40 transition-colors duration-300"
      aria-label={labels[mode]}
      aria-pressed={mode !== 'dark'}
    >
      <span className="inline-flex transition-transform duration-300">
        {mode === 'light' ? <Moon size={14} /> : mode === 'high-contrast' ? <Contrast size={14} /> : <Sun size={14} />}
      </span>
    </button>
  )
}