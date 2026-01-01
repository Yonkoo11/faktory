/**
 * Vault Feature - Barrel Export
 */

// Components
export { DepositModal } from './components/DepositModal'

// Hooks
export { useDepositFlow } from './hooks/useDepositFlow'
export { useStrategyConfig } from './hooks/useStrategyConfig'

// API / Queries
export {
  useVaultTVL,
  useVaultDeposit,
  useAccruedYield,
  useActiveDepositsCount,
  useConservativeAPY,
  useAggressiveAPY,
  useDepositMutation,
  useWithdrawMutation,
  useChangeStrategyMutation,
} from './api/vaultQueries'
