"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TrendingUp, Wallet, FileText, MoreVertical, ArrowUpRight, Search, Filter, Loader2, Shield, CheckCircle2, Clock, AlertTriangle, Info, RefreshCw, Zap, Lock } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { DepositModal } from "@/features/vault"
import { SkeletonCard, SkeletonPortfolioCard, SkeletonInvoiceCard, SkeletonInvoiceTable } from "@/components/ui/skeleton-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useInvoiceNFT } from "@/hooks/use-invoice-nft"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { formatUnits } from "viem"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/ui/stat-card"
import { IconBox } from "@/components/ui/icon-box"
import { RiskBadge } from "@/components/domain/invoices/risk-badge"
import { YieldChart, PortfolioAllocation, RiskDistribution, PerformanceMetrics, useAnalytics } from "@/features/analytics"

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

export default function DashboardPage() {
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<{ id: string; amount: string } | null>(null)
  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const { address, isConnected } = useAccount()
  const { totalInvoices, userBalance, activeInvoices, isLoading: isLoadingNFT } = useInvoiceNFT()
  const { tvl, totalYield, activeDepositsCount, conservativeAPY, aggressiveAPY } = useYieldVault()
  const { allocationData, riskDistribution, yieldHistory, performanceMetrics, isLoading: isLoadingAnalytics } = useAnalytics()

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
          const formattedInvoices: InvoiceDisplay[] = data.data.invoices.map((inv: {
            tokenId: string
            status: string
            dueDate: string
            riskScore?: number
            paymentProbability?: number
            deposit?: {
              principal: string
              strategy: string
              accruedYield: string
            }
          }) => {
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
        setInvoiceError("Failed to load invoices")
        toast.error("Failed to load invoices", {
          description: "Please check your connection and try again"
        })
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [isConnected, conservativeAPY, aggressiveAPY])

  const retryFetchInvoices = () => {
    setIsLoadingInvoices(true)
    setInvoiceError(null)
    // Re-trigger the useEffect by toggling a state (will be handled by the dependency array)
    window.location.reload()
  }

  const handleDeposit = (invoiceId: string, amount: string) => {
    setSelectedInvoice({ id: invoiceId, amount })
    setDepositModalOpen(true)
  }

  // Calculate totals
  const portfolioValue = parseFloat(tvl) || 0
  const totalYieldEarned = parseFloat(totalYield) || 0
  const activeCount = activeDepositsCount || invoices.length

  // Calculate average APY
  const avgAPY = activeCount > 0 ? (conservativeAPY + aggressiveAPY) / 2 : 0

  // Filter invoices based on search and filter status
  const allInvoices = invoiceError ? [] : (invoices.length > 0 ? invoices : (isConnected ? mockInvoices : []))

  const filteredInvoices = allInvoices.filter((invoice) => {
    // Search filter
    const matchesSearch = searchQuery === "" ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && (invoice.status === "Active" || invoice.status === "In Yield")) ||
      (filterStatus === "hold" && invoice.status === "Hold") ||
      (filterStatus === "at-risk" && invoice.status === "At Risk")

    return matchesSearch && matchesStatus
  })

  const displayInvoices = filteredInvoices

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Protocol Health Banner - Institutional Trust Signal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-success/5 border border-success/20">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs sm:text-sm font-medium">Protocol Status: Operational</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
              <span><span className="font-semibold text-foreground">0%</span> default rate</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hidden md:flex">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span><span className="font-semibold text-foreground">100%</span> withdrawal success</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hidden lg:flex">
              <Clock className="w-4 h-4 text-primary" />
              <span>Yield starts in <span className="font-semibold text-foreground">&lt;1 min</span></span>
            </div>
          </div>
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs flex items-center gap-1 self-start sm:self-auto">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live on Mantle
          </Badge>
        </div>

        {/* Performance Metrics - Key Analytics */}
        {!isLoadingAnalytics && (
          <PerformanceMetrics metrics={performanceMetrics} />
        )}

        {/* Portfolio Overview Cards - Hero metric + supporting metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {isLoadingNFT ? (
            <>
              <SkeletonPortfolioCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              {/* Primary Metric - Portfolio Value - Premium Design */}
              <Card className="card-glass p-8 lg:row-span-2 border-primary/30 hover-glow transition-all relative overflow-hidden">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] flex items-center justify-center shadow-lg">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Portfolio Value</span>
                    <div className="text-5xl font-black bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] bg-clip-text text-transparent">
                      <AnimatedCounter value={portfolioValue} prefix="$" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
                  <div>
                    <div className="text-3xl font-bold text-success">
                      <AnimatedCounter value={totalYieldEarned} decimals={2} prefix="~$" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Yield Earned</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      <AnimatedCounter value={avgAPY} decimals={1} suffix="%" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Average APY</div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border/50 flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">No lockup period — withdraw anytime</span>
                </div>
              </Card>

              {/* Secondary Metrics */}
              <StatCard
                title="Active Invoices"
                value={activeCount}
                subtitle={`${userBalance} owned by you`}
                icon={FileText}
                variant="success"
                className="hover-glow hover:border-success/50 card-elevated"
              />

              <StatCard
                title="Strategy Distribution"
                value={activeCount > 0 ? 'Mixed' : 'No deposits'}
                subtitle={activeCount > 0 ? 'Conservative + Aggressive' : 'Deposit to start earning'}
                icon={TrendingUp}
                variant="primary"
                className="hover-glow hover:border-primary/50 card-elevated"
              />
            </>
          )}
        </div>

        {/* Yield Chart - Professional Analytics */}
        {!isLoadingAnalytics && (
          <YieldChart data={yieldHistory} />
        )}

        {/* Analytics Grid - Portfolio Allocation & Risk Distribution */}
        {!isLoadingAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PortfolioAllocation data={allocationData} />
            <RiskDistribution data={riskDistribution} />
          </div>
        )}

        {/* Invoice Table */}
        <Card className="card-flat relative">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Your Invoices</h2>
                <p className="text-sm text-muted-foreground">Manage and track your tokenized invoices</p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-9 bg-background/50 border-border"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`border-border bg-background/50 ${filterStatus !== 'all' ? 'border-primary bg-primary/10' : ''}`}
                      aria-label="Filter invoices"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="card-flat">
                    <DropdownMenuItem onClick={() => setFilterStatus("all")} className={filterStatus === "all" ? "bg-primary/10" : ""}>
                      All Invoices
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("active")} className={filterStatus === "active" ? "bg-primary/10" : ""}>
                      Active & In Yield
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("hold")} className={filterStatus === "hold" ? "bg-primary/10" : ""}>
                      On Hold
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("at-risk")} className={filterStatus === "at-risk" ? "bg-primary/10" : ""}>
                      At Risk
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingInvoices ? (
              <>
                {/* Mobile Skeleton Cards */}
                <div className="md:hidden divide-y divide-glass-border">
                  {[...Array(3)].map((_, i) => (
                    <SkeletonInvoiceCard key={i} />
                  ))}
                </div>
                {/* Desktop Skeleton Table */}
                <div className="hidden md:block">
                  <SkeletonInvoiceTable />
                </div>
              </>
            ) : invoiceError ? (
              <div className="text-center py-12 px-8">
                <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Failed to load invoices</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                  There was an error loading your invoices. Please check your connection and try again.
                </p>
                <Button onClick={retryFetchInvoices} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            ) : displayInvoices.length === 0 ? (
              <div className="text-center py-16 px-8">
                <div className="mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 text-primary">Ready to Start Earning?</h3>
                <p className="text-base text-muted-foreground max-w-md mx-auto mb-8">
                  Transform your unpaid invoices into yield-generating assets.
                  <span className="text-foreground font-medium"> Most users mint their first invoice in under 2 minutes</span>
                  and start earning 3-7% APY immediately.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-sm font-medium mb-1">Mint Invoice</div>
                    <div className="text-xs text-muted-foreground">Tokenize your unpaid invoice</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-sm font-medium mb-1">Deposit</div>
                    <div className="text-xs text-muted-foreground">Choose your yield strategy</div>
                  </div>
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-sm font-medium mb-1">Earn</div>
                    <div className="text-xs text-muted-foreground">Watch your yield grow</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button asChild variant="gradient" size="lg" className="shadow-xl hover:shadow-2xl">
                    <Link href="/dashboard/mint">
                      <FileText className="w-4 h-4 mr-2" />
                      Mint Your First Invoice
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-border hover:border-primary/40 hover:bg-primary/5">
                    <Link href="/#how-it-works">
                      Learn How It Works
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4 border-t border-border max-w-md mx-auto">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-success" />
                    <span>0% default rate</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span>Instant withdrawals</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-accent" />
                    <span>No lockups</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout - Optimized for Touch */}
                <div className="md:hidden divide-y divide-glass-border">
                  {displayInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-5 hover:bg-muted/10 transition-colors"
                    >
                      {/* Header with Invoice ID and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <Link
                          href={`/dashboard/invoice/${invoice.tokenId || invoice.id}`}
                          className="flex items-center gap-3 flex-1 min-w-0 active:opacity-70 transition-opacity"
                        >
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-medium text-sm text-muted-foreground truncate">{invoice.id}</div>
                            <div className="text-xl font-bold truncate">{invoice.amount}</div>
                          </div>
                        </Link>
                        <StatusBadge status={invoice.status} />
                      </div>

                      {/* Key Metrics - Better spacing on mobile */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs uppercase tracking-wide">Due Date</div>
                          <div className={`font-semibold ${invoice.daysUntilDue < 0 ? 'text-destructive' : invoice.daysUntilDue < 7 ? 'text-warning' : 'text-foreground'}`}>
                            {invoice.daysUntilDue < 0 ? 'Overdue' : `${invoice.daysUntilDue} days`}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs uppercase tracking-wide">Accrued Yield</div>
                          <div className="text-success font-semibold">{invoice.accruedYield}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs uppercase tracking-wide">APY Rate</div>
                          <div className={invoice.apy === "0.0%" ? "text-muted-foreground font-semibold" : "text-success font-semibold"}>
                            {invoice.apy}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground text-xs uppercase tracking-wide">Risk Score</div>
                          <div>
                            <RiskBadge score={invoice.riskScore} />
                          </div>
                        </div>
                      </div>

                      {/* Action Button - 44px touch target */}
                      <Button
                        variant="gradient"
                        className="w-full h-11 text-base shadow-md"
                        onClick={() => handleDeposit(invoice.id, invoice.amount.replace("$", "").replace(",", ""))}
                      >
                        {invoice.strategy === "Hold" ? "Deposit to Earn Yield" : "Manage Strategy"}
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Invoice</TableHead>
                      <TableHead className="text-muted-foreground">Amount</TableHead>
                      <TableHead className="text-muted-foreground">Due</TableHead>
                      <TableHead className="text-muted-foreground">Risk</TableHead>
                      <TableHead className="text-muted-foreground">Strategy</TableHead>
                      <TableHead className="text-muted-foreground">APY</TableHead>
                      <TableHead className="text-muted-foreground">Yield</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-border hover:bg-muted/10 cursor-pointer transition-colors group">
                        <TableCell className="font-mono font-medium">
                          <Link href={`/dashboard/invoice/${invoice.tokenId || invoice.id}`} className="hover:text-primary flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            {invoice.id}
                          </Link>
                        </TableCell>
                        <TableCell className="font-semibold">{invoice.amount}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{invoice.dueDate}</span>
                            <span className={`text-xs ${invoice.daysUntilDue < 0 ? 'text-destructive' : invoice.daysUntilDue < 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                              {invoice.daysUntilDue < 0 ? 'Overdue' : `${invoice.daysUntilDue}d left`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RiskBadge score={invoice.riskScore} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{invoice.strategy}</span>
                        </TableCell>
                        <TableCell>
                          <span className={invoice.apy === "0.0%" ? "text-muted-foreground" : "text-success font-medium"}>
                            {invoice.apy}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-success">{invoice.accruedYield}</TableCell>
                        <TableCell>
                          <StatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="card-flat">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/invoice/${invoice.tokenId || invoice.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeposit(invoice.id, invoice.amount.replace("$", "").replace(",", ""))}
                              >
                                {invoice.strategy === "Hold" ? "Deposit for Yield" : "Change Strategy"}
                              </DropdownMenuItem>
                              <DropdownMenuItem>Withdraw Yield</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </Card>

        {/* Footer Disclaimer */}
        <div className="text-center text-xs text-muted-foreground/70 py-6">
          Unaudited prototype · Testnet only · Not financial advice
        </div>
      </main>

      {/* DepositModal */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        invoiceId={selectedInvoice?.id}
        invoiceAmount={selectedInvoice?.amount}
      />
    </div>
  )
}

// Mock data fallback
const mockInvoices: InvoiceDisplay[] = [
  {
    id: "INV-1234",
    tokenId: "0",
    amount: "$24,500",
    dueDate: "Mar 15, 2025",
    daysUntilDue: 45,
    strategy: "Conservative",
    apy: "3.5%",
    accruedYield: "~$245",
    status: "Active",
    riskScore: 85,
    paymentProbability: 92,
  },
  {
    id: "INV-1235",
    tokenId: "1",
    amount: "$18,200",
    dueDate: "Mar 22, 2025",
    daysUntilDue: 52,
    strategy: "Aggressive",
    apy: "7.0%",
    accruedYield: "~$412",
    status: "In Yield",
    riskScore: 78,
    paymentProbability: 88,
  },
  {
    id: "INV-1236",
    tokenId: "2",
    amount: "$32,800",
    dueDate: "Apr 5, 2025",
    daysUntilDue: 66,
    strategy: "Conservative",
    apy: "3.5%",
    accruedYield: "~$189",
    status: "Active",
    riskScore: 91,
    paymentProbability: 96,
  },
  {
    id: "INV-1237",
    tokenId: "3",
    amount: "$15,600",
    dueDate: "Feb 28, 2025",
    daysUntilDue: -2,
    strategy: "Hold",
    apy: "0.0%",
    accruedYield: "$0",
    status: "At Risk",
    riskScore: 42,
    paymentProbability: 65,
  },
  {
    id: "INV-1238",
    tokenId: "4",
    amount: "$42,100",
    dueDate: "Apr 18, 2025",
    daysUntilDue: 79,
    strategy: "Aggressive",
    apy: "7.0%",
    accruedYield: "~$521",
    status: "In Yield",
    riskScore: 88,
    paymentProbability: 94,
  },
]
