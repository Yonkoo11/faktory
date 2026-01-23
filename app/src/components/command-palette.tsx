'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Home, Plus, Bot, FileText, Search } from 'lucide-react'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-command-palette', handleOpen)

    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)

    return () => {
      window.removeEventListener('open-command-palette', handleOpen)
      document.removeEventListener('keydown', down)
    }
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Menu"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-[#111111] border border-[#1f1f1f] rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1f1f1f]">
          <Search className="w-4 h-4 text-[#666666]" />
          <Command.Input
            placeholder="Search or type a command..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e5e5e5] placeholder:text-[#666666]"
          />
          <kbd className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#666666]">
            ESC
          </kbd>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-[12px] text-[#666666]">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigation" className="mb-2">
            <span className="px-2 py-1 text-[10px] text-[#666666] uppercase tracking-wider">
              Navigation
            </span>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/dashboard'))}
              className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-[12px] text-[#e5e5e5] hover:bg-[#1a1a1a] data-[selected=true]:bg-[#1a1a1a]"
            >
              <Home className="w-4 h-4 text-[#666666]" />
              <span>Dashboard</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#666666]">D</kbd>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/dashboard/mint'))}
              className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-[12px] text-[#e5e5e5] hover:bg-[#1a1a1a] data-[selected=true]:bg-[#1a1a1a]"
            >
              <Plus className="w-4 h-4 text-[#666666]" />
              <span>Mint Invoice</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#666666]">M</kbd>
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/dashboard/agent'))}
              className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-[12px] text-[#e5e5e5] hover:bg-[#1a1a1a] data-[selected=true]:bg-[#1a1a1a]"
            >
              <Bot className="w-4 h-4 text-[#666666]" />
              <span>AI Agent</span>
              <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#2a2a2a] rounded text-[#666666]">A</kbd>
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions">
            <span className="px-2 py-1 text-[10px] text-[#666666] uppercase tracking-wider">
              Actions
            </span>
            <Command.Item
              onSelect={() => runCommand(() => router.push('/dashboard/mint'))}
              className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer text-[12px] text-[#e5e5e5] hover:bg-[#1a1a1a] data-[selected=true]:bg-[#1a1a1a]"
            >
              <FileText className="w-4 h-4 text-[#10b981]" />
              <span>New Invoice</span>
            </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[#1f1f1f] bg-[#0a0a0a]">
          <span className="text-[10px] text-[#666666]">
            <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded mr-1">↑↓</kbd>
            navigate
          </span>
          <span className="text-[10px] text-[#666666]">
            <kbd className="px-1 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded mr-1">↵</kbd>
            select
          </span>
        </div>
      </div>
    </Command.Dialog>
  )
}
