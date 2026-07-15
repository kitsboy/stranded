'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('stranded-theme')
    if (saved === 'light') {
      setLight(true)
      document.documentElement.classList.add('theme-light')
    }
  }, [])

  const toggle = () => {
    const next = !light
    setLight(next)
    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.toggle('theme-light', next)
    localStorage.setItem('stranded-theme', next ? 'light' : 'dark')
    window.setTimeout(() => root.classList.remove('theme-transition'), 400)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 rounded-lg border border-white/15 text-gray-400 hover:text-white hover:border-[#5BC0BE]/40 transition-colors duration-300"
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-pressed={light}
    >
      <span className="inline-flex transition-transform duration-300" style={{ transform: light ? 'rotate(0deg)' : 'rotate(90deg)' }}>
        {light ? <Moon size={14} /> : <Sun size={14} />}
      </span>
    </button>
  )
}