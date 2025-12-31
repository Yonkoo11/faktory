"use client"

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
}

export function useKeyboardShortcuts() {
  const router = useRouter()
  const pathname = usePathname()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'd',
      description: 'Go to Dashboard',
      action: () => {
        if (pathname !== '/dashboard') {
          router.push('/dashboard')
          toast.info('Navigated to Dashboard', { description: 'Keyboard shortcut: D' })
        }
      }
    },
    {
      key: 'm',
      description: 'Go to Mint Page',
      action: () => {
        if (pathname !== '/dashboard/mint') {
          router.push('/dashboard/mint')
          toast.info('Navigated to Mint', { description: 'Keyboard shortcut: M' })
        }
      }
    },
    {
      key: 'a',
      description: 'Go to AI Agent',
      action: () => {
        if (pathname !== '/dashboard/agent') {
          router.push('/dashboard/agent')
          toast.info('Navigated to Agent', { description: 'Keyboard shortcut: A' })
        }
      }
    },
    {
      key: 'h',
      description: 'Go to Home',
      action: () => {
        if (pathname !== '/') {
          router.push('/')
          toast.info('Navigated to Home', { description: 'Keyboard shortcut: H' })
        }
      }
    },
  ]

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase()
      const ctrlMatch = s.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
      const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey
      const altMatch = s.alt ? event.altKey : !event.altKey

      return keyMatch && ctrlMatch && shiftMatch && altMatch
    })

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }

    // Show help modal on '?' key
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      // Dispatch custom event for help modal
      window.dispatchEvent(new CustomEvent('showKeyboardHelp'))
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  return { shortcuts }
}

export const KEYBOARD_SHORTCUTS = [
  { key: 'D', description: 'Go to Dashboard' },
  { key: 'M', description: 'Go to Mint Page' },
  { key: 'A', description: 'Go to AI Agent' },
  { key: 'H', description: 'Go to Home' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close modals/dialogs' },
  { key: 'Tab', description: 'Navigate form fields' },
  { key: 'Enter', description: 'Submit forms/Confirm actions' },
]
