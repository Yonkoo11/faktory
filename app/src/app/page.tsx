"use client"

/**
 * Faktory Protocol - Landing Page
 *
 * Aesthetic: Premium Industrial Finance
 * - Deep indigo primary + emerald accents
 * - Tasteful gradient text on hero (not orbs)
 * - Subtle background gradient accent
 * - Strong typography hierarchy
 * - Finance-appropriate color psychology
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import {
  ArrowRight,
  Lock,
  Zap,
  TrendingUp,
  Menu,
  Shield,
  Check,
  ChevronRight,
} from "lucide-react"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useLendleMarkets } from '@/hooks/use-lendle'
import { useProtocolStats } from '@/hooks/use-protocol-stats'
import { AnimatedCounter } from '@/components/animated-counter'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const lendleMarkets = useLendleMarkets()
  const protocolStats = useProtocolStats()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background noise-texture">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Faktory" className="w-8 h-8" />
            <span className="font-display font-semibold text-lg tracking-tight">Faktory</span>
          </Link>

          <div className="flex items-center gap-3">
            {mounted && isConnected && address ? (
              <button
                onClick={() => disconnect()}
                className="hidden md:inline-flex px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </button>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                disabled={isPending}
                className="hidden md:inline-flex px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Connect Wallet
              </button>
            )}

            <Link href="/dashboard" className="hidden md:inline-flex btn-primary">
              Launch App
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-muted rounded-md">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  {mounted && isConnected && address ? (
                    <button onClick={() => disconnect()} className="btn-outline w-full">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </button>
                  ) : (
                    <button onClick={() => connect({ connector: injected() })} className="btn-outline w-full">
                      Connect Wallet
                    </button>
                  )}
                  <Link href="/dashboard" className="btn-primary w-full text-center">
                    Launch App
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient grid-pattern pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Floating Particles */}
        <div className="particles-container">
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Headline - Editorial Style */}
          <h1 className="reveal-up delay-100 headline-editorial headline-xl mb-6">
            Your AI Treasury Agent
            <br />
            <span className="text-gradient-hero">for B2B Commerce</span>
          </h1>

          {/* Subheadline */}
          <p className="reveal-up delay-200 text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Autonomous AI manages your invoices 24/7. Tokenize, optimize yield, settle via x402.{' '}
            <span className="yield-highlight text-foreground font-semibold">Machines handling real financial decisions.</span>
            <span className="block mt-3 text-foreground font-medium">No lockups. No intermediaries. Full transparency.</span>
          </p>

          {/* CTA */}
          <div className="reveal-up delay-300 flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/dashboard" className="btn-primary-lg pulse-glow">
              Start Earning
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how-it-works" className="btn-outline text-base px-8 py-3">
              Learn More
            </a>
          </div>

          {/* Live Rates - Terminal Style */}
          <div className="reveal-scale delay-500 data-ticker data-live">
            <div className="flex items-center gap-2 mr-4">
              <span className="status-dot status-active" />
              <span className="data-ticker-label">Live yields</span>
            </div>
            <div className="data-ticker-item">
              <span className="data-ticker-label">USDC</span>
              <span className="data-ticker-value">{lendleMarkets.USDC.supplyAPY || '0.00'}%</span>
            </div>
            <div className="data-ticker-item">
              <span className="data-ticker-label">USDT</span>
              <span className="data-ticker-value">{lendleMarkets.USDT.supplyAPY || '0.00'}%</span>
            </div>
            <div className="data-ticker-item">
              <span className="data-ticker-label">WETH</span>
              <span className="data-ticker-value">{lendleMarkets.WETH.supplyAPY || '0.00'}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card breathing-border">
              <div className="stat-card-value">
                <AnimatedCounter end={0} prefix="$" className="stat-card-value" />
              </div>
              <div className="stat-card-label">Total Value Locked</div>
            </div>
            <div className="stat-card breathing-border">
              <div className="stat-card-value text-gradient-hero">
                <AnimatedCounter end={3} className="stat-card-value text-gradient-hero" />
                -
                <AnimatedCounter end={7} suffix="%" className="stat-card-value text-gradient-hero" />
              </div>
              <div className="stat-card-label">Target APY</div>
            </div>
            <div className="stat-card breathing-border">
              <div className="stat-card-value">
                <AnimatedCounter end={protocolStats.totalInvoices} className="stat-card-value" />
              </div>
              <div className="stat-card-label">Invoices Tokenized</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="headline-editorial headline-lg mb-4">
              Agentic Finance Infrastructure
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The first autonomous treasury agent for B2B commerce on Cronos. AI manages your cash flow while you focus on business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">Cryptographic Privacy</h3>
              <p className="text-muted-foreground mb-4">
                Invoice data stays private with commitment hashes. Only you control who sees the details.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>No public disclosure</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Selective disclosure controls</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">Autonomous AI Agent</h3>
              <p className="text-muted-foreground mb-4">
                Your 24/7 treasury manager. Analyzes risk, optimizes yield, executes decisions autonomously with human-in-the-loop controls.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Auto-execute at 70%+ confidence</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Real-time market analysis</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">x402 Payment Rails</h3>
              <p className="text-muted-foreground mb-4">
                On-chain invoice settlement via x402. Clients pay directly to smart contracts. Instant, transparent, trustless.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Native CRO payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Instant settlement</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-3">Institutional Security</h3>
              <p className="text-muted-foreground mb-4">
                Fully auditable smart contracts with no admin keys. All contracts verified on Cronoscan.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Open source</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Pyth price oracles</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="headline-editorial headline-lg mb-4">
              Let the agent handle it
            </h2>
            <p className="text-xl text-muted-foreground">
              From invoice to settlement, fully autonomous
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="process-step">
              <div className="process-step-number">01</div>
              <h3 className="font-display text-lg font-semibold mb-3">Agent Tokenizes</h3>
              <p className="text-muted-foreground text-sm">
                Create invoice, agent mints it as privacy-preserving NFT
              </p>
            </div>

            {/* Step 2 */}
            <div className="process-step">
              <div className="process-step-number">02</div>
              <h3 className="font-display text-lg font-semibold mb-3">Agent Optimizes</h3>
              <p className="text-muted-foreground text-sm">
                AI deploys capital to yield strategies, rebalances 24/7
              </p>
            </div>

            {/* Step 3 */}
            <div className="process-step">
              <div className="process-step-number">03</div>
              <h3 className="font-display text-lg font-semibold mb-3">x402 Settlement</h3>
              <p className="text-muted-foreground text-sm">
                Client pays on-chain via x402. Machines paying machines.
              </p>
            </div>

            {/* Step 4 */}
            <div className="process-step">
              <div className="process-step-number">04</div>
              <h3 className="font-display text-lg font-semibold mb-3">Withdraw Yield</h3>
              <p className="text-muted-foreground text-sm">
                Get principal plus earnings. No lockups, no penalties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="stat-card-label">Powered By</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="trust-item">
              <div className="trust-icon">M</div>
              <span className="font-semibold">Cronos</span>
            </div>
            <div className="trust-item">
              <div className="trust-icon">L</div>
              <span className="font-semibold">Lendle</span>
            </div>
            <div className="trust-item">
              <div className="trust-icon">P</div>
              <span className="font-semibold">Pyth Network</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="headline-editorial headline-lg mb-6">
            Let AI manage your treasury
          </h2>
          <p className="text-xl opacity-80 mb-10">
            The future of B2B commerce: autonomous agents, x402 settlement, zero intermediaries
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary-lg bg-white text-secondary hover:bg-gray-100">
              Launch App
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/Yonkoo11/faktory"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-4 text-base font-medium opacity-80 hover:opacity-100 transition-opacity"
            >
              View Source
              <ChevronRight className="ml-1 w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Faktory" className="w-6 h-6" />
            <span className="font-semibold text-sm">Faktory Protocol</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Built for Cronos x402 PayTech Hackathon</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
