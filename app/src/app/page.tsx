"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, Lock, TrendingUp, Wallet, Radio } from "lucide-react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useLendleMarkets } from '@/hooks/use-lendle'
import { useProtocolStats } from '@/hooks/use-protocol-stats'
import { CostCalculator } from '@/components/cost-calculator'

// Animated counter that counts up from 0 to target value
function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2000
}: {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3)
            // For decimals like 5.8, multiply by 10 to animate smoothly
            const isDecimal = !Number.isInteger(value)
            const targetValue = isDecimal ? value * 10 : value
            setCount(Math.floor(eased * targetValue))
            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setCount(targetValue)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, duration, hasAnimated])

  // Handle decimals for values like 5.8
  const isDecimal = !Number.isInteger(value)
  const displayValue = isDecimal ? count / 10 : count

  const formattedCount = displayValue >= 1000
    ? displayValue.toLocaleString('en-US', { maximumFractionDigits: 1 })
    : isDecimal
      ? displayValue.toFixed(1)
      : displayValue.toString()

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold gradient-text">
      {prefix}{formattedCount}{suffix}
    </span>
  )
}

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-glass-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold">Faktory Protocol</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
            <Link href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Security
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {mounted && isConnected && address ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => disconnect()}
              >
                <Wallet className="w-4 h-4 mr-2" />
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
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            {/* Trust-First Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-success/10 border border-success/20">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">0% Default Rate</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <span className="text-sm text-muted-foreground">100% Withdrawal Success</span>
              <div className="w-px h-4 bg-border" />
              <span className="text-sm text-muted-foreground">Instant Withdrawals</span>
            </div>

            {/* Data-Focused Hero - Massive APY */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                <span className="text-[80px] md:text-[120px] font-black leading-none text-success tracking-tight">3-7%</span>
                <span className="text-[40px] md:text-[60px] font-bold text-muted-foreground">APY</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-semibold text-muted-foreground">
                on your unpaid invoices
              </h1>
            </div>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Tokenize invoices. Deposit to yield vaults. Withdraw anytime.
              <br />
              <span className="text-foreground font-medium">No lockups. No credit checks. No KYC.</span>
            </p>

            {/* Key Metrics Row */}
            <div className="flex items-center justify-center gap-8 pt-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">&lt;1 min</div>
                <div className="text-muted-foreground">Time to yield</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">$0</div>
                <div className="text-muted-foreground">Platform fees</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">24/7</div>
                <div className="text-muted-foreground">Withdrawals</div>
              </div>
            </div>

            {/* Live Lendle Rates - Compact inline */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <Radio className="w-3 h-3 text-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Live Lendle Rates:</span>
              <span className="text-xs font-medium">
                USDC <span className="text-success">{lendleMarkets.isLoading ? '...' : `${lendleMarkets.USDC.supplyAPY || 'N/A'}%`}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-xs font-medium">
                USDT <span className="text-success">{lendleMarkets.isLoading ? '...' : `${lendleMarkets.USDT.supplyAPY || 'N/A'}%`}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-xs font-medium">
                WETH <span className="text-success">{lendleMarkets.isLoading ? '...' : `${lendleMarkets.WETH.supplyAPY || 'N/A'}%`}</span>
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 pt-6">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg h-14 px-10">
                  Start Earning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                Connect wallet · Mint invoice · Earn yield
              </p>
            </div>
          </div>

          {/* Live Stats Bar - Only show when we have real data with non-zero values */}
          {protocolStats.hasData && (protocolStats.tvl > 0 || protocolStats.totalInvoices > 0) && (
            <Card
              className="glass border-glass-border p-8 max-w-4xl mx-auto relative animate-fade-in"
              style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
            >
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Live on Mantle
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Value Locked</div>
                  <span className="text-4xl md:text-5xl font-bold gradient-text">
                    {protocolStats.tvlFormatted}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Invoices Minted</div>
                  <span className="text-4xl md:text-5xl font-bold gradient-text">
                    {protocolStats.totalInvoices}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Target APY</div>
                  <span className="text-4xl md:text-5xl font-bold gradient-text">
                    3-7%
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Social Proof & Trust */}
          <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Mantle Global Hackathon 2025</span>
            </div>

            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Powered By</p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              {/* Mantle - with brand color */}
              <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-glass-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#000] to-[#65B3AE] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Mantle L2</span>
              </div>

              {/* Lendle */}
              <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-glass-border hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Lendle</span>
              </div>

              {/* Pyth */}
              <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-glass-border hover:border-success/30 transition-all duration-300 hover:shadow-lg hover:shadow-success/10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7142CF] to-[#E9E0FF] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">Pyth Network</span>
              </div>

              {/* Anthropic Claude */}
              <div className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-glass-border hover:border-warning/30 transition-all duration-300 hover:shadow-lg hover:shadow-warning/10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D97706] to-[#F59E0B] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors">AI Agent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why <span className="gradient-text">Faktory</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-glass-border p-8 hover:border-primary/20 transition-colors relative">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]">
                  Unique
                </Badge>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy by Default</h3>
              <p className="text-muted-foreground text-pretty mb-4">
                Your invoice data stays yours. We use cryptographic commitment hashes—only you decide who sees the details.
              </p>
              <div className="text-xs text-muted-foreground border-t border-glass-border pt-3">
                <span className="text-primary font-medium">Unlike competitors</span>: No public disclosure of clients, amounts, or contracts required.
              </div>
            </Card>

            <Card className="glass border-glass-border p-8 hover:border-accent/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Optimized</h3>
              <p className="text-muted-foreground text-pretty">
                Intelligent agents continuously optimize your yield strategies based on market conditions.
              </p>
            </Card>

            <Card className="glass border-glass-border p-8 hover:border-success/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real DeFi Yield</h3>
              <p className="text-muted-foreground text-pretty">
                Earn up to 7% APY from real lending protocols, not inflationary token emissions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Trust Us - Security Section */}
      <section id="security" className="py-20 px-4 bg-gradient-to-b from-background to-muted/5">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success mb-4">
              Security First
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Why Trust Faktory?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with institutional-grade security practices and full transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass border-glass-border p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-success" />
              </div>
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
              <p className="text-xs text-muted-foreground mt-2">
                All contracts verified on Mantlescan
              </p>
            </Card>

            <Card className="glass border-glass-border p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold mb-1">No Admin Keys</div>
              <div className="text-sm text-muted-foreground">Immutable Logic</div>
              <p className="text-xs text-muted-foreground mt-2">
                No backdoors, no rug pulls possible
              </p>
            </Card>

            <Card className="glass border-glass-border p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div className="text-2xl font-bold mb-1">Real Yield</div>
              <div className="text-sm text-muted-foreground">From Lendle</div>
              <p className="text-xs text-muted-foreground mt-2">
                Battle-tested lending protocol
              </p>
            </Card>

            <Card className="glass border-glass-border p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-warning" />
              </div>
              <div className="text-2xl font-bold mb-1">Pyth Oracle</div>
              <div className="text-sm text-muted-foreground">Price Feeds</div>
              <p className="text-xs text-muted-foreground mt-2">
                Institutional-grade data
              </p>
            </Card>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-glass-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-6">
                <a
                  href="https://sepolia.mantlescan.xyz/address/0xf35be6ffebf91acc27a78696cf912595c6b08aaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  InvoiceNFT ↗
                </a>
                <a
                  href="https://sepolia.mantlescan.xyz/address/0xd2cad31a080b0dae98d9d6427e500b50bcb92774"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  YieldVault ↗
                </a>
                <a
                  href="https://sepolia.mantlescan.xyz/address/0xec5bfee9d17e25cc8d52b8cb7fb81d8cabb53c5f"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  AgentRouter ↗
                </a>
              </div>
              <a
                href="https://github.com/anthropics/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                View Source on GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Savings Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-muted/10 to-background">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why <span className="gradient-text">Mantle</span>?
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Ultra-low transaction costs make AI-powered optimization economically viable.
          </p>

          {/* Cost Calculator */}
          <CostCalculator />
        </div>
      </section>

      {/* How It Works Visualization */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Simple. Secure. <span className="gradient-text">Profitable.</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Three steps to turn your invoices into yield
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/3 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary via-accent to-success" />

            <Card className="glass border-glass-border p-8 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 mx-auto">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Mint Invoice</h3>
              <p className="text-sm text-muted-foreground text-center">
                Tokenize your unpaid invoice as an NFT with privacy-preserving commitment hash
              </p>
            </Card>

            <Card className="glass border-glass-border p-8 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-6 mx-auto">
                <span className="text-xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Deposit</h3>
              <p className="text-sm text-muted-foreground text-center">
                Choose a yield strategy and deposit to start earning immediately
              </p>
            </Card>

            <Card className="glass border-glass-border p-8 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-6 mx-auto">
                <span className="text-xl font-bold text-success">3</span>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Earn & Withdraw</h3>
              <p className="text-sm text-muted-foreground text-center">
                Collect yield anytime. No lockups, no penalties.
              </p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border glass py-12 px-4 mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-lg font-bold">Faktory</span>
              </div>
              <p className="text-sm text-muted-foreground">Tokenize invoices, earn yield.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/mint" className="hover:text-foreground transition-colors">
                    Mint Invoice
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/agent" className="hover:text-foreground transition-colors">
                    AI Agent
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Smart Contracts
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Discord
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground transition-colors">
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-glass-border mt-8 pt-8 text-center text-sm text-muted-foreground space-y-2">
            <p>Built for Mantle Global Hackathon 2025</p>
            <p className="text-xs text-muted-foreground/70">
              Unaudited prototype. Use testnet only. Not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
