"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
import { CalendarIcon, Upload, Shield, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, Loader2, ExternalLink, Check } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useMintInvoice } from "@/hooks/use-invoice-nft"
import { toast } from "sonner"

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
  const [formErrors, setFormErrors] = useState<{ amount?: string; dueDate?: string }>({})
  const [formData, setFormData] = useState(() => {
    // Load saved form data from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('faktory-mint-form')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            clientName: parsed.clientName || "",
            amount: parsed.amount || "",
            currency: parsed.currency || "USD",
            dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
            allowDisclosure: parsed.allowDisclosure || false,
            file: null, // Files can't be persisted
            quickbooksId: parsed.quickbooksId || null,
          }
        } catch (e) {
          console.error('Failed to load saved form data:', e)
        }
      }
    }
    return {
      clientName: "",
      amount: "",
      currency: "USD",
      dueDate: undefined as Date | undefined,
      allowDisclosure: false,
      file: null as File | null,
      quickbooksId: null as string | null,
    }
  })

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSuccess) {
      const toSave = {
        clientName: formData.clientName,
        amount: formData.amount,
        currency: formData.currency,
        dueDate: formData.dueDate?.toISOString(),
        allowDisclosure: formData.allowDisclosure,
        quickbooksId: formData.quickbooksId,
      }
      localStorage.setItem('faktory-mint-form', JSON.stringify(toSave))
    }
  }, [formData, isSuccess])

  // Clear saved form data after successful mint
  useEffect(() => {
    if (isSuccess && typeof window !== 'undefined') {
      localStorage.removeItem('faktory-mint-form')
      toast.success("Form data cleared", {
        description: "Your saved progress has been removed",
      })
    }
  }, [isSuccess])

  // Validate form on next step
  const validateForm = () => {
    const errors: { amount?: string; dueDate?: string } = {}

    const amountNum = parseFloat(formData.amount)
    if (!formData.amount || amountNum <= 0) {
      errors.amount = "Amount must be greater than $0. Enter the total invoice value."
    } else if (amountNum > 10000000) {
      errors.amount = "Amount seems unusually high. Please verify or contact support for large invoices."
    }

    if (!formData.dueDate) {
      errors.dueDate = "Select when payment is expected. This helps optimize your yield strategy."
    } else if (formData.dueDate < new Date()) {
      errors.dueDate = "Due date must be in the future. Update your invoice or choose today's date."
    } else if (formData.dueDate.getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000) {
      errors.dueDate = "Due date is less than 7 days away. Consider a longer timeframe for better yields."
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Check for QuickBooks connection status from URL
  useEffect(() => {
    const qbStatus = searchParams.get("quickbooks")
    const error = searchParams.get("error")

    if (qbStatus === "success") {
      toast.success("QuickBooks connected successfully!", {
        description: "You can now import invoices from QuickBooks",
      })
    } else if (error === "quickbooks_auth_failed") {
      toast.error("QuickBooks connection failed", {
        description: "Please try connecting again or enter invoice details manually",
      })
    }

    // Clear URL params after reading to keep URL clean
    if (qbStatus || error) {
      window.history.replaceState({}, '', '/dashboard/mint')
    }

    // Note: Actual connection state is managed by QuickBooksConnect component
    // via /api/quickbooks/invoices - these params are just for redirect feedback
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
    if (step === 1) {
      if (validateForm()) {
        setStep(step + 1)
      } else {
        toast.error("Please fix the errors before continuing", {
          description: "Check the invoice amount and due date",
        })
      }
    } else if (step < 2) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleMint = async () => {
    if (!formData.clientName || !formData.amount || !formData.dueDate) {
      toast.error("Missing required fields", {
        description: "Please fill in all invoice details",
      })
      return
    }

    // Create invoice data string for commitment
    const invoiceData = JSON.stringify({
      clientName: formData.clientName,
      amount: formData.amount,
      currency: formData.currency,
      dueDate: formData.dueDate.toISOString(),
      quickbooksId: formData.quickbooksId,
      allowDisclosure: formData.allowDisclosure,
    })

    const toastId = toast.loading("Minting your invoice NFT...", {
      description: "Please confirm the transaction in your wallet",
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
        toast.success("Invoice minted successfully!", {
          id: toastId,
          description: "Your invoice has been tokenized on Mantle",
        })
        // Token ID will be extracted from transaction logs by the hook
      }
    } catch (err) {
      console.error("Mint error:", err)
      toast.error("Failed to mint invoice", {
        id: toastId,
        description: err instanceof Error ? err.message : "Please try again or contact support",
      })
    }
  }

  const progress = (step / 2) * 100
  const isMinting = isPending || isConfirming

  // Success state
  if (isSuccess || mintedTokenId) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-16">
          <Card className="card-glass p-12 max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gradient-success-from)] to-[var(--gradient-success-to)] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-success/30">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[var(--gradient-success-from)] to-[var(--gradient-success-to)] bg-clip-text text-transparent">
              Invoice Minted Successfully!
            </h1>
            <p className="text-lg text-muted-foreground mb-3">Your invoice has been tokenized as an NFT on Mantle</p>
            <div className="inline-flex items-center gap-2 text-sm font-mono bg-primary/10 border border-primary/30 px-6 py-3 rounded-lg mb-6 shadow-sm">
              <span className="text-muted-foreground">Invoice ID:</span>
              <span className="font-bold text-primary text-lg">#{mintedTokenId || "..."}</span>
            </div>

            {hash && (
              <div className="mb-8">
                <a
                  href={`https://sepolia.mantlescan.xyz/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="gradient-success" asChild className="shadow-xl hover:shadow-2xl">
                <Link href="/dashboard">
                  Deposit to Earn Yield
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border bg-background hover:bg-primary/5" asChild>
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
            <Progress value={progress} className="h-3 bg-muted" />
            <div className="flex justify-between mt-6">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-md ${
                  step >= 1 ? "bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                </div>
                <span className={`text-sm font-medium ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>Invoice Details</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all shadow-md ${
                  step >= 2 ? "bg-gradient-to-br from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] text-white" : "bg-muted text-muted-foreground"
                }`}>
                  2
                </div>
                <span className={`text-sm font-medium ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>Review & Mint</span>
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
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              <Card className="card-flat p-8 opacity-90">
                <h2 className="text-xl font-bold mb-6 text-muted-foreground">Manual Entry</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      placeholder="Acme Corporation"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="amount">Invoice Amount</Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="25000"
                          value={formData.amount}
                          onChange={(e) => {
                            setFormData({ ...formData, amount: e.target.value })
                            if (formErrors.amount) setFormErrors({ ...formErrors, amount: undefined })
                          }}
                          className={`bg-background border-border ${formErrors.amount ? 'border-destructive pr-10' : formData.amount && parseFloat(formData.amount) > 0 ? 'border-success pr-10' : ''}`}
                          aria-invalid={!!formErrors.amount}
                          aria-describedby={formErrors.amount ? "amount-error" : undefined}
                        />
                        {formData.amount && parseFloat(formData.amount) > 0 && !formErrors.amount && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
                        )}
                        {formErrors.amount && (
                          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                        )}
                      </div>
                      {formErrors.amount && (
                        <div id="amount-error" className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <p>{formErrors.amount}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="card-flat">
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
                            "w-full justify-start text-left font-normal bg-background border-border",
                            !formData.dueDate && "text-muted-foreground",
                            formErrors.dueDate && "border-destructive",
                          )}
                          aria-invalid={!!formErrors.dueDate}
                          aria-describedby={formErrors.dueDate ? "duedate-error" : undefined}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="card-flat w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => {
                            setFormData({ ...formData, dueDate: date })
                            if (formErrors.dueDate) setFormErrors({ ...formErrors, dueDate: undefined })
                          }}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.dueDate && (
                      <div id="duedate-error" className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <p>{formErrors.dueDate}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Upload Invoice PDF (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/30 transition-colors cursor-pointer bg-background">
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
                  <div className="flex items-start justify-between gap-4 p-4 bg-background rounded-lg border border-border">
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
                    size="lg"
                    variant="gradient"
                    disabled={!formData.clientName || !formData.amount || !formData.dueDate}
                    className="shadow-xl hover:shadow-2xl"
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
            <Card className="card-flat p-8">
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
                  <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg border border-border">
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

                  <div className="p-4 bg-muted/30 rounded-lg border border-border">
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
                <Button variant="outline" onClick={handleBack} className="border-border bg-background" disabled={isMinting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    onClick={handleMint}
                    size="lg"
                    variant={isMinting ? "default" : "gradient"}
                    disabled={!isConnected || isMinting}
                    className="shadow-xl hover:shadow-2xl"
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
                  <p className="text-xs text-muted-foreground">
                    Creates an NFT on Mantle. Only gas fees apply.
                  </p>
                </div>
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
