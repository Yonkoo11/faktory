"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { TrendingUp, Wallet, FileText, MoreVertical, ArrowUpRight, Search, Filter, Loader2 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { DepositModal } from "@/components/deposit-modal"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useInvoiceNFT } from "@/hooks/use-invoice-nft"
import { useYieldVault } from "@/hooks/use-yield-vault"
import { formatUnits } from "viem"

// Type for invoice display
interface InvoiceDisplay {
  id: string
  tokenId: string
  amount: string
  dueDate: string
  strategy: string
  apy: string
  accruedYield: string
  status: string
}

// Mock data for yield chart (will be replaced with real data)
const yieldData = [
  { date: "Jan 1", value: 0 },
  { date: "Jan 8", value: 124 },
  { date: "Jan 15", value: 287 },
  { date: "Jan 22", value: 456 },
  { date: "Jan 29", value: 623 },
  { date: "Feb 5", value: 845 },
  { date: "Feb 12", value: 1024 },
  { date: "Feb 19", value: 1189 },
  { date: "Feb 26", value: 1369 },
]

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    Active: "bg-primary/10 text-primary border-primary/30",
    "In Yield": "bg-success/10 text-success border-success/30",
    Paid: "bg-muted text-muted-foreground border-border",
    "At Risk": "bg-warning/10 text-warning border-warning/30",
    Defaulted: "bg-destructive/10 text-destructive border-destructive/30",
  }

  return (
    <Badge variant="outline" className={`${variants[status] || ""}`}>
      {status}
    </Badge>
  )
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("30D")
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<{ id: string; amount: string } | null>(null)
  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)

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
          const formattedInvoices: InvoiceDisplay[] = data.data.invoices.map((inv: {
            tokenId: string
            status: string
            dueDate: string
            deposit?: {
              principal: string
              strategy: string
              accruedYield: string
            }
          }) => ({
            id: `INV-${inv.tokenId}`,
            tokenId: inv.tokenId,
            amount: inv.deposit ? `$${Number(formatUnits(BigInt(inv.deposit.principal), 18)).toLocaleString()}` : "$0",
            dueDate: new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            strategy: inv.deposit?.strategy || "Hold",
            apy: inv.deposit?.strategy === "Aggressive" ? `${aggressiveAPY}%` : inv.deposit?.strategy === "Conservative" ? `${conservativeAPY}%` : "0.0%",
            accruedYield: inv.deposit ? `$${Number(formatUnits(BigInt(inv.deposit.accruedYield), 18)).toFixed(2)}` : "$0.00",
            status: inv.status,
          }))
          setInvoices(formattedInvoices)
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error)
        // Use mock data as fallback
        setInvoices(mockInvoices)
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    fetchInvoices()
  }, [isConnected, conservativeAPY, aggressiveAPY])

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

  // Use mock data if no real data available
  const displayInvoices = invoices.length > 0 ? invoices : mockInvoices

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass border-glass-border p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {isLoadingNFT ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `$${portfolioValue.toLocaleString()}`
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Principal deposited
              </div>
            </div>
          </Card>

          <Card className="glass border-glass-border p-6 hover:border-accent/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total Yield Earned</span>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {isLoadingNFT ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `$${totalYieldEarned.toFixed(2)}`
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Accrued from strategies
              </div>
            </div>
          </Card>

          <Card className="glass border-glass-border p-6 hover:border-success/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Active Invoices</span>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold">{activeCount}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>{userBalance} owned by you</span>
              </div>
            </div>
          </Card>

          <Card className="glass border-glass-border p-6 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Average APY</span>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold">{avgAPY.toFixed(1)}%</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Across all positions</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Yield Chart */}
        <Card className="glass border-glass-border p-6 relative">
          <div className="absolute top-4 right-4">
            <span className="text-xs text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded">Sample Data</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Cumulative Yield</h2>
              <p className="text-sm text-muted-foreground">Your earnings over time</p>
            </div>
            <div className="flex gap-2">
              {["7D", "30D", "90D", "All"].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={timeRange === range ? "bg-primary" : ""}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={yieldData}>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.6 0.22 265)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.6 0.22 265)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="oklch(0.55 0 0)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="oklch(0.55 0 0)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.08 0 0)",
                  border: "1px solid oklch(0.95 0 0 / 0.05)",
                  borderRadius: "0.5rem",
                  color: "oklch(0.95 0 0)",
                }}
                formatter={(value) => [`$${Number(value).toFixed(2)}`, "Yield"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.6 0.22 265)"
                strokeWidth={2}
                fill="url(#yieldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Invoice Table */}
        <Card className="glass border-glass-border">
          <div className="p-6 border-b border-glass-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold mb-1">Your Invoices</h2>
                <p className="text-sm text-muted-foreground">Manage and track your tokenized invoices</p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search invoices..." className="pl-9 bg-background/50 border-glass-border" />
                </div>
                <Button variant="outline" size="icon" className="border-glass-border bg-background/50">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingInvoices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : displayInvoices.length === 0 ? (
              <div className="text-center py-16 px-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-success/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <FileText className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Ready to earn yield?</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Tokenize your business invoices and put them to work. Earn 3-7% APY while waiting for payment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                    <Link href="/dashboard/mint">
                      <FileText className="w-4 h-4 mr-2" />
                      Mint Your First Invoice
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span>Privacy preserved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span>AI optimized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <span>Real yield</span>
                  </div>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-glass-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Invoice ID</TableHead>
                    <TableHead className="text-muted-foreground">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Due Date</TableHead>
                    <TableHead className="text-muted-foreground">Strategy</TableHead>
                    <TableHead className="text-muted-foreground">APY</TableHead>
                    <TableHead className="text-muted-foreground">Accrued Yield</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-glass-border hover:bg-muted/5 cursor-pointer">
                      <TableCell className="font-mono font-medium">
                        <Link href={`/dashboard/invoice/${invoice.tokenId || invoice.id}`} className="hover:text-primary">
                          {invoice.id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-semibold">{invoice.amount}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>
                        <span className="text-sm">{invoice.strategy}</span>
                      </TableCell>
                      <TableCell>
                        <span className={invoice.apy === "0.0%" ? "text-muted-foreground" : "text-success"}>
                          {invoice.apy}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{invoice.accruedYield}</TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-glass-border">
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
            )}
          </div>
        </Card>
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
    strategy: "Conservative",
    apy: "3.5%",
    accruedYield: "$245.32",
    status: "Active",
  },
  {
    id: "INV-1235",
    tokenId: "1",
    amount: "$18,200",
    dueDate: "Mar 22, 2025",
    strategy: "Aggressive",
    apy: "7.0%",
    accruedYield: "$412.84",
    status: "In Yield",
  },
  {
    id: "INV-1236",
    tokenId: "2",
    amount: "$32,800",
    dueDate: "Apr 5, 2025",
    strategy: "Conservative",
    apy: "3.5%",
    accruedYield: "$189.45",
    status: "Active",
  },
  {
    id: "INV-1237",
    tokenId: "3",
    amount: "$15,600",
    dueDate: "Feb 28, 2025",
    strategy: "Hold",
    apy: "0.0%",
    accruedYield: "$0.00",
    status: "At Risk",
  },
  {
    id: "INV-1238",
    tokenId: "4",
    amount: "$42,100",
    dueDate: "Apr 18, 2025",
    strategy: "Aggressive",
    apy: "7.0%",
    accruedYield: "$521.67",
    status: "In Yield",
  },
]
