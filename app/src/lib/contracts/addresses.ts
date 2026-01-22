// Contract addresses for Faktory Protocol
// Deployed on Cronos for x402 PayTech Hackathon

import { isAddress } from 'viem'

export const CHAIN_IDS = {
  CRONOS_TESTNET: 338,
  CRONOS_MAINNET: 25,
  LOCAL: 31337,
} as const

type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]

type ContractAddresses = {
  invoiceNFT: `0x${string}`
  yieldVault: `0x${string}`
  agentRouter: `0x${string}`
}

// Contract addresses per chain
const addresses: Record<ChainId, ContractAddresses> = {
  // Cronos Testnet - x402 PayTech Hackathon deployment
  [CHAIN_IDS.CRONOS_TESTNET]: {
    invoiceNFT: "0xEde6Db2855BACF191E5B2E2d91B6276bB56bf183",
    yieldVault: "0xD0db0eb608107862E963737FE87ffdFF7f400e3C",
    agentRouter: "0xb8F4546e24e437779bC09c3b70ce70Ff9542bdD4",
  },
  // Cronos Mainnet - not yet deployed
  [CHAIN_IDS.CRONOS_MAINNET]: {
    invoiceNFT: "0x0000000000000000000000000000000000000000",
    yieldVault: "0x0000000000000000000000000000000000000000",
    agentRouter: "0x0000000000000000000000000000000000000000",
  },
  // Local development (Anvil)
  [CHAIN_IDS.LOCAL]: {
    invoiceNFT: (process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`,
    yieldVault: (process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS ||
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`,
    agentRouter: (process.env.NEXT_PUBLIC_AGENT_ROUTER_ADDRESS ||
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9") as `0x${string}`,
  },
}

export function getContractAddresses(chainId: number): ContractAddresses {
  const chainAddresses = addresses[chainId as ChainId]
  if (!chainAddresses) {
    // Default to Cronos testnet if chain not found
    return addresses[CHAIN_IDS.CRONOS_TESTNET]
  }
  return chainAddresses
}

export function getInvoiceNFTAddress(chainId: number): `0x${string}` {
  return getContractAddresses(chainId).invoiceNFT
}

export function getYieldVaultAddress(chainId: number): `0x${string}` {
  return getContractAddresses(chainId).yieldVault
}

export function getAgentRouterAddress(chainId: number): `0x${string}` {
  return getContractAddresses(chainId).agentRouter
}

// Check if contracts are deployed
export function areContractsDeployed(chainId: number): boolean {
  const addrs = getContractAddresses(chainId)
  const zeroAddress = "0x0000000000000000000000000000000000000000"
  return (
    addrs.invoiceNFT !== zeroAddress &&
    addrs.yieldVault !== zeroAddress &&
    addrs.agentRouter !== zeroAddress
  )
}

// Validate that an address is a valid Ethereum address
export function isValidContractAddress(address: string): boolean {
  if (!address) return false
  if (address === "0x0000000000000000000000000000000000000000") return false
  return isAddress(address)
}

// Validate all contract addresses and log warnings
export function validateContractAddresses(chainId: number): {
  valid: boolean
  errors: string[]
} {
  const addrs = getContractAddresses(chainId)
  const errors: string[] = []

  if (!isValidContractAddress(addrs.invoiceNFT)) {
    errors.push(`InvoiceNFT address is invalid: ${addrs.invoiceNFT}`)
  }
  if (!isValidContractAddress(addrs.yieldVault)) {
    errors.push(`YieldVault address is invalid: ${addrs.yieldVault}`)
  }
  if (!isValidContractAddress(addrs.agentRouter)) {
    errors.push(`AgentRouter address is invalid: ${addrs.agentRouter}`)
  }

  if (errors.length > 0 && typeof window !== 'undefined') {
    console.warn('[Faktory] Contract address validation errors:', errors)
  }

  return { valid: errors.length === 0, errors }
}
