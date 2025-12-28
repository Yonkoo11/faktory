// Server-side contract interaction utilities
import { createPublicClient, http, type Address } from "viem"
import { mantleSepoliaTestnet, mantle } from "viem/chains"
import { InvoiceNFTABI, YieldVaultABI, AgentRouterABI, type Invoice, type Deposit, InvoiceStatus, Strategy } from "./abis"
import { CHAIN_IDS, getContractAddresses } from "./addresses"

// Get chain based on environment
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || CHAIN_IDS.MANTLE_TESTNET)
const chain = chainId === CHAIN_IDS.MANTLE_MAINNET ? mantle : mantleSepoliaTestnet

// Create public client for reading contracts
export const publicClient = createPublicClient({
  chain,
  transport: http(process.env.NEXT_PUBLIC_MANTLE_RPC || chain.rpcUrls.default.http[0]),
})

const addresses = getContractAddresses(chainId)

// Invoice NFT reads
export async function getInvoice(tokenId: bigint): Promise<Invoice | null> {
  try {
    const result = await publicClient.readContract({
      address: addresses.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: "getInvoice",
      args: [tokenId],
    })
    return result as Invoice
  } catch {
    return null
  }
}

export async function getTotalInvoices(): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: addresses.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: "totalInvoices",
    })
    return Number(result)
  } catch {
    return 0
  }
}

export async function getActiveInvoices(): Promise<bigint[]> {
  try {
    const result = await publicClient.readContract({
      address: addresses.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: "getActiveInvoices",
    })
    return result as bigint[]
  } catch {
    return []
  }
}

export async function getUserInvoiceBalance(address: Address): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: addresses.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: "balanceOf",
      args: [address],
    })
    return Number(result)
  } catch {
    return 0
  }
}

export async function getInvoiceOwner(tokenId: bigint): Promise<Address | null> {
  try {
    const result = await publicClient.readContract({
      address: addresses.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: "ownerOf",
      args: [tokenId],
    })
    return result as Address
  } catch {
    return null
  }
}

// Yield Vault reads
export async function getDeposit(tokenId: bigint): Promise<Deposit | null> {
  try {
    const result = await publicClient.readContract({
      address: addresses.yieldVault,
      abi: YieldVaultABI,
      functionName: "getDeposit",
      args: [tokenId],
    })
    return result as Deposit
  } catch {
    return null
  }
}

export async function getAccruedYield(tokenId: bigint): Promise<bigint> {
  try {
    const result = await publicClient.readContract({
      address: addresses.yieldVault,
      abi: YieldVaultABI,
      functionName: "getAccruedYield",
      args: [tokenId],
    })
    return result as bigint
  } catch {
    return BigInt(0)
  }
}

export async function getTotalValueLocked(): Promise<bigint> {
  try {
    const result = await publicClient.readContract({
      address: addresses.yieldVault,
      abi: YieldVaultABI,
      functionName: "totalValueLocked",
    })
    return result as bigint
  } catch {
    return BigInt(0)
  }
}

export async function getTotalYieldGenerated(): Promise<bigint> {
  try {
    const result = await publicClient.readContract({
      address: addresses.yieldVault,
      abi: YieldVaultABI,
      functionName: "totalYieldGenerated",
    })
    return result as bigint
  } catch {
    return BigInt(0)
  }
}

export async function getActiveDeposits(): Promise<bigint[]> {
  try {
    const result = await publicClient.readContract({
      address: addresses.yieldVault,
      abi: YieldVaultABI,
      functionName: "getActiveDeposits",
    })
    return result as bigint[]
  } catch {
    return []
  }
}

// Agent Router reads
export async function getDecisionHistory(tokenId: bigint) {
  try {
    const result = await publicClient.readContract({
      address: addresses.agentRouter,
      abi: AgentRouterABI,
      functionName: "getDecisionHistory",
      args: [tokenId],
    })
    return result
  } catch {
    return []
  }
}

export async function getTotalDecisions(): Promise<number> {
  try {
    const result = await publicClient.readContract({
      address: addresses.agentRouter,
      abi: AgentRouterABI,
      functionName: "totalDecisions",
    })
    return Number(result)
  } catch {
    return 0
  }
}

export async function getAgentConfig() {
  try {
    const result = await publicClient.readContract({
      address: addresses.agentRouter,
      abi: AgentRouterABI,
      functionName: "getConfig",
    })
    return result
  } catch {
    return null
  }
}

// Helper to get formatted invoice data
export async function getFormattedInvoice(tokenId: bigint) {
  const invoice = await getInvoice(tokenId)
  if (!invoice) return null

  const owner = await getInvoiceOwner(tokenId)
  const deposit = await getDeposit(tokenId)
  const accruedYield = deposit?.active ? await getAccruedYield(tokenId) : BigInt(0)

  return {
    tokenId: tokenId.toString(),
    dataCommitment: invoice.dataCommitment,
    amountCommitment: invoice.amountCommitment,
    dueDate: new Date(Number(invoice.dueDate) * 1000).toISOString(),
    createdAt: new Date(Number(invoice.createdAt) * 1000).toISOString(),
    issuer: invoice.issuer,
    owner,
    status: getStatusLabel(invoice.status as InvoiceStatus),
    statusCode: invoice.status,
    riskScore: invoice.riskScore,
    paymentProbability: invoice.paymentProbability,
    deposit: deposit?.active
      ? {
          strategy: getStrategyLabel(deposit.strategy as Strategy),
          strategyCode: deposit.strategy,
          depositTime: new Date(Number(deposit.depositTime) * 1000).toISOString(),
          principal: deposit.principal.toString(),
          accruedYield: accruedYield.toString(),
        }
      : null,
  }
}

// Helper functions
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

function getStrategyLabel(strategy: Strategy): string {
  const labels: Record<Strategy, string> = {
    [Strategy.Hold]: "Hold",
    [Strategy.Conservative]: "Conservative",
    [Strategy.Aggressive]: "Aggressive",
  }
  return labels[strategy] || "Unknown"
}
