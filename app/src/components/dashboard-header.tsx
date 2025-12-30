"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, Bot, Shield } from "lucide-react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function DashboardHeader() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 glass border-b border-glass-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold hidden sm:inline">Faktory Protocol</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/mint"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Mint
            </Link>
            <Link
              href="/dashboard/agent"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Agent
            </Link>
            <Link
              href="/dashboard/issuer"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
            Mantle
          </Badge>

          {mounted && isConnected && address ? (
            <>
              {/* Mobile: icon only with short address */}
              <Button
                variant="outline"
                size="sm"
                className="border-glass-border bg-background/50 md:hidden"
                onClick={() => disconnect()}
                aria-label="Disconnect wallet"
              >
                <Wallet className="w-4 h-4 mr-1" />
                <span className="text-xs">{address.slice(0, 4)}...{address.slice(-2)}</span>
              </Button>
              {/* Desktop: full address */}
              <Button
                variant="outline"
                size="sm"
                className="border-glass-border bg-background/50 hidden md:flex"
                onClick={() => disconnect()}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {address.slice(0, 6)}...{address.slice(-4)}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-glass-border bg-background/50"
              onClick={() => connect({ connector: injected() })}
              disabled={!mounted || isPending}
              aria-label="Connect wallet"
            >
              <Wallet className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{isPending ? 'Connecting...' : 'Connect'}</span>
            </Button>
          )}

          <Link href="/dashboard/mint">
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Mint Invoice
            </Button>
          </Link>

          <Link href="/dashboard/agent">
            <Button variant="outline" size="icon" className="border-glass-border bg-background/50" aria-label="AI Agent settings">
              <Bot className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
