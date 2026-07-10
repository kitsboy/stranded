'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('stranded-theme')
    if (saved === 'light') { setLight(true); document.documentElement.classList.add('theme-light') }
  }, [])

  const toggle = () => {
    const next = !light
    setLight(next)
    document.documentElement.classList.toggle('theme-light', next)
    localStorage.setItem('stranded-theme', next ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 rounded-lg border border-white/15 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#5BC0BE]/50"
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-pressed={light}
    >
      {light ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  )
}