"use client"

import { useReadContract, useChainId } from "wagmi"
import { YieldVaultABI, InvoiceNFTABI } from "@/lib/contracts/abis"
import { getYieldVaultAddress, getInvoiceNFTAddress } from "@/lib/contracts/addresses"
import { formatUnits } from "viem"

/**
 * Hook to fetch real on-chain protocol statistics for the landing page
 * Returns TVL, total invoices, active deposits, and calculated average APY
 */
export function useProtocolStats() {
  const chainId = useChainId()
  const yieldVaultAddress = getYieldVaultAddress(chainId)
  const invoiceNFTAddress = getInvoiceNFTAddress(chainId)

  // Total Value Locked from YieldVault
  const {
    data: tvlRaw,
    isLoading: isLoadingTVL,
    error: tvlError
  } = useReadContract({
    address: yieldVaultAddress,
    abi: YieldVaultABI,
    functionName: "totalValueLocked",
  })

  // Total invoices minted from InvoiceNFT
  const {
    data: totalInvoicesRaw,
    isLoading: isLoadingInvoices,
    error: invoicesError
  } = useReadContract({
    address: invoiceNFTAddress,
    abi: InvoiceNFTABI,
    functionName: "totalInvoices",
  })

  // Active deposits count from YieldVault
  const {
    data: activeDepositsRaw,
    isLoading: isLoadingDeposits,
    error: depositsError
  } = useReadContract({
    address: yieldVaultAddress,
    abi: YieldVaultABI,
    functionName: "getActiveDepositsCount",
  })

  // Total yield generated
  const {
    data: totalYieldRaw,
    isLoading: isLoadingYield
  } = useReadContract({
    address: yieldVaultAddress,
    abi: YieldVaultABI,
    functionName: "totalYieldGenerated",
  })

  // Format values
  const tvl = tvlRaw ? parseFloat(formatUnits(tvlRaw, 18)) : 0
  const totalInvoices = totalInvoicesRaw ? Number(totalInvoicesRaw) : 0
  const activeDeposits = activeDepositsRaw ? Number(activeDepositsRaw) : 0
  const totalYield = totalYieldRaw ? parseFloat(formatUnits(totalYieldRaw, 18)) : 0

  // Calculate average APY (simplified: assume mix of strategies)
  // Conservative: 3.5%, Aggressive: 7%, Hold: 0%
  // Default to 5.25% (midpoint of conservative and aggressive) if we have deposits
  const averageAPY = activeDeposits > 0 ? 5.25 : 0

  const isLoading = isLoadingTVL || isLoadingInvoices || isLoadingDeposits || isLoadingYield
  const hasError = !!(tvlError || invoicesError || depositsError)
  const hasData = tvlRaw !== undefined || totalInvoicesRaw !== undefined

  return {
    // Raw values
    tvl,
    totalInvoices,
    activeDeposits,
    totalYield,
    averageAPY,

    // Formatted for display
    tvlFormatted: formatCurrency(tvl),
    totalYieldFormatted: formatCurrency(totalYield),

    // Loading and error states
    isLoading,
    hasError,
    hasData,

    // For debugging
    errors: {
      tvl: tvlError,
      invoices: invoicesError,
      deposits: depositsError,
    }
  }
}

// Helper to format currency values
function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`
  } else if (value > 0) {
    return `$${value.toFixed(2)}`
  }
  return "$0"
}
