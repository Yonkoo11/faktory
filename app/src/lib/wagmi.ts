import { http, createConfig, defineChain } from 'wagmi';
import { mantleSepoliaTestnet, mantle } from 'wagmi/chains';

// Local Anvil chain for development
export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [anvil, mantleSepoliaTestnet, mantle],
  transports: {
    [anvil.id]: http(),
    [mantleSepoliaTestnet.id]: http(),
    [mantle.id]: http(),
  },
});

// Contract addresses (update after deployment)
export const CONTRACTS = {
  invoiceNFT: process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS || '0x0000000000000000000000000000000000000000',
  yieldVault: process.env.NEXT_PUBLIC_YIELD_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000',
  privacyRegistry: process.env.NEXT_PUBLIC_PRIVACY_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  agentRouter: process.env.NEXT_PUBLIC_AGENT_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  mockOracle: process.env.NEXT_PUBLIC_MOCK_ORACLE_ADDRESS || '0x0000000000000000000000000000000000000000',
} as const;

// WebSocket URL for agent
export const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'ws://localhost:8080';

// Supported chain IDs
export const SUPPORTED_CHAINS = [anvil.id, mantleSepoliaTestnet.id, mantle.id];
