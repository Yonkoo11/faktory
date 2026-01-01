import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * Transaction types in the application
 */
export type TransactionType =
  | 'mint'
  | 'deposit'
  | 'withdraw'
  | 'approve'
  | 'changeStrategy'

/**
 * Transaction status lifecycle
 */
export type TransactionStatus = 'pending' | 'confirming' | 'success' | 'error'

/**
 * Pending transaction data structure
 */
export interface PendingTransaction {
  /** Transaction hash from blockchain */
  hash: string

  /** Type of transaction for categorization and icons */
  type: TransactionType

  /** Current status of the transaction */
  status: TransactionStatus

  /** Unix timestamp when transaction was initiated */
  timestamp: number

  /** Optional: Token ID related to this transaction */
  tokenId?: string | number

  /** Optional: Human-readable description */
  description?: string

  /** Optional: Error message if transaction failed */
  error?: string
}

/**
 * Transaction Store State
 */
interface TransactionStore {
  /** All pending and recent transactions */
  transactions: PendingTransaction[]

  /** Add a new transaction to the queue */
  addTransaction: (
    tx: Omit<PendingTransaction, 'timestamp' | 'status'>
  ) => void

  /** Update transaction status (e.g., pending → confirming → success) */
  updateTransaction: (hash: string, updates: Partial<PendingTransaction>) => void

  /** Remove a specific transaction */
  removeTransaction: (hash: string) => void

  /** Clear all completed transactions (success or error > 5 minutes old) */
  clearCompleted: () => void

  /** Clear all transactions */
  clearAll: () => void

  /** Get transaction by hash */
  getTransaction: (hash: string) => PendingTransaction | undefined

  /** Get all transactions of a specific type */
  getTransactionsByType: (type: TransactionType) => PendingTransaction[]

  /** Get transactions by status */
  getTransactionsByStatus: (status: TransactionStatus) => PendingTransaction[]
}

/**
 * Global Transaction Store
 *
 * Manages all pending blockchain transactions with real-time status updates.
 * Used to show transaction progress in UI (toast notifications, status badges, etc.)
 *
 * Features:
 * - Tracks transaction lifecycle (pending → confirming → success/error)
 * - Automatic cleanup of old completed transactions
 * - Type-safe transaction categorization
 * - Immutable updates via Immer middleware
 *
 * Example usage:
 * ```tsx
 * const { addTransaction, updateTransaction } = useTransactionStore()
 *
 * // When initiating a deposit
 * addTransaction({
 *   hash: '0x123...',
 *   type: 'deposit',
 *   tokenId: '42',
 *   description: 'Depositing Invoice #42'
 * })
 *
 * // When transaction is mined
 * updateTransaction('0x123...', { status: 'success' })
 * ```
 */
export const useTransactionStore = create<TransactionStore>()(
  immer((set, get) => ({
    transactions: [],

    addTransaction: (tx) =>
      set((state) => {
        state.transactions.push({
          ...tx,
          status: 'pending',
          timestamp: Date.now(),
        })
      }),

    updateTransaction: (hash, updates) =>
      set((state) => {
        const txIndex = state.transactions.findIndex((t) => t.hash === hash)
        if (txIndex !== -1) {
          Object.assign(state.transactions[txIndex], updates)
        }
      }),

    removeTransaction: (hash) =>
      set((state) => {
        state.transactions = state.transactions.filter((t) => t.hash !== hash)
      }),

    clearCompleted: () =>
      set((state) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
        state.transactions = state.transactions.filter(
          (tx) =>
            !(
              (tx.status === 'success' || tx.status === 'error') &&
              tx.timestamp < fiveMinutesAgo
            )
        )
      }),

    clearAll: () =>
      set((state) => {
        state.transactions = []
      }),

    getTransaction: (hash) => {
      return get().transactions.find((t) => t.hash === hash)
    },

    getTransactionsByType: (type) => {
      return get().transactions.filter((t) => t.type === type)
    },

    getTransactionsByStatus: (status) => {
      return get().transactions.filter((t) => t.status === status)
    },
  }))
)

/**
 * Hook to get pending transactions count
 * Useful for showing notification badges
 */
export const usePendingTransactionsCount = () => {
  return useTransactionStore((state) =>
    state.transactions.filter(
      (tx) => tx.status === 'pending' || tx.status === 'confirming'
    ).length
  )
}

/**
 * Hook to check if a specific transaction is pending
 */
export const useIsTransactionPending = (hash: string | undefined) => {
  return useTransactionStore((state) => {
    if (!hash) return false
    const tx = state.transactions.find((t) => t.hash === hash)
    return tx ? tx.status === 'pending' || tx.status === 'confirming' : false
  })
}
