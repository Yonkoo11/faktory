"use client"

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from "wagmi"
import { YieldVaultABI, InvoiceNFTABI, type Deposit, Strategy } from "@/lib/contracts/abis"
import { getYieldVaultAddress, getInvoiceNFTAddress } from "@/lib/contracts/addresses"
import { formatUnits } from "viem"

export function useYieldVault() {
  const chainId = useChainId()
  const contractAddress = getYieldVaultAddress(chainId)

  // Get TVL
  const { data: tvl, refetch: refetchTVL } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "totalValueLocked",
  })

  // Get total yield generated
  const { data: totalYield, refetch: refetchYield } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "totalYieldGenerated",
  })

  // Get active deposits count
  const { data: activeCount, refetch: refetchCount } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "getActiveDepositsCount",
  })

  // Get active deposits
  const { data: activeDeposits, refetch: refetchDeposits } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "getActiveDeposits",
  })

  // APY constants
  const { data: conservativeAPY } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "CONSERVATIVE_APY",
  })

  const { data: aggressiveAPY } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "AGGRESSIVE_APY",
  })

  return {
    contractAddress,
    tvl: tvl ? formatUnits(tvl, 18) : "0",
    tvlRaw: tvl || BigInt(0),
    totalYield: totalYield ? formatUnits(totalYield, 18) : "0",
    totalYieldRaw: totalYield || BigInt(0),
    activeDepositsCount: activeCount ? Number(activeCount) : 0,
    activeDeposits: activeDeposits || [],
    conservativeAPY: conservativeAPY ? Number(conservativeAPY) / 100 : 3.5,
    aggressiveAPY: aggressiveAPY ? Number(aggressiveAPY) / 100 : 7,
    refetch: () => {
      refetchTVL()
      refetchYield()
      refetchCount()
      refetchDeposits()
    },
  }
}

export function useDeposit(tokenId: bigint | number | undefined) {
  const chainId = useChainId()
  const contractAddress = getYieldVaultAddress(chainId)

  const { data: deposit, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "getDeposit",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  const { data: accruedYield, refetch: refetchYield } = useReadContract({
    address: contractAddress,
    abi: YieldVaultABI,
    functionName: "getAccruedYield",
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: { enabled: tokenId !== undefined },
  })

  const formattedDeposit = deposit
    ? {
        tokenId: deposit.tokenId,
        owner: deposit.owner,
        strategy: deposit.strategy as Strategy,
        strategyLabel: getStrategyLabel(deposit.strategy as Strategy),
        depositTime: new Date(Number(deposit.depositTime) * 1000),
        principal: formatUnits(deposit.principal, 18),
        principalRaw: deposit.principal,
        accruedYield: accruedYield ? formatUnits(accruedYield, 18) : "0",
        accruedYieldRaw: accruedYield || BigInt(0),
        lastYieldUpdate: new Date(Number(deposit.lastYieldUpdate) * 1000),
        active: deposit.active,
      }
    : null

  return {
    deposit: formattedDeposit,
    isLoading,
    refetch: () => {
      refetch()
      refetchYield()
    },
  }
}

export function useDepositToVault() {
  const chainId = useChainId()
  const { address } = useAccount()
  const yieldVaultAddress = getYieldVaultAddress(chainId)
  const invoiceNFTAddress = getInvoiceNFTAddress(chainId)

  const { writeContract: approveNFT, data: approveHash, isPending: isApproving, error: approveError } = useWriteContract()
  const { writeContract: depositToVault, data: depositHash, isPending: isDepositing, error: depositError } = useWriteContract()

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveConfirmError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
    timeout: 60_000, // 60 second timeout
    pollingInterval: 3_000, // Poll every 3 seconds
    confirmations: 1, // Wait for 1 confirmation
    query: {
      enabled: !!approveHash,
      retry: 3,
      retryDelay: 2000,
    },
  })

  const {
    isLoading: isDepositConfirming,
    isSuccess: isDepositSuccess,
    error: depositConfirmError,
  } = useWaitForTransactionReceipt({
    hash: depositHash,
    timeout: 60_000, // 60 second timeout
    pollingInterval: 3_000, // Poll every 3 seconds
    confirmations: 1, // Wait for 1 confirmation
    query: {
      enabled: !!depositHash,
      retry: 3,
      retryDelay: 2000,
    },
  })

  const approve = (tokenId: bigint) => {
    approveNFT({
      address: invoiceNFTAddress,
      abi: InvoiceNFTABI,
      functionName: "approve",
      args: [yieldVaultAddress, tokenId],
    })
  }

  const deposit = async (params: {
    tokenId: bigint
    strategy: Strategy
    principal: bigint
  }) => {
    depositToVault({
      address: yieldVaultAddress,
      abi: YieldVaultABI,
      functionName: "deposit",
      args: [params.tokenId, params.strategy, params.principal],
    })
  }

  return {
    approve,
    deposit,
    approveHash,
    depositHash,
    isApproving,
    isApproveConfirming,
    isApproveSuccess,
    approveError,
    approveConfirmError,
    isDepositing,
    isDepositConfirming,
    isDepositSuccess,
    depositError,
    depositConfirmError,
  }
}

export function useWithdrawFromVault() {
  const chainId = useChainId()
  const contractAddress = getYieldVaultAddress(chainId)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const withdraw = async (tokenId: bigint) => {
    writeContract({
      address: contractAddress,
      abi: YieldVaultABI,
      functionName: "withdraw",
      args: [tokenId],
    })
  }

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useChangeStrategy() {
  const chainId = useChainId()
  const contractAddress = getYieldVaultAddress(chainId)

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const changeStrategy = async (tokenId: bigint, newStrategy: Strategy) => {
    writeContract({
      address: contractAddress,
      abi: YieldVaultABI,
      functionName: "changeStrategy",
      args: [tokenId, newStrategy],
    })
  }

  return {
    changeStrategy,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

// Helper function to get strategy label
function getStrategyLabel(strategy: Strategy): string {
  const labels: Record<Strategy, string> = {
    [Strategy.Hold]: "Hold",
    [Strategy.Conservative]: "Conservative",
    [Strategy.Aggressive]: "Aggressive",
  }
  return labels[strategy] || "Unknown"
}

// Helper to get APY for a strategy
export function getStrategyAPY(strategy: Strategy): number {
  const apys: Record<Strategy, number> = {
    [Strategy.Hold]: 0,
    [Strategy.Conservative]: 3.5,
    [Strategy.Aggressive]: 7,
  }
  return apys[strategy] || 0
}
