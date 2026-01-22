"use client"

import { useState, useEffect, useRef } from "react"
import { Wallet, Plus, Bot, Menu, X } from "lucide-react"
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

  useEffect(() => {
    if (!mounted) return

    if (isConnected && address && !previouslyConnected.current) {
      toast.success("Wallet connected!", {
        description: `${address.slice(0, 6)}...${address.slice(-4)} connected to Cronos`,
      })
      previouslyConnected.current = true
    } else if (!isConnected && previouslyConnected.current) {
      toast.info("Wallet disconnected", {
        description: "Connect your wallet to use Faktory Protocol",
      })
      previouslyConnected.current = false
    }
  }, [isConnected, address, mounted])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { href: "/dashboard", label: "Portfolio" },
    { href: "/dashboard/mint", label: "Mint" },
    { href: "/dashboard/agent", label: "Agent" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -ml-2 hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Faktory" className="w-8 h-8" />
              <span className="font-display font-semibold text-lg tracking-tight hidden sm:inline">Faktory</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive(link.href)
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Network Badge */}
            <div className="network-badge hidden sm:flex">
              Cronos Testnet
            </div>

            {/* Wallet */}
            {mounted && isConnected && address ? (
              <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm font-mono hover:bg-muted/80 transition-colors"
                suppressHydrationWarning
              >
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline">{address.slice(0, 6)}...{address.slice(-4)}</span>
                <span className="sm:hidden">{address.slice(0, 4)}...{address.slice(-2)}</span>
              </button>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                disabled={!mounted || isPending}
                className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">{isPending ? 'Connecting...' : 'Connect'}</span>
              </button>
            )}

            {/* Mint Button */}
            <Link href="/dashboard/mint" className="btn-primary hidden sm:inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Mint
            </Link>

            {/* Agent Button (mobile) */}
            <Link
              href="/dashboard/agent"
              className="md:hidden p-2 hover:bg-muted rounded-md"
              aria-label="AI Agent"
            >
              <Bot className="w-5 h-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background">
          <nav className="max-w-7xl mx-auto px-6 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2.5 rounded-md font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard/mint"
              className="block px-3 py-2.5 rounded-md font-medium text-primary bg-primary/10"
            >
              Mint Invoice
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
