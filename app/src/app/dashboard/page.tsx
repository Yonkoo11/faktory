"use client"

/**
 * Faktory Dashboard - Swiss Financial Terminal
 *
 * Design: Indigo + Emerald with alive animations
 * - High contrast, data-dense layout
 * - Indigo primary, emerald for yields
 * - Animated counters, breathing borders
 * - Terminal-inspired data presentation
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useInvoiceNFT } from "@/hooks/use-invoice-nft"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { formatUnits } from "viem"
import {
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { AnimatedCounter } from "@/components/animated-counter"

interface InvoiceDisplay {
  id: string
  tokenId: string
  amount: string
  amountRaw: number
  dueDate: string
  daysUntilDue: number
  strategy: string
  apy: string
  accruedYield: string
  status: string
  riskScore: number
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { address, isConnected } = useAccount()
  const { totalInvoices } = useInvoiceNFT()
  const { tvl, totalYield, activeDepositsCount, conservativeAPY, aggressiveAPY } = useYieldVault()

  const fetchInvoices = async () => {
    if (!isConnected) {
      setInvoices([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invoices?active=true`)
      const data = await response.json()

      if (data.success && data.data.invoices) {
        const formattedInvoices: InvoiceDisplay[] = data.data.invoices.map((inv: any) => {
          const dueDate = new Date(inv.dueDate)
          const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          const principal = inv.deposit ? Number(formatUnits(BigInt(inv.deposit.principal), 18)) : 0
          return {
            id: `INV-${String(inv.tokenId).padStart(4, '0')}`,
            tokenId: inv.tokenId,
            amount: `$${principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            amountRaw: principal,
            dueDate: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            daysUntilDue,
            strategy: inv.deposit?.strategy || "—",
            apy: inv.deposit?.strategy === "Aggressive" ? `${aggressiveAPY}%` : inv.deposit?.strategy === "Conservative" ? `${conservativeAPY}%` : "—",
            accruedYield: inv.deposit ? `+$${Number(formatUnits(BigInt(inv.deposit.accruedYield), 18)).toFixed(2)}` : "$0.00",
            status: inv.status,
            riskScore: inv.riskScore || 75,
          }
        })
        setInvoices(formattedInvoices)
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err)
      setError("Failed to load invoices. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [isConnected, conservativeAPY, aggressiveAPY])

  const filteredInvoices = invoices.filter((inv) =>
    inv.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tvlFormatted = Number(formatUnits(BigInt(tvl || 0), 18))
  const yieldFormatted = Number(formatUnits(BigInt(totalYield || 0), 18))

  return (
    <div className="min-h-screen bg-background noise-texture">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.svg" alt="Faktory" className="w-8 h-8" />
                <span className="font-display font-semibold text-lg tracking-tight">Faktory</span>
              </Link>

              {/* Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted rounded-md"
                >
                  Portfolio
                </Link>
                <Link
                  href="/dashboard/mint"
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mint
                </Link>
                <Link
                  href="/dashboard/agent"
                  className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Agent
                </Link>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <div className="network-badge">
                Cronos Testnet
              </div>
              {isConnected && address && (
                <div className="hidden md:flex items-center px-3 py-1.5 bg-muted rounded-md font-mono text-sm" suppressHydrationWarning>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="headline-editorial text-3xl mb-1">Portfolio</h1>
            <p className="text-muted-foreground">Manage your invoice yield positions</p>
          </div>
          <Link
            href="/dashboard/mint"
            className="btn-primary-lg pulse-glow"
          >
            <Plus className="w-4 h-4" />
            Mint Invoice
          </Link>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* TVL */}
          <div className="stat-card breathing-border">
            <div className="stat-card-label">Total Value</div>
            <div className="stat-card-value font-data">
              <AnimatedCounter
                end={Math.floor(tvlFormatted)}
                prefix="$"
                suffix={tvlFormatted % 1 > 0 ? `.${String(tvlFormatted.toFixed(2)).split('.')[1]}` : '.00'}
              />
            </div>
          </div>

          {/* Total Yield */}
          <div className="stat-card breathing-border" style={{ borderLeftColor: 'var(--accent)', borderLeftWidth: '3px' }}>
            <div className="stat-card-label">Total Yield</div>
            <div className="stat-card-value font-data text-success">
              +<AnimatedCounter
                end={Math.floor(yieldFormatted)}
                prefix="$"
                suffix={yieldFormatted % 1 > 0 ? `.${String(yieldFormatted.toFixed(2)).split('.')[1]}` : '.00'}
              />
            </div>
          </div>

          {/* Active Positions */}
          <div className="stat-card breathing-border">
            <div className="stat-card-label">Active Positions</div>
            <div className="stat-card-value font-data">
              <AnimatedCounter end={activeDepositsCount} />
            </div>
          </div>

          {/* APY Range */}
          <div className="stat-card breathing-border">
            <div className="stat-card-label">APY Range</div>
            <div className="stat-card-value font-data text-gradient-hero">
              <AnimatedCounter end={Number(conservativeAPY)} />–<AnimatedCounter end={Number(aggressiveAPY)} suffix="%" />
            </div>
          </div>
        </div>

        {/* Invoices Section */}
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-display font-semibold text-lg">Invoices</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-48 text-sm bg-muted border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button className="p-2 hover:bg-muted rounded-md transition-colors">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-destructive/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2 text-destructive">Error Loading Data</h3>
              <p className="text-muted-foreground text-sm mb-6">{error}</p>
              <button
                onClick={fetchInvoices}
                className="btn-primary inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">No invoices yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Mint your first invoice NFT to start earning yield</p>
              <Link href="/dashboard/mint" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Mint Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Strategy</th>
                    <th>APY</th>
                    <th>Yield</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.tokenId}
                      className="cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoice/${invoice.tokenId}`}
                    >
                      <td className="font-semibold text-foreground">{invoice.id}</td>
                      <td>{invoice.amount}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          {invoice.dueDate}
                          {invoice.daysUntilDue <= 7 && invoice.daysUntilDue > 0 && (
                            <span className="text-warning text-xs">({invoice.daysUntilDue}d)</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${invoice.strategy === 'Aggressive' ? 'badge-amber' : 'badge-neutral'}`}>
                          {invoice.strategy}
                        </span>
                      </td>
                      <td className="text-foreground">{invoice.apy}</td>
                      <td className="text-success font-semibold">{invoice.accruedYield}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`status-dot ${invoice.status === 'InYield' ? 'status-active' : invoice.status === 'Minted' ? 'status-pending' : 'status-inactive'}`} />
                          <span className="text-xs text-muted-foreground">
                            {invoice.status === 'InYield' ? 'Active' : invoice.status === 'Minted' ? 'Pending' : invoice.status}
                          </span>
                        </span>
                      </td>
                      <td className="text-right">
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          {filteredInvoices.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
              <span className="text-sm text-muted-foreground">
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} • {totalInvoices} total minted
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                AI agent monitoring
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
