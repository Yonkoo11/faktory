"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, Zap, Lock, TrendingUp, Wallet, Radio, Menu, X, HelpCircle } from "lucide-react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected} from 'wagmi/connectors'
import { useLendleMarkets } from '@/hooks/use-lendle'
import { useProtocolStats } from '@/hooks/use-protocol-stats'
import { CostCalculator } from '@/components/cost-calculator'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { IconBox } from '@/components/ui/icon-box'

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
      {/* Testnet Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-black py-1.5 text-center text-sm font-medium">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black/30 animate-pulse" />
          Testnet Mode — Mantle Sepolia
          <a
            href="https://faucet.sepolia.mantle.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline ml-2"
          >
            Get test MNT
          </a>
        </span>
      </div>

      {/* Header */}
      <header className="fixed top-8 w-full z-50 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold">Faktory Protocol</span>
          </div>

          {/* Desktop Navigation */}
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
            {/* Desktop Wallet Button */}
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

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-card border-border">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-white font-bold text-xl">F</span>
                    </div>
                    <span className="text-xl font-bold text-primary">Faktory</span>
                  </div>

                  <nav className="flex flex-col gap-4">
                    <Link href="#features" className="text-lg font-medium hover:text-primary transition-colors">
                      Features
                    </Link>
                    <Link href="#how-it-works" className="text-lg font-medium hover:text-primary transition-colors">
                      How It Works
                    </Link>
                    <Link href="#security" className="text-lg font-medium hover:text-primary transition-colors">
                      Security
                    </Link>
                  </nav>

                  <div className="border-t border-border pt-4 mt-2">
                    {mounted && isConnected && address ? (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => disconnect()}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => connect({ connector: injected() })}
                        disabled={isPending}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        {isPending ? 'Connecting...' : 'Connect Wallet'}
                      </Button>
                    )}
                  </div>

                  <Link href="/dashboard" className="mt-2">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                      Launch App
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Launch App Button */}
            <Link href="/dashboard" className="hidden md:block">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Launch App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden">

        <div className="container mx-auto max-w-6xl relative z-10">
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
                <span className="text-[80px] md:text-[140px] font-black leading-none text-primary tracking-tight">3-7%</span>
                <span className="text-[40px] md:text-[70px] font-bold text-muted-foreground">APY</span>
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
            <div className="flex items-center justify-center gap-4 sm:gap-8 pt-4 text-sm">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">&lt;1 min</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Time to yield</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border" />
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">$0</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Platform fees</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border" />
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">24/7</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Withdrawals</div>
              </div>
            </div>

            {/* Live Lendle Rates - Mobile responsive */}
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4 px-4">
              <Radio className="w-3 h-3 text-success animate-pulse" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Live Lendle Rates:</span>
              <span className="text-xs font-medium whitespace-nowrap">
                USDC <span className="text-success">{lendleMarkets.isLoading ? '...' : `${lendleMarkets.USDC.supplyAPY || 'N/A'}%`}</span>
              </span>
              <span className="text-muted-foreground hidden sm:inline">|</span>
              <span className="text-xs font-medium whitespace-nowrap">
                USDT <span className="text-success">{lendleMarkets.isLoading ? '...' : `${lendleMarkets.USDT.supplyAPY || 'N/A'}%`}</span>
              </span>
              <span className="text-muted-foreground hidden sm:inline">|</span>
              <span className="text-xs font-medium whitespace-nowrap">
                WETH <span className="text-success">{lendleMarkets.isLoading ? '...' : `${lendleMarkets.WETH.supplyAPY || 'N/A'}%`}</span>
              </span>
            </div>

            <div className="flex flex-col items-center gap-4 pt-6">
              <Link href="/dashboard">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg h-14 px-10">
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
              className="card-elevated p-8 max-w-4xl mx-auto relative animate-fade-in"
              style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}
            >
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  Mantle Sepolia
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Value Locked</div>
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    {protocolStats.tvlFormatted}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Invoices Minted</div>
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    {protocolStats.totalInvoices}
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider">Target APY</div>
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    3-7%
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Social Proof & Trust */}
          <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Mantle Global Hackathon 2025</span>
            </div>

            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">Powered By</p>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-4 text-sm max-w-3xl mx-auto">
              {/* Mantle - with brand color */}
              <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#65B3AE] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">M</span>
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors text-xs sm:text-sm">Mantle L2</span>
              </div>

              {/* Lendle */}
              <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors text-xs sm:text-sm">Lendle</span>
              </div>

              {/* Pyth */}
              <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#7142CF] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs sm:text-sm">P</span>
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors text-xs sm:text-sm">Pyth Network</span>
              </div>

              {/* Anthropic Claude */}
              <div className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warning flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="font-semibold text-foreground/90 group-hover:text-foreground transition-colors text-xs sm:text-sm">AI Agent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why <span className="text-primary">Faktory</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-flat p-8 hover-lift hover:border-primary/40 transition-all relative group">
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px]">
                  Unique
                </Badge>
              </div>
              <IconBox icon={Lock} variant="primary" className="mb-6" />
              <h3 className="text-xl font-bold mb-3 text-foreground">Privacy by Default</h3>
              <p className="text-muted-foreground text-pretty mb-4">
                Your invoice data stays yours. We use cryptographic commitment hashes—only you decide who sees the details.
              </p>
              <div className="text-xs text-muted-foreground border-t border-border pt-3">
                <span className="text-primary font-medium">Unlike competitors</span>: No public disclosure of clients, amounts, or contracts required.
              </div>
            </Card>

            <Card className="card-flat p-8 hover-lift hover:border-primary/40 transition-all group">
              <IconBox icon={Zap} variant="primary" className="mb-6" />
              <h3 className="text-xl font-bold mb-3 text-foreground">AI-Optimized</h3>
              <p className="text-muted-foreground text-pretty">
                Intelligent agents continuously optimize your yield strategies based on market conditions.
              </p>
            </Card>

            <Card className="card-flat p-8 hover-lift hover:border-success/40 transition-all group">
              <IconBox icon={TrendingUp} variant="success" className="mb-6" />
              <h3 className="text-xl font-bold mb-3 text-success">Real DeFi Yield</h3>
              <p className="text-muted-foreground text-pretty">
                Earn up to 7% APY from real lending protocols, not inflationary token emissions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Trust Us - Security Section */}
      <section id="security" className="py-20 px-4">
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
            <Card className="card-flat p-6 text-center">
              <IconBox icon={Lock} variant="success" className="mx-auto mb-4" />
              <div className="text-2xl font-bold mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
              <p className="text-xs text-muted-foreground mt-2">
                All contracts verified on Mantlescan
              </p>
            </Card>

            <Card className="card-flat p-6 text-center">
              <IconBox icon={Lock} variant="primary" className="mx-auto mb-4" />
              <div className="text-2xl font-bold mb-1">No Admin Keys</div>
              <div className="text-sm text-muted-foreground">Immutable Logic</div>
              <p className="text-xs text-muted-foreground mt-2">
                No backdoors, no rug pulls possible
              </p>
            </Card>

            <Card className="card-flat p-6 text-center">
              <IconBox icon={TrendingUp} variant="primary" className="mx-auto mb-4" />
              <div className="text-2xl font-bold mb-1">Real Yield</div>
              <div className="text-sm text-muted-foreground">From Lendle</div>
              <p className="text-xs text-muted-foreground mt-2">
                Battle-tested lending protocol
              </p>
            </Card>

            <Card className="card-flat p-6 text-center">
              <IconBox icon={Zap} variant="primary" className="mx-auto mb-4" />
              <div className="text-2xl font-bold mb-1">Pyth Oracle</div>
              <div className="text-sm text-muted-foreground">Price Feeds</div>
              <p className="text-xs text-muted-foreground mt-2">
                Institutional-grade data
              </p>
            </Card>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border">
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
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why <span className="text-primary">Mantle</span>?
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            Ultra-low transaction costs make AI-powered optimization economically viable.
          </p>

          {/* Cost Calculator */}
          <CostCalculator />
        </div>
      </section>

      {/* How It Works Visualization */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Simple. Secure. <span className="text-primary">Profitable.</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Three steps to turn your invoices into yield
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line for desktop */}
            <div className="hidden md:block absolute top-1/3 left-1/3 right-1/3 h-0.5 bg-primary/30" />

            <Card className="card-flat p-8 relative z-10 hover-lift hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 mx-auto transition-all">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Mint Invoice</h3>
              <p className="text-sm text-muted-foreground text-center">
                Tokenize your unpaid invoice as an NFT with privacy-preserving commitment hash
              </p>
            </Card>

            <Card className="card-flat p-8 relative z-10 hover-lift hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 mx-auto transition-all">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-bold text-center mb-2">Deposit</h3>
              <p className="text-sm text-muted-foreground text-center">
                Choose a yield strategy and deposit to start earning immediately
              </p>
            </Card>

            <Card className="card-flat p-8 relative z-10 hover-lift hover:border-success/40 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center mb-6 mx-auto transition-all">
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
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Frequently Asked Questions</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Got Questions?</h2>
            <p className="text-muted-foreground">
              Everything you need to know about Faktory Protocol
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="what-is" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                What is Faktory Protocol?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Faktory Protocol is a DeFi platform that lets you tokenize your unpaid invoices as NFTs and earn yield on them while waiting for payment. We leverage AI agents to optimize your yield strategies across DeFi lending protocols like Lendle on Mantle L2.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-start" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                How do I get started?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Simply connect your wallet, mint an invoice NFT by entering your invoice details, then deposit it to start earning yield. The entire process takes under 2 minutes. You can withdraw your funds anytime with no penalties or lockup periods.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="strategies" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                What's the difference between Conservative and Aggressive strategies?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <strong className="text-foreground">Conservative (3-5% APY):</strong> Focuses on stablecoins (USDC, USDT) in established lending protocols. Lower risk, stable returns.
                <br /><br />
                <strong className="text-foreground">Aggressive (5-7% APY):</strong> Includes higher-yield opportunities with assets like WETH. Higher potential returns with slightly more volatility.
                <br /><br />
                Both strategies are actively managed by our AI agent to maximize your returns while managing risk.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                Is my invoice data private?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We use cryptographic commitment hashes to protect your data. Your invoice details (client names, amounts, contracts) are never stored on-chain or disclosed publicly. Only you have access to the full invoice information.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="withdrawals" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                How do withdrawals work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Withdrawals are instant and available 24/7. There are no lockup periods, minimum hold times, or penalties. Simply click withdraw on your dashboard and your funds (principal + accrued yield) will be returned to your wallet immediately.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="fees" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                What are the fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <strong className="text-foreground">$0 platform fees.</strong> We don't charge any fees for minting, depositing, or withdrawing. The only costs are standard Mantle L2 gas fees (typically less than $0.01 per transaction). All yield earned is yours to keep.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="risk" className="glass border-glass-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                What are the risks?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                While we prioritize security, DeFi always carries risks: smart contract vulnerabilities, lending protocol failures, or asset price volatility. We mitigate these through: verified contracts, battle-tested protocols (Lendle), AI risk monitoring, and diversification. Always start small and only invest what you can afford to lose.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">Still have questions?</p>
            <Button asChild variant="outline" className="border-glass-border hover:border-primary/40">
              <Link href="/dashboard">
                Launch App & Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border glass py-12 px-4 mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-lg font-bold">Faktory</span>
              </div>
              <p className="text-sm text-muted-foreground">Tokenize invoices, earn yield.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
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
              <h4 className="font-semibold mb-3 text-sm">Resources</h4>
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
              <h4 className="font-semibold mb-3 text-sm">Community</h4>
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
