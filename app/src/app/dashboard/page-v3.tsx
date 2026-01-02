"use client"

/**
 * Faktory Protocol Dashboard V3 - Complete Redesign
 *
 * Design Paradigm: Dashboard-First, Light Theme
 * Visual Thesis: "Bloomberg Terminal meets Linear"
 *
 * Key Changes from V2:
 * - Light theme (white/gray-50 backgrounds)
 * - Data-first layout (portfolio metrics prominent)
 * - Emerald brand color (not blue)
 * - Generous whitespace
 * - Financial terminal aesthetic
 * - Monospace for numbers/data
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useInvoiceNFT } from "@/hooks/use-invoice-nft"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { formatUnits } from "viem"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  PlusCircle,
  Search,
  Filter,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Zap,
} from "lucide-react"

// Type for invoice display
interface InvoiceDisplay {
  id: string
  tokenId: string
  amount: string
  dueDate: string
  daysUntilDue: number
  strategy: string
  apy: string
  accruedYield: string
  status: string
  riskScore: number
  paymentProbability: number
}

export default function DashboardV3() {
  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const { address, isConnected } = useAccount()
  const { totalInvoices, userBalance, activeInvoices, isLoading: isLoadingNFT } = useInvoiceNFT()
  const { tvl, totalYield, activeDepositsCount, conservativeAPY, aggressiveAPY } = useYieldVault()

  // Fetch invoices from API
  useEffect(() => {
    async function fetchInvoices() {
      if (!isConnected) {
        setInvoices([])
        setIsLoadingInvoices(false)
        return
      }

      try {
        const response = await fetch(`/api/invoices?active=true`)
        const data = await response.json()

        if (data.success && data.data.invoices) {
          const formattedInvoices: InvoiceDisplay[] = data.data.invoices.map((inv: any) => {
            const dueDate = new Date(inv.dueDate)
            const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return {
              id: `INV-${inv.tokenId}`,
              tokenId: inv.tokenId,
              amount: inv.deposit ? `$${Number(formatUnits(BigInt(inv.deposit.principal), 18)).toLocaleString()}` : "$0",
              dueDate: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              daysUntilDue,
              strategy: inv.deposit?.strategy || "Hold",
              apy: inv.deposit?.strategy === "Aggressive" ? `${aggressiveAPY}%` : inv.deposit?.strategy === "Conservative" ? `${conservativeAPY}%` : "0.0%",
              accruedYield: inv.deposit ? `~$${Number(formatUnits(BigInt(inv.deposit.accruedYield), 18)).toFixed(0)}` : "$0",
              status: inv.status,
              riskScore: inv.riskScore || 75,
              paymentProbability: inv.paymentProbability || 85,
            }
          })
          setInvoices(formattedInvoices)
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error)
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [isConnected, conservativeAPY, aggressiveAPY])

  // Filter invoices based on search
  const filteredInvoices = invoices.filter((inv) =>
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.amount.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Faktory</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-900 border-b-2 border-emerald-500 pb-1"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/mint"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Mint
              </Link>
              <Link
                href="/dashboard/agent"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Agent
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                Mantle
              </span>
              {isConnected && address && (
                <span className="hidden md:inline-block px-3 py-1.5 rounded-md text-sm font-mono text-gray-700 bg-gray-100">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Portfolio</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your invoice yield portfolio</p>
            </div>
            <Link
              href="/dashboard/mint"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Mint Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Value */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Value</span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-gray-900">
              ${Number(formatUnits(tvl, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5% this month</span>
            </div>
          </div>

          {/* Total Yield */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Yield</span>
              <Zap className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-gray-900">
              ${Number(formatUnits(totalYield, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>+8.2% this month</span>
            </div>
          </div>

          {/* Active Invoices */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Invoices</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-gray-900">
              {activeDepositsCount}
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
              <span>{totalInvoices} total minted</span>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* Table Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Invoices</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                  <Filter className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {isLoadingInvoices ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600 mt-4">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-sm text-gray-600 mb-6">Get started by minting your first invoice NFT</p>
              <Link
                href="/dashboard/mint"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Mint Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Strategy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      APY
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Yield
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.tokenId}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/invoice/${invoice.tokenId}`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {invoice.id}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {invoice.amount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {invoice.dueDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          {invoice.strategy}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {invoice.apy}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-emerald-600">
                        {invoice.accruedYield}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {invoice.status === "InYield" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Active
                          </span>
                        ) : invoice.status === "Paid" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
