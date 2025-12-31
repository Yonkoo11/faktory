"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { KEYBOARD_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts'
import { Keyboard } from 'lucide-react'

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleShow = () => setOpen(true)
    window.addEventListener('showKeyboardHelp', handleShow)
    return () => window.removeEventListener('showKeyboardHelp', handleShow)
  }, [])

  // Also open with Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen(true)
      }
      // Close with Escape
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] card-glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Keyboard className="w-6 h-6 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Navigation
            </h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.filter((_, i) => i < 4).map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <kbd className="px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* General */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              General
            </h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.filter((_, i) => i >= 4).map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm text-foreground">{shortcut.description}</span>
                  <kbd className="px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">?</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">Cmd/Ctrl + /</kbd>{' '}
              anytime to see this help
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
