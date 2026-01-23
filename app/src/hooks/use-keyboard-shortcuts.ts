'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const KEYBOARD_SHORTCUTS = [
  { key: 'D', description: 'Go to Dashboard' },
  { key: 'M', description: 'Mint new invoice' },
  { key: 'A', description: 'View AI Agent' },
  { key: '⌘K', description: 'Open command palette' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'ESC', description: 'Close dialogs' },
]

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'k') {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('open-command-palette'))
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case 'd':
          router.push('/dashboard')
          break
        case 'm':
          router.push('/dashboard/mint')
          break
        case 'a':
          router.push('/dashboard/agent')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}
