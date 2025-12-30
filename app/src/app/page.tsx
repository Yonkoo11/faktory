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
            {isConnected && address ? (
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
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 text-primary px-4 py-1.5 animate-fade-in"
              style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
            >
              <Zap className="w-3 h-3 mr-2 inline" />
              Built on Mantle Network
            </Badge>

            <h1
              className="text-5xl md:text-7xl font-bold leading-tight text-balance animate-fade-in"
              style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
            >
              Your Invoices. Your Data. <br />
              <span className="gradient-text">Your Yield.</span>
            </h1>

            <p
              className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty animate-fade-in"
              style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
            >
              The first privacy-preserving invoice protocol. Tokenize invoices as NFTs, earn real DeFi yield,
              and keep your business data confidential with cryptographic commitments.
            </p>

            <div
              className="flex flex-col items-center gap-4 pt-4 animate-fade-in"
              style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}
            >
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg h-14 px-10 shadow-lg shadow-primary/25">
                  Launch App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No sign-up required · Connect wallet in app
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

      {/* Live Lendle Rates */}
      <section className="py-12 px-4 border-y border-glass-border bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Radio className="w-4 h-4 text-success animate-pulse" />
            <h3 className="text-lg font-semibold">Live Lendle Rates on Mantle</h3>
            {lendleMarkets.hasLiveData && (
              <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                Live
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Card className="glass border-glass-border p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase mb-1">USDC</div>
              <div className="text-2xl font-bold text-success">
                {lendleMarkets.isLoading ? '...' : lendleMarkets.USDC.supplyAPY ? `${lendleMarkets.USDC.supplyAPY}%` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Supply APY</div>
            </Card>
            <Card className="glass border-glass-border p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase mb-1">USDT</div>
              <div className="text-2xl font-bold text-success">
                {lendleMarkets.isLoading ? '...' : lendleMarkets.USDT.supplyAPY ? `${lendleMarkets.USDT.supplyAPY}%` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Supply APY</div>
            </Card>
            <Card className="glass border-glass-border p-4 text-center">
              <div className="text-xs text-muted-foreground uppercase mb-1">WETH</div>
              <div className="text-2xl font-bold text-success">
                {lendleMarkets.isLoading ? '...' : lendleMarkets.WETH.supplyAPY ? `${lendleMarkets.WETH.supplyAPY}%` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground">Supply APY</div>
            </Card>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Real-time data from Lendle Protocol on Mantle Mainnet
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why <span className="gradient-text">Faktory</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-glass-border p-8 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/10 group relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]">
                  Unique
                </Badge>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
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

            <Card className="glass border-glass-border p-8 hover:border-accent/30 transition-all hover:shadow-lg hover:shadow-accent/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Optimized</h3>
              <p className="text-muted-foreground text-pretty">
                Intelligent agents continuously optimize your yield strategies based on risk profiles.
              </p>
            </Card>

            <Card className="glass border-glass-border p-8 hover:border-success/30 transition-all hover:shadow-lg hover:shadow-success/10 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
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

            <Card className="glass border-glass-border p-8 relative z-10 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Upload Invoice</h3>
              <p className="text-muted-foreground text-center text-pretty">
                Mint your unpaid invoice as an NFT with encrypted commitment hash
              </p>
            </Card>

            <Card className="glass border-glass-border p-8 relative z-10 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-success flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Select Strategy</h3>
              <p className="text-muted-foreground text-center text-pretty">
                Choose conservative or aggressive yield optimization
              </p>
            </Card>

            <Card className="glass border-glass-border p-8 relative z-10 hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-primary flex items-center justify-center mb-6 mx-auto">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-center mb-3">Earn Yield</h3>
              <p className="text-muted-foreground text-center text-pretty">
                Watch your yield grow while AI optimizes your returns
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

          <div className="border-t border-glass-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>Built for Mantle Global Hackathon 2025</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
