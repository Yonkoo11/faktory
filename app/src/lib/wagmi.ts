import { http, createConfig } from 'wagmi';
import { mantleSepoliaTestnet, mantle } from 'wagmi/chains';
import { defineChain } from 'viem';

// Re-export address utilities from centralized source
export {
  getContractAddresses,
  getInvoiceNFTAddress,
  getYieldVaultAddress,
  getAgentRouterAddress,
  areContractsDeployed,
  CHAIN_IDS,
} from './contracts/addresses';

// Local Anvil chain for development
export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
});

export const config = createConfig({
  chains: [anvil, mantleSepoliaTestnet, mantle],
  transports: {
    [anvil.id]: http(),
    [mantleSepoliaTestnet.id]: http(),
    [mantle.id]: http(),
  },
});

// WebSocket URL for agent
export const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'ws://localhost:8080';

// Supported chain IDs
export const SUPPORTED_CHAINS = [anvil.id, mantleSepoliaTestnet.id, mantle.id];
