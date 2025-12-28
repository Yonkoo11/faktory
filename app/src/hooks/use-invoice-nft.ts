"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi"
import { InvoiceNFTABI, type Invoice, InvoiceStatus } from "@/lib/contracts/abis"
import { getInvoiceNFTAddress } from "@/lib/contracts/addresses"
import { keccak256, encodePacked, toHex, decodeEventLog } from "viem"

export function useInvoiceNFT() {
  const chainId = useChainId()
  const { address } = useAccount()
  const contractAddress = getInvoiceNFTAddress(chainId)

  // Get total number of invoices
  const {
    data: totalInvoices,
    isLoading: isLoadingTotal,
    refetch: refetchTotal,
  } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "totalInvoices",
  })

  // Get user's invoice balance
  const {
    data: userBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // Get active invoices
  const {
    data: activeInvoices,
    isLoading: isLoadingActive,
    refetch: refetchActive,
  } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "getActiveInvoices",
  })

  return {
    contractAddress,
    totalInvoices: totalInvoices ? Number(totalInvoices) : 0,
    userBalance: userBalance ? Number(userBalance) : 0,
    activeInvoices: activeInvoices || [],
    isLoading: isLoadingTotal || isLoadingBalance || isLoadingActive,
    refetch: () => {
      refetchTotal()
      refetchBalance()
      refetchActive()
    },
  }
}

export function useInvoice(tokenId: bigint | number | undefined) {
  const chainId = useChainId()
  const contractAddress = getInvoiceNFTAddress(chainId)

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "getInvoice",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  const { data: daysUntilDue } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "getDaysUntilDue",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  // Format invoice data
  const formattedInvoice = invoice
    ? {
        dataCommitment: invoice.dataCommitment,
        amountCommitment: invoice.amountCommitment,
        dueDate: new Date(Number(invoice.dueDate) * 1000),
        createdAt: new Date(Number(invoice.createdAt) * 1000),
        issuer: invoice.issuer,
        status: invoice.status as InvoiceStatus,
        statusLabel: getStatusLabel(invoice.status as InvoiceStatus),
        riskScore: invoice.riskScore,
        paymentProbability: invoice.paymentProbability,
        owner,
        daysUntilDue: daysUntilDue ? Number(daysUntilDue) : 0,
      }
    : null

  return {
    invoice: formattedInvoice,
    isLoading,
    error,
    refetch,
  }
}

export function useMintInvoice() {
  const chainId = useChainId()
  const contractAddress = getInvoiceNFTAddress(chainId)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract token ID from transaction logs
  const mintedTokenId = receipt?.logs
    ? (() => {
        try {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: InvoiceNFTABI,
                data: log.data,
                topics: log.topics,
              })
              if (decoded.eventName === "InvoiceMinted" && decoded.args) {
                return (decoded.args as { tokenId: bigint }).tokenId.toString()
              }
            } catch {
              // Not the event we're looking for
            }
          }
        } catch {
          // Parsing failed
        }
        return null
      })()
    : null

  const mint = async (params: {
    invoiceData: string
    amount: string
    dueDate: Date
    salt?: `0x${string}`
  }) => {
    // Generate salt if not provided
    const salt = params.salt || (toHex(crypto.getRandomValues(new Uint8Array(32))) as `0x${string}`)

    // Create commitment hashes
    const dataCommitment = keccak256(
      encodePacked(["string", "bytes32"], [params.invoiceData, salt])
    )
    const amountCommitment = keccak256(
      encodePacked(["string", "bytes32"], [params.amount, salt])
    )

    // Convert due date to unix timestamp
    const dueDateUnix = BigInt(Math.floor(params.dueDate.getTime() / 1000))

    writeContract({
      address: contractAddress,
      abi: InvoiceNFTABI,
      functionName: "mint",
      args: [dataCommitment, amountCommitment, dueDateUnix],
    })

    // Return salt so it can be stored for later verification
    return { salt, dataCommitment, amountCommitment }
  }

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    mintedTokenId,
    error,
  }
}

export function useUserInvoices() {
  const chainId = useChainId()
  const { address } = useAccount()
  const contractAddress = getInvoiceNFTAddress(chainId)

  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: InvoiceNFTABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  // This would need to be implemented differently to get all user tokens
  // For now, we'll just return the balance
  return {
    balance: balance ? Number(balance) : 0,
  }
}

// Helper function to get status label
function getStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    [InvoiceStatus.Active]: "Active",
    [InvoiceStatus.InYield]: "In Yield",
    [InvoiceStatus.Paid]: "Paid",
    [InvoiceStatus.Defaulted]: "Defaulted",
    [InvoiceStatus.Cancelled]: "Cancelled",
  }
  return labels[status] || "Unknown"
}
