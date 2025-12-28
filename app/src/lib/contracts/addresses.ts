// Contract addresses for Faktory Protocol
// Update these after deploying to Mantle testnet

export const CHAIN_IDS = {
  MANTLE_TESTNET: 5003,
  MANTLE_MAINNET: 5000,
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
  // Mantle Sepolia Testnet
  [CHAIN_IDS.MANTLE_TESTNET]: {
    invoiceNFT: (process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    yieldVault: (process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    agentRouter: (process.env.NEXT_PUBLIC_AGENT_ROUTER_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  },
  // Mantle Mainnet
  [CHAIN_IDS.MANTLE_MAINNET]: {
    invoiceNFT: "0x0000000000000000000000000000000000000000",
    yieldVault: "0x0000000000000000000000000000000000000000",
    agentRouter: "0x0000000000000000000000000000000000000000",
  },
  // Local development (Anvil) - uses env vars or default Deploy.s.sol output
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
    // Default to testnet if chain not found
    return addresses[CHAIN_IDS.MANTLE_TESTNET]
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
