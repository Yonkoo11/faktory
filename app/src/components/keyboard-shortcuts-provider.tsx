"use client"

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsModal } from './keyboard-shortcuts-modal'

export function KeyboardShortcutsProvider() {
  useKeyboardShortcuts()

  return <KeyboardShortcutsModal />
}
