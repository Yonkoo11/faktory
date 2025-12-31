"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, Bot, Shield, Menu, X, Keyboard } from "lucide-react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { toast } from "sonner"
import { usePathname } from "next/navigation"

export function DashboardHeader() {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const previouslyConnected = useRef(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show toast when wallet connects/disconnects
  useEffect(() => {
    if (!mounted) return

    if (isConnected && address && !previouslyConnected.current) {
      toast.success("Wallet connected!", {
        description: `${address.slice(0, 6)}...${address.slice(-4)} connected to Mantle`,
      })
      previouslyConnected.current = true
    } else if (!isConnected && previouslyConnected.current) {
      toast.info("Wallet disconnected", {
        description: "Connect your wallet to use Faktory Protocol",
      })
      previouslyConnected.current = false
    }
  }, [isConnected, address, mounted])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/mint", label: "Mint" },
    { href: "/dashboard/agent", label: "Agent" },
    { href: "/dashboard/issuer", label: "Privacy" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-glass-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              className="md:hidden size-11 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold hidden sm:inline">Faktory Protocol</span>
            </Link>
          </div>

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

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success hidden sm:flex">
            <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
            Mantle
          </Badge>

          {mounted && isConnected && address ? (
            <>
              {/* Mobile: Better touch target (44px) */}
              <Button
                variant="outline"
                className="border-glass-border bg-background/50 md:hidden h-11 px-3"
                onClick={() => disconnect()}
                aria-label="Disconnect wallet"
              >
                <Wallet className="w-4 h-4 mr-1.5" />
                <span className="text-xs">{address.slice(0, 4)}...{address.slice(-2)}</span>
              </Button>
              {/* Desktop: Standard size */}
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
              className="border-glass-border bg-background/50 h-11 md:h-8 px-3"
              onClick={() => connect({ connector: injected() })}
              disabled={!mounted || isPending}
              aria-label="Connect wallet"
            >
              <Wallet className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{isPending ? 'Connecting...' : 'Connect'}</span>
            </Button>
          )}

          <Link href="/dashboard/mint">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-11 md:h-8 px-3 md:px-4">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Mint Invoice</span>
              <span className="sm:hidden">Mint</span>
            </Button>
          </Link>

          <Link href="/dashboard/agent">
            <Button variant="outline" className="border-glass-border bg-background/50 size-11 md:size-9 p-0" aria-label="AI Agent settings">
              <Bot className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="hidden md:flex size-9 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => window.dispatchEvent(new CustomEvent('showKeyboardHelp'))}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (Press ?)"
          >
            <Keyboard className="w-4 h-4" />
          </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-b border-glass-border">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
