'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('faktory-theme')
    if (stored === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light-mode')
    }
  }, [])

  const toggle = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.remove('light-mode')
      localStorage.setItem('faktory-theme', 'dark')
    } else {
      document.documentElement.classList.add('light-mode')
      localStorage.setItem('faktory-theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded hover:bg-[#1a1a1a] light-mode:hover:bg-[#e5e5e5] transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#666666]" />
      ) : (
        <Moon className="w-4 h-4 text-[#666666]" />
      )}
    </button>
  )
}
