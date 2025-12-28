"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardHeader } from "@/components/dashboard-header"
import { DepositModal } from "@/components/deposit-modal"
import { Copy, Shield, TrendingUp, Clock, CheckCircle2, ArrowLeft, ExternalLink, Zap, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useInvoice } from "@/hooks/use-invoice-nft"
import { useDeposit } from "@/hooks/use-yield-vault"
import { StrategyNames } from "@/lib/abi"

const STRATEGY_APY = ["0%", "3.5%", "7%"]

export default function InvoiceDetailPage() {
  const params = useParams()
  const tokenId = params.id ? BigInt(params.id as string) : undefined

  const { invoice, isLoading: isLoadingInvoice } = useInvoice(tokenId)
  const { deposit, isLoading: isLoadingDeposit } = useDeposit(tokenId)

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Loading state
  if (isLoadingInvoice || isLoadingDeposit) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading invoice data from blockchain...</p>
          </div>
        </main>
      </div>
    )
  }

  // Not found state
  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-16">
          <Card className="glass border-glass-border p-12 max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
            <p className="text-muted-foreground mb-6">Invoice #{params.id} doesn't exist or hasn't been minted yet.</p>
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  // Format data from blockchain
  const isDeposited = deposit?.active
  const strategyIndex = deposit?.strategy || 0
  const principalValue = deposit?.principal ? parseFloat(deposit.principal) : 0
  const yieldValue = deposit?.accruedYield ? parseFloat(deposit.accruedYield) : 0
  const depositTime = deposit?.depositTime || null
  const daysDeposited = depositTime ? Math.floor((Date.now() - depositTime.getTime()) / (1000 * 60 * 60 * 24)) : 0

  // Calculate projected yield at due date
  const daysUntilDue = invoice.daysUntilDue
  const apyRate = strategyIndex === 2 ? 0.07 : strategyIndex === 1 ? 0.035 : 0
  const projectedYield = principalValue * apyRate * ((daysDeposited + daysUntilDue) / 365)

  const invoiceData = {
    id: `#${tokenId}`,
    amount: `$${principalValue.toLocaleString()}`,
    dueDate: invoice.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    strategy: StrategyNames[strategyIndex],
    apy: STRATEGY_APY[strategyIndex],
    accruedYield: `$${yieldValue.toFixed(2)}`,
    principal: `$${principalValue.toLocaleString()}`,
    status: invoice.statusLabel,
    issuerAddress: `${invoice.issuer.slice(0, 6)}...${invoice.issuer.slice(-4)}`,
    commitmentHash: `${invoice.dataCommitment.slice(0, 6)}...${invoice.dataCommitment.slice(-4)}`,
    riskScore: invoice.riskScore,
    paymentProbability: invoice.paymentProbability,
    timeDeposited: daysDeposited > 0 ? `${daysDeposited} days` : "Not deposited",
    projectedYield: `$${projectedYield.toFixed(2)}`,
    daysUntilDue: daysUntilDue,
  }

  // Generate yield chart data based on actual deposit time
  const yieldPerformanceData = daysDeposited > 0 ?
    Array.from({ length: Math.min(6, daysDeposited + 1) }, (_, i) => {
      const dayOffset = Math.floor((daysDeposited / 5) * i)
      const yieldAtDay = principalValue * apyRate * (dayOffset / 365)
      return {
        date: `Day ${dayOffset}`,
        yield: yieldAtDay,
      }
    }) :
    [{ date: "Now", yield: 0 }]

  // Build activity timeline from real data
  const activities = [
    {
      type: "minted",
      title: "Invoice Minted",
      description: "NFT created on Mantle Network",
      timestamp: invoice.createdAt.toLocaleString(),
      icon: CheckCircle2,
      color: "success",
    },
    ...(isDeposited && depositTime ? [{
      type: "deposited",
      title: "Deposited for Yield",
      description: `$${principalValue.toLocaleString()} deposited to ${StrategyNames[strategyIndex]} strategy`,
      timestamp: depositTime.toLocaleString(),
      icon: TrendingUp,
      color: "primary",
    }] : []),
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold font-mono">{invoiceData.id}</h1>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {invoiceData.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Invoice details and yield performance</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDepositModalOpen(true)}
              className="border-glass-border bg-background/50"
            >
              Change Strategy
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">Withdraw Yield</Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass border-glass-border p-6">
              <h2 className="text-lg font-semibold mb-4">Invoice Information</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{invoiceData.amount}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-glass-border">
                  <p className="text-sm text-muted-foreground mb-1">Commitment Hash</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono">{invoiceData.commitmentHash}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(invoiceData.commitmentHash)}
                    >
                      {copied ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                  <Button variant="link" className="p-0 h-auto text-xs text-primary mt-1">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Verify on-chain
                  </Button>
                </div>

                <div className="pt-4 border-t border-glass-border">
                  <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium">{invoiceData.dueDate}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{invoiceData.daysUntilDue} days remaining</p>
                </div>

                <div className="pt-4 border-t border-glass-border">
                  <p className="text-sm text-muted-foreground mb-1">Issuer Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono">{invoiceData.issuerAddress}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(invoiceData.issuerAddress)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Risk Assessment */}
            <Card className="glass border-glass-border p-6">
              <h2 className="text-lg font-semibold mb-4">Risk Assessment</h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-xl font-bold">{invoiceData.riskScore}/100</p>
                  </div>
                  <Progress value={invoiceData.riskScore} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
                </div>

                <div className="pt-4 border-t border-glass-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Payment Probability</p>
                    <p className="text-xl font-bold text-success">{invoiceData.paymentProbability}%</p>
                  </div>
                  <Progress value={invoiceData.paymentProbability} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">AI-predicted likelihood of payment</p>
                </div>

                <div className="pt-4 border-t border-glass-border flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Low Risk</p>
                    <p className="text-muted-foreground text-xs">
                      This invoice shows strong indicators of timely payment based on historical data.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Yield Performance */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass border-glass-border p-6">
              <h2 className="text-lg font-semibold mb-4">Yield Performance</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border border-glass-border">
                  <p className="text-xs text-muted-foreground mb-1">Current Strategy</p>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    {invoiceData.strategy}
                  </Badge>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-glass-border">
                  <p className="text-xs text-muted-foreground mb-1">Time Deposited</p>
                  <p className="text-lg font-bold">{invoiceData.timeDeposited}</p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-glass-border">
                  <p className="text-xs text-muted-foreground mb-1">Principal Value</p>
                  <p className="text-lg font-bold">{invoiceData.principal}</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-success/10 to-primary/10 rounded-lg border border-glass-border">
                  <p className="text-xs text-muted-foreground mb-1">APY</p>
                  <p className="text-lg font-bold text-success">{invoiceData.apy}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-6 glass rounded-lg border border-glass-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <p className="text-sm text-muted-foreground">Accrued Yield</p>
                  </div>
                  <p className="text-3xl font-bold gradient-text">{invoiceData.accruedYield}</p>
                  <p className="text-xs text-muted-foreground mt-1">Real-time updating</p>
                </div>

                <div className="p-6 glass rounded-lg border border-glass-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <p className="text-sm text-muted-foreground">Projected at Due Date</p>
                  </div>
                  <p className="text-3xl font-bold gradient-text">{invoiceData.projectedYield}</p>
                  <p className="text-xs text-muted-foreground mt-1">Based on current APY</p>
                </div>
              </div>

              {/* Yield Chart */}
              <div>
                <h3 className="text-sm font-medium mb-4">Yield Growth Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={yieldPerformanceData}>
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
                    <Line
                      type="monotone"
                      dataKey="yield"
                      stroke="oklch(0.65 0.18 145)"
                      strokeWidth={3}
                      dot={{ fill: "oklch(0.65 0.18 145)", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Activity Timeline */}
            <Card className="glass border-glass-border p-6">
              <h2 className="text-lg font-semibold mb-6">Activity Timeline</h2>

              <div className="space-y-6">
                {activities.map((activity, index) => {
                  const Icon = activity.icon
                  const isLast = index === activities.length - 1

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br from-${activity.color}/20 to-${activity.color}/10 flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`w-5 h-5 text-${activity.color}`} />
                        </div>
                        {!isLast && <div className="w-px h-full bg-glass-border mt-2" />}
                      </div>

                      <div className="flex-1 pb-6">
                        <h3 className="font-semibold mb-1">{activity.title}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        invoiceId={invoiceData.id}
        invoiceAmount={principalValue > 0 ? principalValue.toString() : "10000"}
        tokenId={tokenId}
      />
    </div>
  )
}
