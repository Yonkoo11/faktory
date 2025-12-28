"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, Link2, RefreshCw } from "lucide-react"

interface QuickBooksInvoice {
  id: string
  docNumber: string
  customerName: string
  amount: number
  balance: number
  dueDate: string
  isPaid: boolean
}

interface QuickBooksConnectProps {
  onInvoiceSelect?: (invoice: QuickBooksInvoice) => void
  selectedInvoiceId?: string | null
}

export function QuickBooksConnect({
  onInvoiceSelect,
  selectedInvoiceId,
}: QuickBooksConnectProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [invoices, setInvoices] = useState<QuickBooksInvoice[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check connection status and fetch invoices on mount
  useEffect(() => {
    checkConnectionAndFetchInvoices()
  }, [])

  async function checkConnectionAndFetchInvoices() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/quickbooks/invoices")
      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        setInvoices(data.data.invoices || [])
      } else if (data.requiresAuth) {
        setIsConnected(false)
      } else {
        setError(data.error || "Failed to fetch invoices")
      }
    } catch {
      setError("Failed to connect to QuickBooks")
    } finally {
      setIsLoading(false)
    }
  }

  function handleConnect() {
    // Redirect to QuickBooks OAuth
    window.location.href = "/api/quickbooks/auth"
  }

  function handleRefresh() {
    checkConnectionAndFetchInvoices()
  }

  if (isLoading) {
    return (
      <Card className="glass border-glass-border p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Checking QuickBooks connection...</span>
        </div>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="glass border-glass-border p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect QuickBooks</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your QuickBooks account to import and verify real invoices
            </p>
          </div>
          <Button
            onClick={handleConnect}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Connect QuickBooks
          </Button>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass border-glass-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span className="font-medium">QuickBooks Connected</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No open invoices found in QuickBooks</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-3">
            Select an invoice to tokenize ({invoices.length} open invoices)
          </p>
          {invoices.map((invoice) => (
            <button
              key={invoice.id}
              onClick={() => onInvoiceSelect?.(invoice)}
              className={`w-full text-left p-4 rounded-lg border transition-all ${
                selectedInvoiceId === invoice.id
                  ? "border-primary bg-primary/10"
                  : "border-glass-border hover:border-primary/50 bg-background/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-medium">#{invoice.docNumber}</span>
                <Badge
                  variant="outline"
                  className={
                    invoice.isPaid
                      ? "bg-muted text-muted-foreground"
                      : "bg-success/10 text-success border-success/30"
                  }
                >
                  {invoice.isPaid ? "Paid" : "Open"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{invoice.customerName}</span>
                <span className="font-semibold">
                  ${invoice.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                {invoice.balance < invoice.amount && (
                  <span>Balance: ${invoice.balance.toLocaleString()}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-4">{error}</p>
      )}
    </Card>
  )
}
