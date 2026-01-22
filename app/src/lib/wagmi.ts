import { http, createConfig } from 'wagmi';
import { cronosTestnet, cronos } from 'wagmi/chains';
import { defineChain } from 'viem';
import { injected, walletConnect } from '@wagmi/connectors';

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
  chains: [anvil, cronosTestnet, cronos],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dummy-project-id',
      showQrModal: true,
    }),
  ],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545', {
      timeout: 30_000, // 30s timeout for local Anvil
      retryCount: 3,
      retryDelay: 1000,
    }),
    [cronosTestnet.id]: http(
      process.env.NEXT_PUBLIC_CRONOS_RPC || 'https://evm-t3.cronos.org',
      {
        timeout: 60_000, // 60s timeout for testnet
        retryCount: 3,
        retryDelay: 2000,
      }
    ),
    [cronos.id]: http(
      process.env.NEXT_PUBLIC_CRONOS_MAINNET_RPC || 'https://evm.cronos.org',
      {
        timeout: 90_000, // 90s timeout for mainnet
        retryCount: 3,
        retryDelay: 3000,
      }
    ),
  },
  pollingInterval: 1_000, // Poll every 1 second (Cronos has fast blocks)
});

// WebSocket URL for agent
export const AGENT_WS_URL = process.env.NEXT_PUBLIC_AGENT_WS_URL || 'ws://localhost:8080';

// Supported chain IDs
export const SUPPORTED_CHAINS = [anvil.id, cronosTestnet.id, cronos.id];
