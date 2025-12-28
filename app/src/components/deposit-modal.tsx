"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, TrendingUp, Zap, CheckCircle2, Loader2, ExternalLink, AlertCircle, Radio } from "lucide-react"
import { useDepositToVault, useYieldVault } from "@/hooks/use-yield-vault"
import { useLendleAPY } from "@/hooks/use-lendle"
import { Strategy } from "@/lib/contracts/abis"
import { parseUnits } from "viem"

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId?: string
  invoiceAmount?: string
  tokenId?: bigint
  onSuccess?: () => void
}

type StrategyType = "hold" | "conservative" | "aggressive"

const strategyMap: Record<StrategyType, Strategy> = {
  hold: Strategy.Hold,
  conservative: Strategy.Conservative,
  aggressive: Strategy.Aggressive,
}

export function DepositModal({ open, onOpenChange, invoiceId, invoiceAmount, tokenId, onSuccess }: DepositModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>("conservative")
  const [depositAmount, setDepositAmount] = useState(invoiceAmount || "")
  const [acceptRisk, setAcceptRisk] = useState(false)
  const [step, setStep] = useState<"input" | "approving" | "depositing" | "success" | "error">("input")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { conservativeAPY, aggressiveAPY } = useYieldVault()
  const { supplyAPY: lendleAPY, isLive: hasLendleData } = useLendleAPY("USDC")

  // Use real Lendle APY if available, otherwise fall back to contract values
  const displayConservativeAPY = hasLendleData && lendleAPY ? parseFloat(lendleAPY) : conservativeAPY
  const displayAggressiveAPY = hasLendleData && lendleAPY ? parseFloat(lendleAPY) * 1.8 : aggressiveAPY // Aggressive is ~1.8x leveraged

  const {
    approve,
    deposit,
    approveHash,
    depositHash,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    isDepositing,
    isDepositConfirming,
    isDepositSuccess,
    depositError,
  } = useDepositToVault()

  // Handle approval success - move to deposit step
  useEffect(() => {
    if (isApproveSuccess && step === "approving" && tokenId) {
      setStep("depositing")
      deposit({
        tokenId,
        strategy: strategyMap[selectedStrategy],
        principal: parseUnits(depositAmount || "0", 18),
      })
    }
  }, [isApproveSuccess, step, tokenId, selectedStrategy, depositAmount, deposit])

  // Handle deposit success
  useEffect(() => {
    if (isDepositSuccess && step === "depositing") {
      setStep("success")
      onSuccess?.()
    }
  }, [isDepositSuccess, step, onSuccess])

  // Handle errors
  useEffect(() => {
    if (depositError) {
      setStep("error")
      setErrorMessage(depositError.message || "Transaction failed")
    }
  }, [depositError])

  const strategies = [
    {
      id: "hold" as StrategyType,
      name: "Hold",
      apy: "0%",
      apyValue: 0,
      description: "No yield optimization",
      risk: "None",
      icon: Shield,
      color: "muted",
      recommended: false,
      isLive: false,
    },
    {
      id: "conservative" as StrategyType,
      name: "Conservative",
      apy: `${displayConservativeAPY.toFixed(1)}%`,
      apyValue: displayConservativeAPY,
      description: hasLendleData ? "Lendle USDC lending" : "Low-risk lending protocols",
      risk: "Low",
      icon: Shield,
      color: "primary",
      recommended: true,
      isLive: hasLendleData,
    },
    {
      id: "aggressive" as StrategyType,
      name: "Aggressive",
      apy: `${displayAggressiveAPY.toFixed(1)}%`,
      apyValue: displayAggressiveAPY,
      description: hasLendleData ? "Leveraged Lendle yield" : "Higher yield DeFi pools",
      risk: "Medium",
      icon: TrendingUp,
      color: "accent",
      recommended: false,
      isLive: hasLendleData,
    },
  ]

  const calculateProjectedEarnings = (days: number) => {
    const amount = Number.parseFloat(depositAmount) || 0
    const strategy = strategies.find(s => s.id === selectedStrategy)
    const apy = (strategy?.apyValue || 0) / 100
    return ((amount * apy * days) / 365).toFixed(2)
  }

  const handleDeposit = async () => {
    if (!tokenId) {
      setErrorMessage("No token ID provided")
      setStep("error")
      return
    }

    setStep("approving")
    setErrorMessage(null)

    try {
      await approve(tokenId)
    } catch (err) {
      setStep("error")
      setErrorMessage(err instanceof Error ? err.message : "Approval failed")
    }
  }

  const handleClose = () => {
    setStep("input")
    setAcceptRisk(false)
    setErrorMessage(null)
    onOpenChange(false)
  }

  const handleRetry = () => {
    setStep("input")
    setErrorMessage(null)
  }

  // Determine if we're in a processing state
  const isProcessing = step === "approving" || step === "depositing" || isApproving || isApproveConfirming || isDepositing || isDepositConfirming

  // Success state
  if (step === "success") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass border-glass-border max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Deposit Successful!</h2>
            <p className="text-muted-foreground mb-2">Your invoice is now earning yield</p>
            <p className="text-sm text-muted-foreground mb-6">
              Strategy: <span className="font-medium text-foreground">{selectedStrategy.charAt(0).toUpperCase() + selectedStrategy.slice(1)}</span>
            </p>
            {depositHash && (
              <a
                href={`https://explorer.sepolia.mantle.xyz/tx/${depositHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <div className="mt-4">
              <Button onClick={handleClose} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error state
  if (step === "error") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass border-glass-border max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Transaction Failed</h2>
            <p className="text-muted-foreground mb-6">{errorMessage || "Something went wrong"}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleClose} className="border-glass-border">
                Cancel
              </Button>
              <Button onClick={handleRetry} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Processing state (approval or deposit in progress)
  if (isProcessing) {
    const currentStep = step === "approving" || isApproving || isApproveConfirming ? 1 : 2
    const stepLabel = currentStep === 1
      ? (isApproveConfirming ? "Confirming approval..." : "Approve NFT transfer...")
      : (isDepositConfirming ? "Confirming deposit..." : "Depositing to vault...")

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="glass border-glass-border max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Processing</h2>
            <p className="text-muted-foreground mb-6">{stepLabel}</p>

            {/* Progress steps */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                </div>
                <span className="text-sm">Approve</span>
              </div>
              <div className="w-8 h-0.5 bg-muted" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  2
                </div>
                <span className="text-sm">Deposit</span>
              </div>
            </div>

            {approveHash && currentStep === 1 && (
              <a
                href={`https://explorer.sepolia.mantle.xyz/tx/${approveHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View approval tx
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Please confirm the transaction in your wallet
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-glass-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Deposit & Earn Yield</DialogTitle>
          {invoiceId && <p className="text-sm text-muted-foreground mt-1">Invoice {invoiceId}</p>}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Strategy Selection */}
          <div className="space-y-3">
            <Label className="text-base">Select Strategy</Label>
            <div className="grid grid-cols-1 gap-3">
              {strategies.map((strategy) => {
                const Icon = strategy.icon
                const isSelected = selectedStrategy === strategy.id

                return (
                  <Card
                    key={strategy.id}
                    className={`glass border-glass-border p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg ${
                      isSelected ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{strategy.name}</h3>
                              {strategy.isLive && (
                                <Badge
                                  variant="outline"
                                  className="border-success/30 bg-success/10 text-success text-xs flex items-center gap-1"
                                >
                                  <Radio className="w-2 h-2 animate-pulse" />
                                  Live
                                </Badge>
                              )}
                              {strategy.recommended && (
                                <Badge
                                  variant="outline"
                                  className="border-primary/30 bg-primary/10 text-primary text-xs"
                                >
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{strategy.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 ml-13">
                          <div>
                            <span className="text-2xl font-bold text-success">{strategy.apy}</span>
                            <span className="text-sm text-muted-foreground ml-1">APY</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Risk: </span>
                            <span className="text-sm font-medium">{strategy.risk}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-primary bg-primary" : "border-muted"
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Deposit Amount */}
          <div className="space-y-2">
            <Label htmlFor="depositAmount">Principal Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="depositAmount"
                type="number"
                placeholder="25000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="pl-7 bg-background/50 border-glass-border text-lg font-semibold"
              />
            </div>
          </div>

          {/* Projected Earnings Calculator */}
          <Card className="glass border-glass-border p-5 bg-gradient-to-br from-primary/5 to-accent/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Projected Earnings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">30 Days</p>
                <p className="text-xl font-bold gradient-text">${calculateProjectedEarnings(30)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">90 Days</p>
                <p className="text-xl font-bold gradient-text">${calculateProjectedEarnings(90)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">1 Year</p>
                <p className="text-xl font-bold gradient-text">${calculateProjectedEarnings(365)}</p>
              </div>
            </div>
          </Card>

          {/* Risk Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
            <Checkbox
              id="acceptRisk"
              checked={acceptRisk}
              onCheckedChange={(checked) => setAcceptRisk(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="acceptRisk" className="text-sm cursor-pointer">
              <p className="font-medium text-foreground mb-1">I understand the risks</p>
              <p className="text-muted-foreground">
                DeFi lending carries smart contract risk. Yield rates are variable and not guaranteed. I have reviewed
                the strategy details and accept the associated risks.
              </p>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-glass-border">
              Cancel
            </Button>
            <Button
              onClick={handleDeposit}
              disabled={!acceptRisk || !depositAmount || !tokenId}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Deposit & Start Earning
            </Button>
          </div>

          {!tokenId && (
            <p className="text-xs text-warning text-center">
              Token ID is required. Please select an invoice from your portfolio.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
