"use client"

/**
 * Faktory Protocol - Landing Page
 * Terminal/Bloomberg aesthetic - Monospace, data-dense, green accents
 * ALIVE: Grid background, noise texture, typing animation, stagger effects
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusBar } from "@/components/ui/status-bar"
import { TickerValue } from "@/components/ticker-value"
import { useLendleMarkets } from '@/hooks/use-lendle'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const lendleMarkets = useLendleMarkets()

  const fullText = 'YOUR AI TREASURY AGENT'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Typing animation
  useEffect(() => {
    if (!mounted) return

    let i = 0
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayText(fullText.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 60)

    return () => clearInterval(interval)
  }, [mounted])

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-6">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 h-12 border-b border-[#1f1f1f] bg-[#0a0a0a]/95 backdrop-blur-sm px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#10b981] rounded" />
          <span className="font-semibold text-sm">
            <span className="text-[#10b981]">f</span>aktory
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {mounted && isConnected && address ? (
            <button
              onClick={() => disconnect()}
              className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors"
            >
              {address.slice(0, 6)}...{address.slice(-4)}
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              disabled={isPending}
              className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors"
            >
              connect
            </button>
          )}

          <Link href="/dashboard">
            <Button size="sm">
              launch app
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 relative glow-accent">
        <div className="text-center relative z-10">
          {/* Headline with typing effect */}
          <h1 className="text-[32px] font-bold leading-tight mb-2 stagger-1">
            {displayText}
            <span className="cursor-blink">_</span>
          </h1>
          <p className="text-[24px] font-semibold text-[#10b981] mb-8 stagger-2">
            for B2B Commerce
          </p>

          {/* Subheadline */}
          <p className="text-[14px] text-[#666666] max-w-xl mx-auto mb-10 leading-relaxed stagger-3">
            Autonomous AI manages your invoices 24/7. Tokenize, optimize yield, settle via x402.
            <br />
            <span className="text-[#e5e5e5]">Machines handling real financial decisions.</span>
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-4 mb-16 stagger-4">
            <Link href="/dashboard">
              <Button size="lg">
                start earning
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/anthropics/x402-faktory"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                view source
              </Button>
            </a>
          </div>

          {/* Live Ticker */}
          <div className="live-ticker inline-flex stagger-5">
            <div className="flex items-center gap-2 mr-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
              <span className="text-[#666666]">LIVE</span>
            </div>
            <TickerValue label="USDC" value={lendleMarkets.USDC.supplyAPY || '0.00'} />
            <TickerValue label="USDT" value={lendleMarkets.USDT.supplyAPY || '0.00'} />
            <TickerValue label="WETH" value={lendleMarkets.WETH.supplyAPY || '0.00'} />
          </div>
        </div>
      </section>

      {/* How It Works - Terminal Steps */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="terminal-card p-6 stagger-1">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">01</div>
            <h3 className="text-[14px] font-semibold mb-2">TOKENIZE</h3>
            <p className="text-[12px] text-[#666666] leading-relaxed">
              Agent mints your invoice as a privacy-preserving NFT on Cronos.
            </p>
          </div>

          {/* Step 2 */}
          <div className="terminal-card p-6 stagger-2">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">02</div>
            <h3 className="text-[14px] font-semibold mb-2">OPTIMIZE</h3>
            <p className="text-[12px] text-[#666666] leading-relaxed">
              AI deploys capital to yield strategies. Rebalances 24/7 autonomously.
            </p>
          </div>

          {/* Step 3 */}
          <div className="terminal-card p-6 stagger-3">
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-3">03</div>
            <h3 className="text-[14px] font-semibold mb-2">SETTLE</h3>
            <p className="text-[12px] text-[#666666] leading-relaxed">
              Client pays on-chain via x402. Instant settlement, no intermediaries.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="max-w-4xl mx-auto px-6 py-8 stagger-4">
        <div className="stats-grid grid-cols-3">
          <div className="stat-cell">
            <div className="stat-label">Target APY</div>
            <div className="stat-value stat-value-amber">3-7%</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Settlement</div>
            <div className="stat-value stat-value-green">x402</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Network</div>
            <div className="stat-value">CRONOS</div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="max-w-4xl mx-auto px-6 py-16 stagger-5">
        <div className="text-center">
          <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-8">Powered by</div>
          <div className="flex items-center justify-center gap-12">
            <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <span className="network-badge">CRONOS</span>
            </div>
            <div className="text-[14px] font-semibold text-[#666666] hover:text-[#10b981] transition-colors cursor-default">x402</div>
            <div className="text-[14px] font-semibold text-[#666666] hover:text-[#8b5cf6] transition-colors cursor-default">PYTH</div>
            <div className="text-[14px] font-semibold text-[#666666] hover:text-[#f59e0b] transition-colors cursor-default">LENDLE</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center stagger-6">
        <div className="terminal-card p-8">
          <h2 className="text-[24px] font-bold mb-4">
            Let AI manage your treasury
          </h2>
          <p className="text-[13px] text-[#666666] mb-8">
            The future of B2B commerce: autonomous agents, x402 settlement, zero intermediaries
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg">
                launch app
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 border-t border-[#1f1f1f]">
        <div className="flex items-center justify-between text-[11px] text-[#666666]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#10b981] rounded" />
            <span><span className="text-[#10b981]">f</span>aktory protocol</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Built for Cronos x402 PayTech Hackathon</span>
            <span>|</span>
            <span>Open Source</span>
          </div>
        </div>
      </footer>

      {/* Status Bar */}
      <StatusBar status="online" network="CRONOS TESTNET" />
    </div>
  )
}
