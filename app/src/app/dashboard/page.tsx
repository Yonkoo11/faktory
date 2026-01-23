"use client"

/**
 * Faktory Dashboard - Terminal/Bloomberg Aesthetic
 * Monospace, data-dense, green accents
 * ALIVE: Grid background, stagger animations, pulse effects
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useInvoiceNFT } from "@/hooks/use-invoice-nft"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { formatUnits } from "viem"
import { Plus, ArrowUpRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBar } from "@/components/ui/status-bar"
import { ThemeToggle } from "@/components/theme-toggle"
import { MiniActivityFeed } from "@/components/mini-activity-feed"

interface InvoiceResponse {
  tokenId: string
  dueDate: string
  status: string
  riskScore?: number
  deposit?: {
    principal: string
    accruedYield: string
    strategy?: string
  }
}

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
        const formattedInvoices: InvoiceDisplay[] = data.data.invoices.map((inv: InvoiceResponse) => {
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
            strategy: inv.deposit?.strategy?.toLowerCase() || "—",
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
      setError("Failed to load invoices")
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
    <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 h-12 border-b border-[#1f1f1f] bg-[#0a0a0a] px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#10b981] rounded" />
            <span className="font-semibold text-sm">
              <span className="text-[#10b981]">f</span>aktory
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-xs text-[#e5e5e5] bg-[#1a1a1a] rounded"
            >
              portfolio
            </Link>
            <Link
              href="/dashboard/mint"
              className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors"
            >
              mint
            </Link>
            <Link
              href="/dashboard/agent"
              className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors"
            >
              agent
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="network-badge">CRONOS</span>
          {isConnected && address && (
            <span className="px-3 py-1.5 text-xs bg-[#111111] border border-[#1f1f1f] rounded">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-8 stagger-1">
          <div>
            <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">
              Total Portfolio Value
            </div>
            <div className="text-[32px] font-bold tabular-nums">
              <span className="text-[#666666]">$</span>
              <span className="text-[#10b981]">{tvlFormatted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <Link href="/dashboard/mint">
            <Button>
              <Plus className="w-4 h-4" />
              mint invoice
            </Button>
          </Link>
        </div>

        {/* Stats Grid - Bloomberg style */}
        <div className="stats-grid grid-cols-4 mb-6 stagger-2">
          <div className="stat-cell">
            <div className="stat-label flex items-center gap-2">
              TVL
              <span className="w-1 h-1 rounded-full bg-[#10b981] status-pulse" />
            </div>
            <div className="stat-value tabular-nums">${tvlFormatted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label flex items-center gap-2">
              Yield Earned
              <span className="w-1 h-1 rounded-full bg-[#10b981] status-pulse" />
            </div>
            <div className="stat-value stat-value-green tabular-nums">+${yieldFormatted.toFixed(2)}</div>
            {tvlFormatted > 0 && (
              <div className="text-[11px] text-[#10b981] mt-1">+{((yieldFormatted / tvlFormatted) * 100).toFixed(2)}%</div>
            )}
          </div>
          <div className="stat-cell">
            <div className="stat-label">Active Invoices</div>
            <div className="stat-value tabular-nums">{activeDepositsCount}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label flex items-center gap-2">
              APY Range
              <span className="w-1 h-1 rounded-full bg-[#f59e0b]" />
            </div>
            <div className="stat-value stat-value-amber tabular-nums">{conservativeAPY}-{aggressiveAPY}%</div>
            <div className="text-[10px] text-[#666666] mt-1">via Lendle</div>
          </div>
        </div>

        {/* Mini Activity Feed */}
        <div className="terminal-card p-4 mb-8 stagger-3">
          <MiniActivityFeed />
        </div>

        {/* Invoices Table */}
        <div className="border border-[#1f1f1f] rounded overflow-hidden stagger-4">
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f] bg-[#111111]">
            <span className="text-xs font-semibold">invoices</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border border-[#1f1f1f] rounded text-xs">
                <span className="text-[#666666]">search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-24 text-[#e5e5e5]"
                  placeholder="_"
                />
                <span className="cursor-blink text-[#666666]">|</span>
              </div>
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-4 h-4 border-2 border-[#1f1f1f] border-t-[#10b981] rounded-full animate-spin mb-3" />
              <p className="text-xs text-[#666666]">loading invoices...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-[#ef4444] text-xs mb-4">{error}</div>
              <Button variant="secondary" size="sm" onClick={fetchInvoices}>
                <RefreshCw className="w-3 h-3" />
                retry
              </Button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                <span className="text-[10px] text-[#666666] uppercase tracking-wider">Agent Standing By</span>
              </div>
              <div className="text-xs text-[#666666] mb-2">no invoices yet</div>
              <div className="text-[11px] text-[#444444] mb-6">mint your first invoice to start earning yield</div>
              <Link href="/dashboard/mint">
                <Button size="sm">
                  <Plus className="w-3 h-3" />
                  mint invoice
                </Button>
              </Link>
            </div>
          ) : (
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>ID</th>
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
                    <td className="text-[#10b981] font-semibold">{invoice.id}</td>
                    <td className="font-semibold tabular-nums">{invoice.amount}</td>
                    <td className="text-[#666666]">{invoice.dueDate}</td>
                    <td>{invoice.strategy}</td>
                    <td className="tabular-nums">{invoice.apy}</td>
                    <td className="text-[#10b981] font-semibold tabular-nums">{invoice.accruedYield}</td>
                    <td>
                      <span className={`status-badge ${invoice.status === 'InYield' ? 'status-active' : 'status-pending'}`}>
                        <span className="status-dot" />
                        {invoice.status === 'InYield' ? 'active' : invoice.status === 'Minted' ? 'pending' : invoice.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="text-right">
                      <ArrowUpRight className="w-4 h-4 text-[#666666]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Table Footer */}
          {filteredInvoices.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1f1f1f] bg-[#111111] text-[11px] text-[#666666]">
              <span>{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} | {totalInvoices} total minted</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                agent monitoring
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar status="online" network="CRONOS TESTNET" />
    </div>
  )
}
