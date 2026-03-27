import { http, createConfig } from 'wagmi';
import {
  mainnet, sepolia,
  base, baseSepolia,
  arbitrum, arbitrumSepolia,
  polygon, polygonAmoy,
  bsc,
} from 'wagmi/chains';
import { defineChain } from 'viem';
import { injected, walletConnect } from '@wagmi/connectors';

export {
  getContractAddresses,
  getInvoiceNFTAddress,
  getYieldVaultAddress,
  getAgentRouterAddress,
  areContractsDeployed,
  getChainMeta,
  CHAIN_IDS,
  SUPPORTED_MAINNET_CHAINS,
  SUPPORTED_TESTNET_CHAINS,
} from './contracts/addresses';

export type { ContractAddresses, ChainMeta } from './contracts/addresses';

// Local Anvil chain
export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

// SKALE Europa Hub
export const skaleEuropa = defineChain({
  id: 2046399126,
  name: 'SKALE Europa',
  nativeCurrency: { name: 'sFUEL', symbol: 'sFUEL', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.skalenodes.com/v1/elated-tan-skat'] } },
  blockExplorers: {
    default: {
      name: 'SKALE Explorer',
      url: 'https://elated-tan-skat.explorer.mainnet.skalenodes.com',
    },
  },
});

const isTestnet = process.env.NEXT_PUBLIC_NETWORK_MODE === 'testnet';

// Mainnet chains
const mainnetChains = [mainnet, bsc, base, arbitrum, polygon, skaleEuropa] as const;
// Testnet chains
const testnetChains = [sepolia, baseSepolia, arbitrumSepolia, polygonAmoy] as const;
// Dev chain
const devChains = [anvil] as const;

const isDev = process.env.NODE_ENV === 'development';

export const config = createConfig({
  chains: [
    ...(isTestnet ? testnetChains : mainnetChains),
    ...(isDev ? devChains : []),
  ],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
      showQrModal: true,
    }),
  ],
  transports: {
    // Mainnets
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ETH_RPC || undefined),
    [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.binance.org'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC || undefined),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || undefined),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC || undefined),
    [skaleEuropa.id]: http('https://mainnet.skalenodes.com/v1/elated-tan-skat'),
    // Testnets
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC || undefined),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || undefined),
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || undefined),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || undefined),
    // Local
    [anvil.id]: http('http://127.0.0.1:8545'),
  },
});

// WebSocket URL for agent
export const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'ws://localhost:8080';

// Get all supported chain IDs based on network mode
export const SUPPORTED_CHAINS = isTestnet
  ? testnetChains.map(c => c.id)
  : mainnetChains.map(c => c.id);
