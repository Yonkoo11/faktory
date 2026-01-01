/**
 * Contract Clients - Barrel Export
 *
 * Clean imports for contract clients and related utilities.
 */

// Client classes
export { InvoiceNFTClient, InvoiceStatus } from './InvoiceNFTClient'
export { YieldVaultClient, Strategy } from './YieldVaultClient'
export { AgentRouterClient } from './AgentRouterClient'

// React hooks
export {
  useInvoiceNFTClient,
  useYieldVaultClient,
  useAgentRouterClient,
  useContractClients,
} from './useContractClients'

// TypeScript types
export type { Invoice, MintInvoiceParams } from './InvoiceNFTClient'
export type { Deposit, DepositParams } from './YieldVaultClient'
export type { AgentConfig, AgentDecision } from './AgentRouterClient'
