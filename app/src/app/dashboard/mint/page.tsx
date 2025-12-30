"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import confetti from "canvas-confetti"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuickBooksConnect } from "@/components/quickbooks-connect"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, Upload, Shield, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useMintInvoice } from "@/hooks/use-invoice-nft"

interface QuickBooksInvoice {
  id: string
  docNumber: string
  customerName: string
  amount: number
  balance: number
  dueDate: string
  isPaid: boolean
}

function MintInvoiceContent() {
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  const { mint, isPending, isConfirming, isSuccess, hash, mintedTokenId, error } = useMintInvoice()

  const [step, setStep] = useState(1)
  const [selectedQBInvoice, setSelectedQBInvoice] = useState<QuickBooksInvoice | null>(null)
  const [formData, setFormData] = useState({
    clientName: "",
    amount: "",
    currency: "USD",
    dueDate: undefined as Date | undefined,
    allowDisclosure: false,
    file: null as File | null,
    quickbooksId: null as string | null,
  })

  // Check for QuickBooks connection status from URL
  useEffect(() => {
    const qbStatus = searchParams.get("quickbooks")
    if (qbStatus === "connected") {
      // QuickBooks was just connected
    }
    const error = searchParams.get("error")
    if (error) {
      console.error("QuickBooks error:", error)
    }
  }, [searchParams])

  // Handle QuickBooks invoice selection
  const handleQuickBooksSelect = (invoice: QuickBooksInvoice) => {
    setSelectedQBInvoice(invoice)
    setFormData({
      ...formData,
      clientName: invoice.customerName,
      amount: invoice.balance.toString(),
      dueDate: new Date(invoice.dueDate),
      quickbooksId: invoice.id,
    })
  }

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleMint = async () => {
    if (!formData.clientName || !formData.amount || !formData.dueDate) return

    // Create invoice data string for commitment
    const invoiceData = JSON.stringify({
      clientName: formData.clientName,
      amount: formData.amount,
      currency: formData.currency,
      dueDate: formData.dueDate.toISOString(),
      quickbooksId: formData.quickbooksId,
      allowDisclosure: formData.allowDisclosure,
    })

    try {
      const result = await mint({
        invoiceData,
        amount: formData.amount,
        dueDate: formData.dueDate,
      })

      // Store the salt securely (in production, save to database)
      if (result) {
        console.log("Commitment data:", result)
        // Token ID will be extracted from transaction logs by the hook
      }
    } catch (err) {
      console.error("Mint error:", err)
    }
  }

  const progress = (step / 2) * 100
  const isMinting = isPending || isConfirming

  // Confetti celebration function
  const fireConfetti = useCallback(() => {
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#06B6D4']

    ;(function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()

    // Big burst in the center
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
      })
    }, 250)
  }, [])

  // Trigger confetti on success
  useEffect(() => {
    if (isSuccess || mintedTokenId) {
      fireConfetti()
    }
  }, [isSuccess, mintedTokenId, fireConfetti])

  // Success state
  if (isSuccess || mintedTokenId) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-16">
          <Card className="glass border-glass-border p-12 max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-success animate-bounce" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Invoice Minted Successfully!</h1>
            <p className="text-muted-foreground mb-2">Your invoice has been tokenized as an NFT on Mantle</p>
            <div className="inline-flex items-center gap-2 text-sm font-mono bg-muted/30 px-4 py-2 rounded-lg mb-4">
              <span className="text-muted-foreground">Invoice ID:</span>
              <span className="font-semibold">#{mintedTokenId || "..."}</span>
            </div>

            {hash && (
              <div className="mb-8">
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
                <Link href="/dashboard">
                  Deposit to Earn Yield
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-glass-border bg-background/50" asChild>
                <Link href="/dashboard">View in Portfolio</Link>
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Header - Simplified to 2 steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Mint Invoice NFT</h1>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Step {step} of 2
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-3 h-3" /> : "1"}
                </div>
                <span className={`text-sm ${step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}`}>Invoice Details</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  2
                </div>
                <span className={`text-sm ${step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}`}>Review & Mint</span>
              </div>
            </div>
          </div>

          {/* Step 1: Invoice Details */}
          {step === 1 && (
            <div className="space-y-6">
              {/* QuickBooks Connect Section - Primary Path */}
              <div className="relative">
                <div className="absolute -top-3 left-4 z-10">
                  <Badge className="bg-success text-success-foreground border-0 shadow-lg">
                    Recommended
                  </Badge>
                </div>
                <QuickBooksConnect
                  onInvoiceSelect={handleQuickBooksSelect}
                  selectedInvoiceId={selectedQBInvoice?.id}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-glass-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              <Card className="glass border-glass-border p-8 opacity-90">
                <h2 className="text-xl font-bold mb-6 text-muted-foreground">Manual Entry</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      placeholder="Acme Corporation"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="bg-background/50 border-glass-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="amount">Invoice Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="25000"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="bg-background/50 border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger className="bg-background/50 border-glass-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass border-glass-border">
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background/50 border-glass-border",
                            !formData.dueDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="glass border-glass-border w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Invoice PDF (Optional)</Label>
                    <div className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center hover:border-primary/30 transition-colors cursor-pointer bg-background/50">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">Drop your invoice PDF here or click to browse</p>
                      <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      />
                    </div>
                  </div>

                  {/* Privacy toggle - inline in step 1 */}
                  <div className="flex items-start justify-between gap-4 p-4 bg-background/50 rounded-lg border border-glass-border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-primary" />
                        <h3 className="font-medium text-sm">Enable Selective Disclosure</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Allow verified parties to request access to specific invoice details.
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowDisclosure}
                      onCheckedChange={(checked) => setFormData({ ...formData, allowDisclosure: checked })}
                    />
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Your data is encrypted and secure</p>
                      <p className="text-muted-foreground">
                        Invoice details are stored as a commitment hash on-chain. Only you control access.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    onClick={handleNext}
                    disabled={!formData.clientName || !formData.amount || !formData.dueDate}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    Review & Mint
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Review & Mint */}
          {step === 2 && (
            <Card className="glass border-glass-border p-8">
              <h2 className="text-2xl font-bold mb-6">Review & Mint</h2>
              <div className="space-y-6">
                {!isConnected && (
                  <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Wallet not connected</p>
                      <p className="text-muted-foreground">
                        Please connect your wallet to mint the invoice NFT.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg border border-glass-border">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                      <p className="font-medium">{formData.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Amount</p>
                      <p className="font-medium">
                        {formData.currency} {Number(formData.amount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                      <p className="font-medium">{formData.dueDate && format(formData.dueDate, "PPP")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Selective Disclosure</p>
                      <p className="font-medium">{formData.allowDisclosure ? "Enabled" : "Disabled"}</p>
                    </div>
                    {formData.quickbooksId && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">QuickBooks Invoice</p>
                        <p className="font-medium text-success">Verified from QuickBooks</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-glass-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Estimated Gas Fee</span>
                      <span className="font-semibold">~0.001 MNT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <span className="font-semibold">Mantle Sepolia</span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">Transaction Failed</p>
                        <p className="text-muted-foreground">{error.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-1">Review carefully before minting</p>
                      <p className="text-muted-foreground">
                        Once minted, the invoice NFT cannot be edited. Make sure all details are correct.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-8">
                <Button variant="outline" onClick={handleBack} className="border-glass-border bg-background/50" disabled={isMinting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleMint}
                  size="lg"
                  disabled={!isConnected || isMinting}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isPending ? "Confirm in Wallet..." : "Minting..."}
                    </>
                  ) : (
                    "Mint Invoice NFT"
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default function MintInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <MintInvoiceContent />
    </Suspense>
  )
}
