"use client"

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsModal } from './keyboard-shortcuts-modal'
import { CommandPalette } from './command-palette'

export function KeyboardShortcutsProvider() {
  useKeyboardShortcuts()

  return (
    <>
      <KeyboardShortcutsModal />
      <CommandPalette />
    </>
  )
}
