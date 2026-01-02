"use client"

/**
 * Faktory Protocol Landing Page - Stripe/Linear Light Theme
 *
 * COMPLETE REDESIGN - Light, bright, sophisticated
 * Inspired by: Stripe, Linear, Vercel
 * Theme: Professional SaaS with animated gradient orbs
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
  Radio,
  DollarSign,
  Shield,
  Check,
  BarChart3,
  FileText,
  Sparkles,
  Globe,
} from "lucide-react"

import { Button } from "@/components/ui/button-v2"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useLendleMarkets } from '@/hooks/use-lendle'
import { useProtocolStats } from '@/hooks/use-protocol-stats'
import { useCounter } from '@/hooks/use-counter'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { useParallax } from '@/hooks/use-parallax'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const lendleMarkets = useLendleMarkets()
  const protocolStats = useProtocolStats()

  // Counter animations for stats
  const tvlCounter = useCounter({ end: 0, duration: 2000, delay: 300 })
  const apyCounter = useCounter({ end: 7, duration: 2000, delay: 400 })
  const invoicesCounter = useCounter({ end: protocolStats.totalInvoices, duration: 2000, delay: 500 })

  // Live yields counters
  const usdcYield = useCounter({
    end: parseFloat(lendleMarkets.USDC.supplyAPY || '0'),
    duration: 2000,
    decimals: 2,
    delay: 600
  })
  const usdtYield = useCounter({
    end: parseFloat(lendleMarkets.USDT.supplyAPY || '0'),
    duration: 2000,
    decimals: 2,
    delay: 700
  })
  const wethYield = useCounter({
    end: parseFloat(lendleMarkets.WETH.supplyAPY || '0'),
    duration: 2000,
    decimals: 2,
    delay: 800
  })

  // Parallax effects for gradient orbs
  const orbPurpleRef = useParallax({ speed: -0.3 })
  const orbCyanRef = useParallax({ speed: -0.4 })
  const orbPinkRef = useParallax({ speed: -0.2 })

  // Scroll reveal animations
  const statsReveal = useScrollReveal({ threshold: 0.2 })
  const featuresReveal = useScrollReveal({ threshold: 0.1 })
  const stepsReveal = useScrollReveal({ threshold: 0.2 })
  const trustReveal = useScrollReveal({ threshold: 0.3 })

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ANIMATED GRADIENT ORBS BACKGROUND - Stripe Style with Parallax */}
      <div className="gradient-orbs-bg">
        <div ref={orbPurpleRef} className="orb orb-purple parallax-slow" />
        <div ref={orbCyanRef} className="orb orb-cyan parallax-slow" />
        <div ref={orbPinkRef} className="orb orb-pink parallax-slow" />
      </div>

      {/* Header - Stripe-style minimal */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-white font-bold">F</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Faktory</span>
          </div>

          <div className="flex items-center gap-4">
            {mounted && isConnected && address ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => disconnect()}
              >
                {address.slice(0, 6)}...{address.slice(-4)}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => connect({ connector: injected() })}
                disabled={isPending}
              >
                Connect Wallet
              </Button>
            )}

            <Link href="/dashboard" className="hidden md:block">
              <Button size="sm" className="btn-primary">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-8">
                  {mounted && isConnected && address ? (
                    <Button variant="outline" onClick={() => disconnect()}>
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => connect({ connector: injected() })}>
                      Connect Wallet
                    </Button>
                  )}
                  <Link href="/dashboard">
                    <Button className="w-full">Launch App</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* HERO SECTION - Stripe-style centered with high spacing */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="container mx-auto max-w-5xl text-center relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-8 fade-in">
            <Sparkles className="w-4 h-4" />
            Mantle Global Hackathon 2025
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 slide-up" style={{letterSpacing: '-0.02em'}}>
            Earn{" "}
            <span className="text-gradient-purple">3-7% APY</span>
            {" "}on unpaid invoices
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed slide-up">
            Tokenize business invoices. Deposit to DeFi yield vaults. Withdraw anytime.
            <span className="block mt-3 text-foreground font-medium">No lockups. No credit checks. No KYC required.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-16 slide-up">
            <Link href="/dashboard">
              <Button size="lg" className="btn-primary button-scale text-lg px-10 py-6">
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-10 py-6 hover-glow-smooth">
              Learn More
            </Button>
          </div>

          {/* Live Rates - Stripe style */}
          <div className="inline-flex items-center gap-4 px-6 py-4 rounded-xl bg-card border border-border shadow-md text-sm slide-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">Live Yields:</span>
            </div>
            <span className="font-semibold">
              USDC <span className="text-success">{usdcYield}%</span>
            </span>
            <span className="text-border">·</span>
            <span className="font-semibold">
              USDT <span className="text-success">{usdtYield}%</span>
            </span>
            <span className="text-border">·</span>
            <span className="font-semibold">
              WETH <span className="text-success">{wethYield}%</span>
            </span>
          </div>
        </div>
      </section>

      {/* STATS SECTION - Stripe-style horizontal cards */}
      <section ref={statsReveal.ref} className="py-16 px-6 border-t border-border bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 scroll-reveal ${statsReveal.isVisible ? 'is-visible' : ''}`}>

            {/* Stat 1 - TVL */}
            <div className="card-stripe text-center p-10 hover-tilt">
              <div className="text-5xl md:text-6xl font-bold text-gradient-primary mb-3">
                ${tvlCounter}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Total Value Locked
              </div>
            </div>

            {/* Stat 2 - Target APY (Gold accent) */}
            <div className="card-stripe text-center p-10 hover-tilt scroll-reveal-delay-1" style={{boxShadow: 'var(--shadow-glow-gold)'}}>
              <div className="text-5xl md:text-6xl font-bold text-gradient-gold mb-3">
                3-{apyCounter}%
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Target APY
              </div>
            </div>

            {/* Stat 3 - Invoices */}
            <div className="card-stripe text-center p-10 hover-tilt scroll-reveal-delay-2">
              <div className="text-5xl md:text-6xl font-bold text-gradient-primary mb-3">
                {invoicesCounter}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Invoices Tokenized
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION - Linear-style clean cards */}
      <section className="py-32 px-6">
        <div className="container mx-auto max-w-6xl">

          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Built for <span className="text-gradient-purple">Web3</span> businesses
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The first protocol to unlock liquidity from unpaid invoices without credit checks, underwriters, or KYC friction.
            </p>
          </div>

          {/* Features Grid */}
          <div ref={featuresReveal.ref} className={`grid grid-cols-1 md:grid-cols-2 gap-8 scroll-reveal ${featuresReveal.isVisible ? 'is-visible' : ''}`}>

            {/* Feature 1 - Privacy */}
            <div className="card-elevated p-10 space-y-5 hover-tilt">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                  Privacy First
                </div>
                <h3 className="text-2xl font-bold mb-3">Cryptographic Privacy</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Your invoice data stays private. We use cryptographic commitment hashes—only you control who sees the details.
                </p>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Unlike competitors</strong>: No public disclosure of clients, amounts, or contracts.
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 2 - AI Agent */}
            <div className="card-elevated p-10 space-y-5 hover-tilt scroll-reveal-delay-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                  AI Powered
                </div>
                <h3 className="text-2xl font-bold mb-3">Autonomous Optimization</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our AI agent continuously monitors DeFi markets and rebalances your deposits to maximize yield—24/7, automatically.
                </p>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Set it and forget it</strong>: No manual intervention required.
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 3 - Real Yield */}
            <div className="card-elevated p-10 space-y-5 hover-tilt scroll-reveal-delay-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                  Real Yield
                </div>
                <h3 className="text-2xl font-bold mb-3">Sustainable Returns</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Earn 3-7% APY from battle-tested DeFi lending protocols—not inflated by token emissions or ponzi mechanics.
                </p>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Powered by Lendle</strong>: Proven lending infrastructure on Mantle.
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 4 - Security */}
            <div className="card-elevated p-10 space-y-5 hover-tilt scroll-reveal-delay-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-4">
                  Battle Tested
                </div>
                <h3 className="text-2xl font-bold mb-3">Institutional Security</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Fully auditable smart contracts. No admin keys. No backdoors. All contracts verified on Mantlescan.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    <span>Open Source</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    <span>Immutable</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    <span>Pyth Oracles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Step-by-step */}
      <section ref={stepsReveal.ref} className="py-32 px-6 bg-secondary/30 border-y border-border">
        <div className="container mx-auto max-w-6xl">

          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Start earning in <span className="text-gradient-gold">60 seconds</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Three simple steps to turn unpaid invoices into yield-generating assets
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-12 scroll-reveal ${stepsReveal.isVisible ? 'is-visible' : ''}`}>

            {/* Step 1 */}
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center shadow-lg">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-primary uppercase tracking-wide">Step 1</div>
                <h3 className="text-2xl font-bold">Mint Invoice NFT</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your invoice and mint it as an ERC-721 NFT with cryptographic proof
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center shadow-lg">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-primary uppercase tracking-wide">Step 2</div>
                <h3 className="text-2xl font-bold">Deposit to Vault</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Lock your NFT and deposit stablecoins to start earning yield immediately
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center shadow-lg">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-primary uppercase tracking-wide">Step 3</div>
                <h3 className="text-2xl font-bold">Earn & Withdraw</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Watch your balance grow. Withdraw anytime—no lockups or penalties
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUST BAR - Powered By */}
      <section ref={trustReveal.ref} className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <div className="text-sm text-muted-foreground uppercase tracking-wide mb-8">Powered By</div>
            <div className={`flex flex-wrap items-center justify-center gap-16 scroll-reveal ${trustReveal.isVisible ? 'is-visible' : ''}`}>

              <div className="flex items-center gap-4 hover-scale cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg">Mantle L2</span>
              </div>

              <div className="flex items-center gap-4 hover-scale cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg">Lendle</span>
              </div>

              <div className="flex items-center gap-4 hover-scale cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg">Pyth Network</span>
              </div>

              <div className="flex items-center gap-4 hover-scale cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-lg">AI Agent</span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
            Ready to unlock your invoice value?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
            Join the future of invoice financing—where DeFi meets business cash flow
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="btn-primary button-scale text-lg px-12 py-7">
                Launch App
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-12 py-7 hover-glow-smooth">
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-white font-bold">F</span>
              </div>
              <span className="font-semibold">Faktory Protocol</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Faktory Protocol. Built on Mantle Network.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
