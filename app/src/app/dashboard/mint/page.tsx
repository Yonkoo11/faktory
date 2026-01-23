"use client"

/**
 * Faktory Mint Page - Terminal/Bloomberg Aesthetic
 */

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAccount } from "wagmi"
import { useMintInvoice } from "@/hooks/use-invoice-nft"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBar } from "@/components/ui/status-bar"
import { TerminalNav } from "@/components/terminal-nav"
import { QuickBooksConnect } from "@/components/quickbooks-connect"
import { CalendarIcon, ArrowRight, ArrowLeft, Loader2, ExternalLink, Check, AlertCircle } from "lucide-react"

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
  const [formData, setFormData] = useState({
    clientName: "",
    amount: "",
    currency: "USD",
    dueDate: undefined as Date | undefined,
    allowDisclosure: false,
    file: null as File | null,
    quickbooksId: null as string | null,
  })

  // Load saved form data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('faktory-mint-form')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData({
          clientName: parsed.clientName || "",
          amount: parsed.amount || "",
          currency: parsed.currency || "USD",
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
          allowDisclosure: parsed.allowDisclosure || false,
          file: null,
          quickbooksId: parsed.quickbooksId || null,
        })
      } catch (e) {
        console.error('Failed to load saved form data:', e)
      }
    }
  }, [])

  // Save form data
  useEffect(() => {
    if (!isSuccess) {
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

  // Clear saved form data after success
  useEffect(() => {
    if (isSuccess && typeof window !== 'undefined') {
      localStorage.removeItem('faktory-mint-form')
    }
  }, [isSuccess])

  const validateForm = () => {
    const errors: { amount?: string; dueDate?: string } = {}
    const amountNum = parseFloat(formData.amount)
    if (!formData.amount || amountNum <= 0) {
      errors.amount = "Amount must be greater than $0"
    }
    if (!formData.dueDate) {
      errors.dueDate = "Select a due date"
    } else if (formData.dueDate < new Date()) {
      errors.dueDate = "Due date must be in the future"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    const qbStatus = searchParams.get("quickbooks")
    const error = searchParams.get("error")
    if (qbStatus === "success") {
      toast.success("QuickBooks connected")
    } else if (error === "quickbooks_auth_failed") {
      toast.error("QuickBooks connection failed")
    }
    if (qbStatus || error) {
      window.history.replaceState({}, '', '/dashboard/mint')
    }
  }, [searchParams])

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
    if (step === 1 && validateForm()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleMint = async () => {
    if (!formData.clientName || !formData.amount || !formData.dueDate) {
      toast.error("Missing required fields")
      return
    }

    const invoiceData = JSON.stringify({
      clientName: formData.clientName,
      amount: formData.amount,
      currency: formData.currency,
      dueDate: formData.dueDate.toISOString(),
      quickbooksId: formData.quickbooksId,
      allowDisclosure: formData.allowDisclosure,
    })

    const toastId = toast.loading("Minting invoice NFT...")

    try {
      const result = await mint({
        invoiceData,
        amount: formData.amount,
        dueDate: formData.dueDate,
      })
      if (result) {
        toast.success("Invoice minted successfully!", { id: toastId })
      }
    } catch (err) {
      toast.error("Failed to mint invoice", { id: toastId })
    }
  }

  const isMinting = isPending || isConfirming

  // Success state
  if (isSuccess || mintedTokenId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
        <TerminalNav />

        <main className="max-w-2xl mx-auto px-6 py-16">
          <div className="terminal-card p-8 text-center">
            <div className="w-16 h-16 rounded bg-[#10b981] flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-[24px] font-bold mb-2 text-[#10b981]">
              INVOICE MINTED
            </h1>
            <p className="text-[13px] text-[#666666] mb-6">
              Your invoice has been tokenized on Cronos
            </p>
            <div className="inline-flex items-center gap-2 text-sm bg-[#10b981]/10 border border-[#10b981]/30 px-6 py-3 rounded mb-6">
              <span className="text-[#666666]">token_id:</span>
              <span className="font-bold text-[#10b981]">#{mintedTokenId || "..."}</span>
            </div>

            {hash && (
              <div className="mb-8">
                <a
                  href={`https://explorer.cronos.org/testnet3/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[#10b981] hover:underline"
                >
                  view on explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/dashboard/invoice/${mintedTokenId}`}>
                <Button>
                  deposit for yield
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary">view portfolio</Button>
              </Link>
            </div>
          </div>
        </main>
        <StatusBar status="online" network="CRONOS TESTNET" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-grid noise-overlay scan-line pb-8">
      <TerminalNav />

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold mb-1">MINT INVOICE</h1>
            <p className="text-[12px] text-[#666666]">Step {step} of 2</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-1 rounded ${step >= 1 ? 'bg-[#10b981]' : 'bg-[#1f1f1f]'}`} />
            <div className={`w-8 h-1 rounded ${step >= 2 ? 'bg-[#10b981]' : 'bg-[#1f1f1f]'}`} />
          </div>
        </div>

        {/* Step 1: Invoice Details */}
        {step === 1 && (
          <div className="space-y-6">
            {/* QuickBooks Connect */}
            <div className="terminal-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-[#10b981] uppercase tracking-wider font-semibold">Recommended</span>
              </div>
              <QuickBooksConnect
                onInvoiceSelect={handleQuickBooksSelect}
                selectedInvoiceId={selectedQBInvoice?.id}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#1f1f1f]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0a0a] px-2 text-[#666666]">or enter manually</span>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="terminal-card p-6">
              <h2 className="text-[14px] font-semibold mb-6 text-[#666666]">Manual Entry</h2>

              <div className="space-y-6">
                {/* Client Name */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-[#666666] uppercase tracking-wider">client_name</Label>
                  <Input
                    placeholder="Acme Corporation"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  />
                </div>

                {/* Amount + Currency */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[11px] text-[#666666] uppercase tracking-wider">amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="25000"
                      value={formData.amount}
                      onChange={(e) => {
                        setFormData({ ...formData, amount: e.target.value })
                        if (formErrors.amount) setFormErrors({ ...formErrors, amount: undefined })
                      }}
                      className={formErrors.amount ? 'border-[#ef4444]' : ''}
                    />
                    {formErrors.amount && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#ef4444]">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.amount}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] text-[#666666] uppercase tracking-wider">currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger className="bg-[#0a0a0a] border-[#1f1f1f]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111111] border-[#1f1f1f]">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-[#666666] uppercase tracking-wider">due_date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="secondary"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-[#666666]",
                          formErrors.dueDate && "border-[#ef4444]"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(formData.dueDate, "PPP") : "select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-[#111111] border-[#1f1f1f] w-auto p-0" align="start">
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
                    <div className="flex items-center gap-1.5 text-[11px] text-[#ef4444]">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.dueDate}
                    </div>
                  )}
                </div>

                {/* Privacy Toggle */}
                <div className="flex items-start justify-between gap-4 p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f]">
                  <div className="flex-1">
                    <h3 className="text-[12px] font-semibold mb-1">selective_disclosure</h3>
                    <p className="text-[11px] text-[#666666]">
                      Allow verified parties to request access to invoice details
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowDisclosure}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowDisclosure: checked })}
                  />
                </div>

                {/* Security Note */}
                <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded">
                  <p className="text-[11px] text-[#10b981]">
                    Data is encrypted and stored as a commitment hash on-chain. Only you control access.
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  onClick={handleNext}
                  disabled={!formData.clientName || !formData.amount || !formData.dueDate}
                >
                  review & mint
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review & Mint */}
        {step === 2 && (
          <div className="terminal-card p-6">
            <h2 className="text-[14px] font-semibold mb-6">Review & Mint</h2>

            {!isConnected && (
              <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded mb-6">
                <div className="flex items-center gap-2 text-[11px] text-[#f59e0b]">
                  <AlertCircle className="w-3 h-3" />
                  Wallet not connected. Please connect to mint.
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#0a0a0a] rounded border border-[#1f1f1f]">
                <div>
                  <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">client_name</p>
                  <p className="text-[13px] font-semibold">{formData.clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">amount</p>
                  <p className="text-[13px] font-semibold">{formData.currency} {Number(formData.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">due_date</p>
                  <p className="text-[13px] font-semibold">{formData.dueDate && format(formData.dueDate, "PPP")}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">disclosure</p>
                  <p className="text-[13px] font-semibold">{formData.allowDisclosure ? "Enabled" : "Disabled"}</p>
                </div>
                {formData.quickbooksId && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#666666] uppercase tracking-wider mb-1">quickbooks</p>
                    <p className="text-[13px] font-semibold text-[#10b981]">Verified from QuickBooks</p>
                  </div>
                )}
              </div>

              {/* Gas Estimate */}
              <div className="p-4 bg-[#111111] rounded border border-[#1f1f1f]">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="text-[#666666]">est_gas_fee</span>
                  <span className="tabular-nums">~0.001 CRO</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#666666]">network</span>
                  <span>Cronos Testnet</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded">
                  <div className="flex items-center gap-2 text-[11px] text-[#ef4444]">
                    <AlertCircle className="w-3 h-3" />
                    {error.message}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded">
                <div className="text-[11px] text-[#f59e0b]">
                  Review carefully. Once minted, invoice details cannot be edited.
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="secondary" onClick={handleBack} disabled={isMinting}>
                <ArrowLeft className="w-4 h-4" />
                back
              </Button>
              <Button onClick={handleMint} disabled={!isConnected || isMinting}>
                {isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isPending ? "confirm in wallet..." : "minting..."}
                  </>
                ) : (
                  "mint invoice nft"
                )}
              </Button>
            </div>
          </div>
        )}
      </main>

      <StatusBar status="online" network="CRONOS TESTNET" />
    </div>
  )
}

export default function MintInvoicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#666666] text-[12px]">loading...</div>
      </div>
    }>
      <MintInvoiceContent />
    </Suspense>
  )
}
