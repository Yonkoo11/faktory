"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DashboardHeader } from "@/components/dashboard-header"
import { Lock, Eye, EyeOff, Shield, UserPlus, Copy, Check, FileText, AlertTriangle } from "lucide-react"
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useInvoiceNFT } from "@/hooks/use-invoice-nft"
import { InvoiceNFTABI } from "@/lib/contracts/abis"
import { getInvoiceNFTAddress } from "@/lib/contracts/addresses"
import { useChainId } from "wagmi"
import { isAddress } from "viem"

interface InvoicePrivacy {
  tokenId: string
  dataCommitment: string
  isRevealed: boolean
  authorizedAddresses: string[]
}

export default function IssuerDashboardPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contractAddress = getInvoiceNFTAddress(chainId)
  const { totalInvoices, userBalance } = useInvoiceNFT()

  const [invoices, setInvoices] = useState<InvoicePrivacy[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<InvoicePrivacy | null>(null)
  const [authorizeDialogOpen, setAuthorizeDialogOpen] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Contract write for authorizing reveal
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Fetch user's invoices
  useEffect(() => {
    async function fetchUserInvoices() {
      if (!isConnected || !address || userBalance === 0) {
        setInvoices([])
        setIsLoading(false)
        return
      }

      try {
        // For demo, create mock invoice data based on user balance
        const mockInvoices: InvoicePrivacy[] = []
        for (let i = 1; i <= Math.min(userBalance, 5); i++) {
          mockInvoices.push({
            tokenId: i.toString(),
            dataCommitment: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            isRevealed: false,
            authorizedAddresses: [],
          })
        }
        setInvoices(mockInvoices)
      } catch (error) {
        console.error("Failed to fetch invoices:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInvoices()
  }, [isConnected, address, userBalance])

  const handleAuthorize = () => {
    if (!selectedInvoice || !newAddress || !isAddress(newAddress)) return

    writeContract({
      address: contractAddress,
      abi: InvoiceNFTABI,
      functionName: "authorizeReveal",
      args: [BigInt(selectedInvoice.tokenId), newAddress as `0x${string}`],
    })
  }

  const copyCommitment = (commitment: string) => {
    navigator.clipboard.writeText(commitment)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Reset dialog on success
  useEffect(() => {
    if (isSuccess) {
      setAuthorizeDialogOpen(false)
      setNewAddress("")
      // Update local state
      if (selectedInvoice) {
        setInvoices(prev => prev.map(inv =>
          inv.tokenId === selectedInvoice.tokenId
            ? { ...inv, authorizedAddresses: [...inv.authorizedAddresses, newAddress] }
            : inv
        ))
      }
    }
  }, [isSuccess, selectedInvoice, newAddress])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              Privacy Controls
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage who can access your invoice details
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <Lock className="w-3 h-3 mr-2" />
            {userBalance} Invoice{userBalance !== 1 ? 's' : ''} Protected
          </Badge>
        </div>

        {/* Privacy Explainer */}
        <Card className="glass border-glass-border p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Your Data Stays Private</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Invoice details are stored as cryptographic commitment hashes on-chain.
                Only you can authorize specific parties to verify the underlying data.
              </p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                  <span>Client names hidden</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                  <span>Amounts hidden</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <EyeOff className="w-4 h-4" />
                  <span>Terms hidden</span>
                </div>
                <div className="flex items-center gap-2 text-success">
                  <Eye className="w-4 h-4" />
                  <span>Selectively revealable</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Not Connected State */}
        {!isConnected && (
          <Card className="glass border-glass-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view and manage your invoice privacy settings
            </p>
          </Card>
        )}

        {/* No Invoices State */}
        {isConnected && !isLoading && invoices.length === 0 && (
          <Card className="glass border-glass-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Invoices Yet</h3>
            <p className="text-muted-foreground mb-4">
              Mint your first invoice to start managing privacy settings
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-accent">
              <a href="/dashboard/mint">Mint Invoice</a>
            </Button>
          </Card>
        )}

        {/* Invoices Table */}
        {isConnected && invoices.length > 0 && (
          <Card className="glass border-glass-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Invoice</TableHead>
                  <TableHead className="text-muted-foreground">Commitment Hash</TableHead>
                  <TableHead className="text-muted-foreground">Privacy Status</TableHead>
                  <TableHead className="text-muted-foreground">Authorized Parties</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.tokenId} className="border-glass-border hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">#{invoice.tokenId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground font-mono">
                          {invoice.dataCommitment.slice(0, 10)}...{invoice.dataCommitment.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCommitment(invoice.dataCommitment)}
                        >
                          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={invoice.isRevealed
                          ? "border-warning/30 bg-warning/10 text-warning"
                          : "border-success/30 bg-success/10 text-success"
                        }
                      >
                        {invoice.isRevealed ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Revealed
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {invoice.authorizedAddresses.length} address{invoice.authorizedAddresses.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-glass-border"
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setAuthorizeDialogOpen(true)
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Authorize
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="glass border-glass-border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              How Commitments Work
            </h3>
            <p className="text-sm text-muted-foreground">
              When you mint an invoice, the details are hashed into a commitment.
              The hash is stored on-chain, but the original data stays with you.
              To verify an invoice, you provide the original data and a salt—if the
              hash matches, the data is authentic.
            </p>
          </Card>
          <Card className="glass border-glass-border p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Important
            </h3>
            <p className="text-sm text-muted-foreground">
              Keep your invoice salt secure. Anyone with the salt and original data
              can prove the commitment. Only authorize addresses you trust.
              Revelations are on-chain and permanent.
            </p>
          </Card>
        </div>
      </main>

      {/* Authorize Dialog */}
      <Dialog open={authorizeDialogOpen} onOpenChange={setAuthorizeDialogOpen}>
        <DialogContent className="glass border-glass-border">
          <DialogHeader>
            <DialogTitle>Authorize Address</DialogTitle>
            <DialogDescription>
              Grant an address permission to verify Invoice #{selectedInvoice?.tokenId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ethereum Address</label>
              <Input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="font-mono"
              />
              {newAddress && !isAddress(newAddress) && (
                <p className="text-xs text-destructive mt-1">Invalid Ethereum address</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What this means:</p>
              <p>This address will be able to call verifyReveal() on-chain to confirm your invoice data is authentic.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAuthorizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAuthorize}
              disabled={!newAddress || !isAddress(newAddress) || isPending || isConfirming}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isPending || isConfirming ? "Authorizing..." : "Authorize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
