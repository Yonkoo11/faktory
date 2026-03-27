// Contract addresses for Faktory Protocol - Multichain
import { isAddress } from 'viem'

export const CHAIN_IDS = {
  ETHEREUM: 1,
  BSC: 56,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  SKALE: 2046399126,
  // Testnets
  SEPOLIA: 11155111,
  BSC_TESTNET: 97,
  POLYGON_AMOY: 80002,
  BASE_SEPOLIA: 84532,
  ARBITRUM_SEPOLIA: 421614,
  SKALE_TESTNET: 1444673419,
  // Local
  LOCAL: 31337,
} as const

type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]

export type ContractAddresses = {
  invoiceNFT: `0x${string}`
  yieldVault: `0x${string}`
  agentRouter: `0x${string}`
  privacyRegistry: `0x${string}`
  pythOracle: `0x${string}`
  aaveYieldSource: `0x${string}`
}

const ZERO = "0x0000000000000000000000000000000000000000" as `0x${string}`

const emptyAddresses: ContractAddresses = {
  invoiceNFT: ZERO,
  yieldVault: ZERO,
  agentRouter: ZERO,
  privacyRegistry: ZERO,
  pythOracle: ZERO,
  aaveYieldSource: ZERO,
}

// Contract addresses per chain - populated after deployment
const addresses: Partial<Record<ChainId, ContractAddresses>> = {
  // Testnets - will be populated after deployment
  [CHAIN_IDS.BASE_SEPOLIA]: {
    invoiceNFT: "0x515ab226DD7917612eeDd439A9Cfb0b4b1731440",
    yieldVault: "0xacBeB5f58604A4A9A8B9a74EC39ebCA1117bC326",
    agentRouter: "0xEe9AD131A155E7669004056F01fFb26964637Fd4",
    privacyRegistry: "0xaA9e2C3DF776c3d552E2358AcF8155C91929EF1B",
    pythOracle: "0xA0E9510fBe1Ee857B255B2960438122fdA0b32E3",
    aaveYieldSource: "0x447De96C1c3E15af485a41fb1B5Fde888B02d9eF",
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: { ...emptyAddresses },
  [CHAIN_IDS.POLYGON_AMOY]: { ...emptyAddresses },
  [CHAIN_IDS.SEPOLIA]: { ...emptyAddresses },

  // Mainnets - will be populated after testnet verification
  [CHAIN_IDS.ETHEREUM]: { ...emptyAddresses },
  [CHAIN_IDS.BSC]: { ...emptyAddresses },
  [CHAIN_IDS.BASE]: { ...emptyAddresses },
  [CHAIN_IDS.ARBITRUM]: { ...emptyAddresses },
  [CHAIN_IDS.POLYGON]: { ...emptyAddresses },
  [CHAIN_IDS.SKALE]: { ...emptyAddresses, pythOracle: ZERO, aaveYieldSource: ZERO },

  // Local development (Anvil)
  [CHAIN_IDS.LOCAL]: {
    invoiceNFT: (process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`,
    yieldVault: (process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS || "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`,
    agentRouter: (process.env.NEXT_PUBLIC_AGENT_ROUTER_ADDRESS || "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9") as `0x${string}`,
    privacyRegistry: (process.env.NEXT_PUBLIC_PRIVACY_REGISTRY_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0") as `0x${string}`,
    pythOracle: ZERO,
    aaveYieldSource: ZERO,
  },
}

// Chain metadata for UI
export type ChainMeta = {
  name: string
  shortName: string
  hasAave: boolean
  hasPyth: boolean
  gasLabel: string
  explorerUrl: string
  nativeCurrency: string
}

export const CHAIN_META: Partial<Record<ChainId, ChainMeta>> = {
  [CHAIN_IDS.ETHEREUM]: {
    name: "Ethereum", shortName: "ETH", hasAave: true, hasPyth: true,
    gasLabel: "~$2-10", explorerUrl: "https://etherscan.io", nativeCurrency: "ETH",
  },
  [CHAIN_IDS.BSC]: {
    name: "BNB Chain", shortName: "BSC", hasAave: true, hasPyth: true,
    gasLabel: "~$0.05", explorerUrl: "https://bscscan.com", nativeCurrency: "BNB",
  },
  [CHAIN_IDS.BASE]: {
    name: "Base", shortName: "BASE", hasAave: true, hasPyth: true,
    gasLabel: "~$0.01", explorerUrl: "https://basescan.org", nativeCurrency: "ETH",
  },
  [CHAIN_IDS.ARBITRUM]: {
    name: "Arbitrum", shortName: "ARB", hasAave: true, hasPyth: true,
    gasLabel: "~$0.01", explorerUrl: "https://arbiscan.io", nativeCurrency: "ETH",
  },
  [CHAIN_IDS.POLYGON]: {
    name: "Polygon", shortName: "MATIC", hasAave: true, hasPyth: true,
    gasLabel: "~$0.01", explorerUrl: "https://polygonscan.com", nativeCurrency: "POL",
  },
  [CHAIN_IDS.SKALE]: {
    name: "SKALE Europa", shortName: "SKALE", hasAave: false, hasPyth: false,
    gasLabel: "FREE", explorerUrl: "https://elated-tan-skat.explorer.mainnet.skalenodes.com", nativeCurrency: "sFUEL",
  },
  // Testnets
  [CHAIN_IDS.SEPOLIA]: {
    name: "Sepolia", shortName: "SEP", hasAave: true, hasPyth: true,
    gasLabel: "~$0", explorerUrl: "https://sepolia.etherscan.io", nativeCurrency: "ETH",
  },
  [CHAIN_IDS.BASE_SEPOLIA]: {
    name: "Base Sepolia", shortName: "B-SEP", hasAave: true, hasPyth: true,
    gasLabel: "~$0", explorerUrl: "https://sepolia.basescan.org", nativeCurrency: "ETH",
  },
  [CHAIN_IDS.ARBITRUM_SEPOLIA]: {
    name: "Arbitrum Sepolia", shortName: "A-SEP", hasAave: true, hasPyth: true,
    gasLabel: "~$0", explorerUrl: "https://sepolia.arbiscan.io", nativeCurrency: "ETH",
  },
  [CHAIN_IDS.POLYGON_AMOY]: {
    name: "Polygon Amoy", shortName: "P-AMOY", hasAave: true, hasPyth: true,
    gasLabel: "~$0", explorerUrl: "https://amoy.polygonscan.com", nativeCurrency: "POL",
  },
}

export const SUPPORTED_MAINNET_CHAINS = [
  CHAIN_IDS.ETHEREUM, CHAIN_IDS.BSC, CHAIN_IDS.BASE,
  CHAIN_IDS.ARBITRUM, CHAIN_IDS.POLYGON, CHAIN_IDS.SKALE,
] as const

export const SUPPORTED_TESTNET_CHAINS = [
  CHAIN_IDS.SEPOLIA, CHAIN_IDS.BASE_SEPOLIA,
  CHAIN_IDS.ARBITRUM_SEPOLIA, CHAIN_IDS.POLYGON_AMOY,
] as const

export function getContractAddresses(chainId: number): ContractAddresses {
  return addresses[chainId as ChainId] || emptyAddresses
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

export function areContractsDeployed(chainId: number): boolean {
  const addrs = getContractAddresses(chainId)
  return addrs.invoiceNFT !== ZERO && addrs.yieldVault !== ZERO && addrs.agentRouter !== ZERO
}

export function getChainMeta(chainId: number): ChainMeta | undefined {
  return CHAIN_META[chainId as ChainId]
}

export function isValidContractAddress(address: string): boolean {
  if (!address) return false
  if (address === ZERO) return false
  return isAddress(address)
}

export function validateContractAddresses(chainId: number): { valid: boolean; errors: string[] } {
  const addrs = getContractAddresses(chainId)
  const errors: string[] = []

  if (!isValidContractAddress(addrs.invoiceNFT)) errors.push(`InvoiceNFT address is invalid: ${addrs.invoiceNFT}`)
  if (!isValidContractAddress(addrs.yieldVault)) errors.push(`YieldVault address is invalid: ${addrs.yieldVault}`)
  if (!isValidContractAddress(addrs.agentRouter)) errors.push(`AgentRouter address is invalid: ${addrs.agentRouter}`)

  return { valid: errors.length === 0, errors }
}
