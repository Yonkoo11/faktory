"use client"

/**
 * Invoice Detail Page - Terminal/Bloomberg Aesthetic
 */

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { StatusBar } from "@/components/ui/status-bar"
import { DepositModal } from "@/features/vault"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Copy, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { parseEther } from "viem"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useInvoice, usePayInvoice } from "@/hooks/use-invoice-nft"
import { useDeposit, useWithdrawFromVault, useChangeStrategy } from "@/hooks/use-yield-vault"
import { StrategyNames } from "@/lib/abi"
import { Strategy, InvoiceStatus } from "@/lib/contracts/abis"

const STRATEGY_APY = ["0%", "3.5%", "7%"]

export default function InvoiceDetailPage() {
  const params = useParams()
  const tokenId = params.id ? BigInt(params.id as string) : undefined
  useAccount() // Keep hook for wallet connection state

  const { invoice, isLoading: isLoadingInvoice } = useInvoice(tokenId)
  const { deposit, isLoading: isLoadingDeposit } = useDeposit(tokenId)

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [strategyModalOpen, setStrategyModalOpen] = useState(false)
  const [strategyConfirmOpen, setStrategyConfirmOpen] = useState(false)
  const [pendingStrategy, setPendingStrategy] = useState<Strategy | null>(null)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [copied, setCopied] = useState(false)

  const { withdraw, isPending: isWithdrawing, isConfirming: isWithdrawConfirming, isSuccess: isWithdrawSuccess, error: withdrawError } = useWithdrawFromVault()
  const { changeStrategy, isPending: isChangingStrategy, isConfirming: isStrategyConfirming, isSuccess: isStrategySuccess, error: strategyError } = useChangeStrategy()
  const { payInvoice, isPending: isPaying, isConfirming: isPayConfirming, isSuccess: isPaySuccess, error: payError } = usePayInvoice()

  useEffect(() => {
    if (isWithdrawSuccess) setTimeout(() => setWithdrawModalOpen(false), 2000)
  }, [isWithdrawSuccess])

  useEffect(() => {
    if (isStrategySuccess) setTimeout(() => setStrategyModalOpen(false), 2000)
  }, [isStrategySuccess])

  useEffect(() => {
    if (isPaySuccess) setTimeout(() => setPayModalOpen(false), 2000)
  }, [isPaySuccess])

  const handlePayInvoice = () => {
    if (tokenId && paymentAmount) {
      try {
        payInvoice(tokenId, parseEther(paymentAmount))
      } catch {}
    }
  }

  const handleWithdraw = () => {
    if (tokenId) withdraw(tokenId)
  }

  const handleChangeStrategy = (newStrategy: Strategy) => {
    setPendingStrategy(newStrategy)
    setStrategyConfirmOpen(true)
  }

  const confirmStrategyChange = () => {
    if (tokenId && pendingStrategy !== null) {
      changeStrategy(tokenId, pendingStrategy)
      setStrategyConfirmOpen(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Loading state
  if (isLoadingInvoice || isLoadingDeposit) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
        <Nav />
        <main className="max-w-6xl mx-auto px-6 py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#1f1f1f] border-t-[#10b981] rounded-full animate-spin mb-4" />
            <p className="text-[12px] text-[#666666]">loading invoice from blockchain...</p>
          </div>
        </main>
        <StatusBar status="online" network="CRONOS TESTNET" />
      </div>
    )
  }

  // Not found state
  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
        <Nav />
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="terminal-card p-8 max-w-lg mx-auto text-center">
            <h1 className="text-[18px] font-bold mb-2">Invoice Not Found</h1>
            <p className="text-[12px] text-[#666666] mb-6">Invoice #{params.id} does not exist or has not been minted yet.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </main>
        <StatusBar status="online" network="CRONOS TESTNET" />
      </div>
    )
  }

  // Format data
  const isDeposited = deposit?.active
  const strategyIndex = deposit?.strategy || 0
  const principalValue = deposit?.principal ? parseFloat(deposit.principal) : 0
  const yieldValue = deposit?.accruedYield ? parseFloat(deposit.accruedYield) : 0
  const depositTime = deposit?.depositTime || null
  const daysDeposited = depositTime ? Math.floor((Date.now() - depositTime.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const daysUntilDue = invoice.daysUntilDue
  const apyRate = strategyIndex === 2 ? 0.07 : strategyIndex === 1 ? 0.035 : 0
  const projectedYield = principalValue * apyRate * ((daysDeposited + daysUntilDue) / 365)

  const invoiceData = {
    id: `INV-${String(tokenId).padStart(4, '0')}`,
    amount: principalValue,
    dueDate: invoice.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    strategy: StrategyNames[strategyIndex].toLowerCase(),
    apy: STRATEGY_APY[strategyIndex],
    accruedYield: yieldValue,
    status: invoice.statusLabel,
    issuer: invoice.issuer,
    commitmentHash: invoice.dataCommitment,
    riskScore: invoice.riskScore,
    paymentProbability: invoice.paymentProbability,
    daysDeposited,
    projectedYield,
    daysUntilDue,
  }

  const yieldChartData = daysDeposited > 0 ?
    Array.from({ length: Math.min(6, daysDeposited + 1) }, (_, i) => {
      const dayOffset = Math.floor((daysDeposited / 5) * i)
      return { date: `D${dayOffset}`, yield: principalValue * apyRate * (dayOffset / 365) }
    }) : [{ date: "Now", yield: 0 }]

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
      <Nav />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[12px] text-[#666666] hover:text-[#e5e5e5] mb-6 transition-colors">
          <ArrowLeft className="w-3 h-3" />
          back to portfolio
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 stagger-1">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[24px] font-bold text-[#10b981]">{invoiceData.id}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded ${
                invoiceData.status === 'InYield' ? 'bg-[#10b981]/10 text-[#10b981]' :
                invoiceData.status === 'Paid' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]' :
                'bg-[#f59e0b]/10 text-[#f59e0b]'
              }`}>
                {invoiceData.status === 'InYield' ? 'active' : invoiceData.status.toLowerCase()}
              </span>
            </div>
            <p className="text-[12px] text-[#666666]">Invoice details and yield performance</p>
          </div>

          <div className="flex gap-2">
            {invoice.status !== InvoiceStatus.Paid && (
              <Button variant="secondary" onClick={() => setPayModalOpen(true)}>
                pay invoice
              </Button>
            )}
            {isDeposited ? (
              <>
                <Button variant="secondary" onClick={() => setStrategyModalOpen(true)}>
                  change strategy
                </Button>
                <Button onClick={() => setWithdrawModalOpen(true)}>
                  withdraw
                </Button>
              </>
            ) : (
              <Button onClick={() => setDepositModalOpen(true)}>
                deposit for yield
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid grid-cols-4 mb-8 stagger-2">
          <div className="stat-cell">
            <div className="stat-label">Principal</div>
            <div className="stat-value tabular-nums">${invoiceData.amount.toLocaleString()}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Accrued Yield</div>
            <div className="stat-value stat-value-green tabular-nums">+${invoiceData.accruedYield.toFixed(2)}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Strategy</div>
            <div className="stat-value">{invoiceData.strategy}</div>
            <div className="text-[11px] text-[#f59e0b] mt-1">{invoiceData.apy} APY</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">Due Date</div>
            <div className="stat-value text-[18px]">{invoiceData.dueDate}</div>
            <div className="text-[11px] text-[#666666] mt-1">{invoiceData.daysUntilDue} days left</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6 stagger-3">
            {/* Invoice Details */}
            <div className="terminal-card p-6">
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">Invoice Details</div>
              <div className="space-y-3 text-[12px]">
                <div className="kv-row">
                  <span className="kv-key">token_id</span>
                  <span className="kv-value">{String(tokenId)}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">issuer</span>
                  <div className="flex items-center gap-2">
                    <span className="kv-value font-mono">{invoiceData.issuer.slice(0, 6)}...{invoiceData.issuer.slice(-4)}</span>
                    <button onClick={() => handleCopy(invoiceData.issuer)} className="text-[#666666] hover:text-[#e5e5e5]">
                      {copied ? <CheckCircle2 className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="kv-row">
                  <span className="kv-key">commitment</span>
                  <span className="kv-value font-mono">{invoiceData.commitmentHash.slice(0, 10)}...</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">time_deposited</span>
                  <span className="kv-value">{daysDeposited > 0 ? `${daysDeposited} days` : 'not deposited'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-key">projected_yield</span>
                  <span className="kv-value text-[#10b981]">+${invoiceData.projectedYield.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="terminal-card p-6">
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">Risk Assessment</div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#666666]">risk_score</span>
                    <span className="text-[14px] font-bold tabular-nums">{invoiceData.riskScore}/100</span>
                  </div>
                  <div className="h-1.5 bg-[#1f1f1f] rounded overflow-hidden">
                    <div className="h-full bg-[#10b981]" style={{ width: `${100 - invoiceData.riskScore}%` }} />
                  </div>
                  <p className="text-[10px] text-[#666666] mt-1">lower is better</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#666666]">payment_probability</span>
                    <span className="text-[14px] font-bold text-[#10b981] tabular-nums">{invoiceData.paymentProbability}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1f1f1f] rounded overflow-hidden">
                    <div className="h-full bg-[#10b981]" style={{ width: `${invoiceData.paymentProbability}%` }} />
                  </div>
                </div>
                <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded text-[11px]">
                  <span className="text-[#10b981] font-semibold">LOW RISK</span>
                  <p className="text-[#666666] mt-1">Strong indicators of timely payment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Yield Chart */}
          <div className="lg:col-span-2 space-y-6 stagger-4">
            <div className="terminal-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-[10px] text-[#666666] uppercase tracking-wider">Yield Performance</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
                  <span className="text-[10px] text-[#10b981]">LIVE</span>
                </div>
              </div>

              {/* Yield Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f]">
                  <div className="text-[10px] text-[#666666] uppercase mb-1">Accrued Yield</div>
                  <div className="text-[24px] font-bold text-[#10b981] tabular-nums">+${invoiceData.accruedYield.toFixed(2)}</div>
                  <div className="text-[10px] text-[#666666]">real-time updating</div>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f]">
                  <div className="text-[10px] text-[#666666] uppercase mb-1">Projected at Due Date</div>
                  <div className="text-[24px] font-bold text-[#f59e0b] tabular-nums">+${invoiceData.projectedYield.toFixed(2)}</div>
                  <div className="text-[10px] text-[#666666]">based on current APY</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yieldChartData}>
                    <XAxis dataKey="date" stroke="#444444" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#444444" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111111", border: "1px solid #1f1f1f", borderRadius: "4px", fontSize: "11px" }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, "yield"]}
                    />
                    <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="terminal-card p-6">
              <div className="text-[10px] text-[#666666] uppercase tracking-wider mb-4">Activity Timeline</div>
              <div className="space-y-0 text-[12px]">
                <div className="flex gap-3 py-3 border-b border-[#1f1f1f]">
                  <span className="text-[#10b981]">&gt;</span>
                  <span className="text-[#666666] w-32">{invoice.createdAt.toLocaleString()}</span>
                  <span className="text-[#e5e5e5]">Invoice minted on Cronos</span>
                </div>
                {isDeposited && depositTime && (
                  <div className="flex gap-3 py-3 border-b border-[#1f1f1f]">
                    <span className="text-[#10b981]">&gt;</span>
                    <span className="text-[#666666] w-32">{depositTime.toLocaleString()}</span>
                    <span className="text-[#e5e5e5]">Deposited to {StrategyNames[strategyIndex]} strategy</span>
                  </div>
                )}
                <div className="flex gap-3 py-3">
                  <span className="text-[#f59e0b]">&gt;</span>
                  <span className="text-[#666666] w-32">pending</span>
                  <span className="text-[#666666]">Awaiting payment ({invoiceData.daysUntilDue} days)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        invoiceId={invoiceData.id}
        invoiceAmount={principalValue > 0 ? principalValue.toString() : "10000"}
        tokenId={tokenId}
      />

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="bg-[#111111] border-[#1f1f1f]">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Withdraw {invoiceData.id}</DialogTitle>
            <DialogDescription className="text-[12px] text-[#666666]">
              Withdraw your invoice NFT and claim accrued yield.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f]">
              <div>
                <div className="text-[10px] text-[#666666] uppercase">Principal</div>
                <div className="text-[16px] font-bold">${invoiceData.amount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#666666] uppercase">Yield</div>
                <div className="text-[16px] font-bold text-[#10b981]">+${invoiceData.accruedYield.toFixed(2)}</div>
              </div>
            </div>
            {withdrawError && (
              <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 text-[#ef4444] rounded text-[12px]">
                <AlertCircle className="w-4 h-4" />
                {withdrawError.message}
              </div>
            )}
            {isWithdrawSuccess && (
              <div className="flex items-center gap-2 p-3 bg-[#10b981]/10 text-[#10b981] rounded text-[12px]">
                <CheckCircle2 className="w-4 h-4" />
                Withdrawal successful!
              </div>
            )}
            <Button onClick={() => setWithdrawConfirmOpen(true)} disabled={isWithdrawing || isWithdrawConfirming} className="w-full">
              {isWithdrawing || isWithdrawConfirming ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isWithdrawConfirming ? "confirming..." : "withdrawing..."}</>
              ) : "withdraw funds"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strategy Modal */}
      <Dialog open={strategyModalOpen} onOpenChange={setStrategyModalOpen}>
        <DialogContent className="bg-[#111111] border-[#1f1f1f]">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Change Strategy</DialogTitle>
            <DialogDescription className="text-[12px] text-[#666666]">
              Current: {invoiceData.strategy} ({invoiceData.apy} APY)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {[
              { strategy: Strategy.Hold, name: "hold", apy: "0%", desc: "No yield optimization" },
              { strategy: Strategy.Conservative, name: "conservative", apy: "3.5%", desc: "Low-risk lending" },
              { strategy: Strategy.Aggressive, name: "aggressive", apy: "7%", desc: "Higher yield pools" },
            ].map((s) => (
              <button
                key={s.strategy}
                onClick={() => handleChangeStrategy(s.strategy)}
                disabled={strategyIndex === s.strategy || isChangingStrategy || isStrategyConfirming}
                className={`w-full p-4 rounded border text-left transition-colors ${
                  strategyIndex === s.strategy
                    ? "border-[#10b981]/50 bg-[#10b981]/10 opacity-50"
                    : "border-[#1f1f1f] hover:border-[#10b981]/30 hover:bg-[#1a1a1a]"
                } disabled:opacity-50`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[13px] font-semibold">{s.name}</p>
                    <p className="text-[11px] text-[#666666]">{s.desc}</p>
                  </div>
                  <span className="text-[12px] text-[#f59e0b]">{s.apy}</span>
                </div>
              </button>
            ))}
            {strategyError && (
              <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 text-[#ef4444] rounded text-[12px]">
                <AlertCircle className="w-4 h-4" />
                {strategyError.message}
              </div>
            )}
            {isStrategySuccess && (
              <div className="flex items-center gap-2 p-3 bg-[#10b981]/10 text-[#10b981] rounded text-[12px]">
                <CheckCircle2 className="w-4 h-4" />
                Strategy changed!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="bg-[#111111] border-[#1f1f1f]">
          <DialogHeader>
            <DialogTitle className="text-[14px]">Pay {invoiceData.id}</DialogTitle>
            <DialogDescription className="text-[12px] text-[#666666]">
              x402 on-chain settlement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f] space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#666666]">amount</span>
                <span className="font-bold">${invoiceData.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">due_date</span>
                <span>{invoiceData.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">pay_to</span>
                <span className="font-mono">{invoiceData.issuer.slice(0, 6)}...{invoiceData.issuer.slice(-4)}</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#666666] uppercase">Payment Amount (CRO)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.0"
                className="w-full mt-2 p-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded text-[14px] font-mono focus:outline-none focus:border-[#10b981]"
              />
            </div>
            <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded text-[11px]">
              <span className="text-[#10b981] font-semibold">x402 PAYMENT</span>
              <span className="text-[#666666]"> - Instant on-chain settlement</span>
            </div>
            {payError && (
              <div className="flex items-center gap-2 p-3 bg-[#ef4444]/10 text-[#ef4444] rounded text-[12px]">
                <AlertCircle className="w-4 h-4" />
                {payError.message}
              </div>
            )}
            {isPaySuccess && (
              <div className="flex items-center gap-2 p-3 bg-[#10b981]/10 text-[#10b981] rounded text-[12px]">
                <CheckCircle2 className="w-4 h-4" />
                Payment successful!
              </div>
            )}
            <Button onClick={handlePayInvoice} disabled={isPaying || isPayConfirming || !paymentAmount} className="w-full">
              {isPaying || isPayConfirming ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isPayConfirming ? "confirming..." : "processing..."}</>
              ) : `pay ${paymentAmount || "0"} CRO`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmations */}
      <AlertDialog open={withdrawConfirmOpen} onOpenChange={setWithdrawConfirmOpen}>
        <AlertDialogContent className="bg-[#111111] border-[#1f1f1f]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[14px]">Confirm Withdrawal</AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-[#666666]">
              You will receive ${invoiceData.amount.toLocaleString()} principal + ${invoiceData.accruedYield.toFixed(2)} yield.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[12px]">cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw} className="text-[12px]">withdraw</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={strategyConfirmOpen} onOpenChange={setStrategyConfirmOpen}>
        <AlertDialogContent className="bg-[#111111] border-[#1f1f1f]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[14px]">Change Strategy</AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-[#666666]">
              Your current yield (${invoiceData.accruedYield.toFixed(2)}) will be preserved. New APY applies from now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStrategy(null)} className="text-[12px]">cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStrategyChange} className="text-[12px]">confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StatusBar status="online" network="CRONOS TESTNET" />
    </div>
  )
}

function Nav() {
  const { address, isConnected } = useAccount()
  return (
    <nav className="sticky top-0 z-50 h-12 border-b border-[#1f1f1f] bg-[#0a0a0a]/95 backdrop-blur-sm px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#10b981] rounded" />
          <span className="font-semibold text-sm"><span className="text-[#10b981]">f</span>aktory</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link href="/dashboard" className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors">portfolio</Link>
          <Link href="/dashboard/mint" className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors">mint</Link>
          <Link href="/dashboard/agent" className="px-3 py-1.5 text-xs text-[#666666] hover:text-[#e5e5e5] transition-colors">agent</Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="network-badge">CRONOS</span>
        {isConnected && address && (
          <span className="px-3 py-1.5 text-xs bg-[#111111] border border-[#1f1f1f] rounded">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>
    </nav>
  )
}
