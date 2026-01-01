/**
 * Contract Error Handling Utilities
 *
 * Transforms technical blockchain errors into user-friendly, actionable messages.
 * Follows UX principle: Always explain WHAT happened, WHY it matters, and HOW to fix it.
 */

/**
 * Known error codes from contracts and wallets
 */
export enum ErrorCode {
  // User errors
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_ALLOWANCE = 'INSUFFICIENT_ALLOWANCE',

  // Contract errors
  INVALID_INVOICE = 'INVALID_INVOICE',
  INVOICE_NOT_ACTIVE = 'INVOICE_NOT_ACTIVE',
  ALREADY_DEPOSITED = 'ALREADY_DEPOSITED',
  NOT_INVOICE_OWNER = 'NOT_INVOICE_OWNER',
  DEPOSIT_NOT_FOUND = 'DEPOSIT_NOT_FOUND',
  WITHDRAWAL_TOO_EARLY = 'WITHDRAWAL_TOO_EARLY',
  INVALID_STRATEGY = 'INVALID_STRATEGY',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  CHAIN_MISMATCH = 'CHAIN_MISMATCH',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Structured error with user-friendly messaging
 */
export class ContractError extends Error {
  constructor(
    /** Original error message (for logging) */
    message: string,
    /** Categorized error code */
    public code: ErrorCode,
    /** User-friendly message explaining what happened */
    public userMessage: string,
    /** Optional: Suggested action to fix the issue */
    public action?: string,
    /** Original error object */
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ContractError'
  }
}

/**
 * Parse contract revert reasons into user-friendly messages
 */
function parseRevertReason(reason: string): { code: ErrorCode; userMessage: string; action?: string } {
  const lowerReason = reason.toLowerCase()

  // Invoice-related errors
  if (lowerReason.includes('invoice not active') || lowerReason.includes('inactive invoice')) {
    return {
      code: ErrorCode.INVOICE_NOT_ACTIVE,
      userMessage: 'This invoice is no longer active.',
      action: 'Please select a different invoice or mint a new one.',
    }
  }

  if (lowerReason.includes('not invoice owner') || lowerReason.includes('only owner')) {
    return {
      code: ErrorCode.NOT_INVOICE_OWNER,
      userMessage: "You don't own this invoice.",
      action: 'Only the invoice owner can perform this action.',
    }
  }

  if (lowerReason.includes('already deposited')) {
    return {
      code: ErrorCode.ALREADY_DEPOSITED,
      userMessage: 'This invoice is already deposited.',
      action: 'Withdraw the current deposit before depositing again.',
    }
  }

  // Deposit/Withdrawal errors
  if (lowerReason.includes('deposit not found') || lowerReason.includes('no deposit')) {
    return {
      code: ErrorCode.DEPOSIT_NOT_FOUND,
      userMessage: 'No active deposit found for this invoice.',
      action: 'Make sure you have an active deposit before withdrawing.',
    }
  }

  if (lowerReason.includes('too early') || lowerReason.includes('lock period')) {
    return {
      code: ErrorCode.WITHDRAWAL_TOO_EARLY,
      userMessage: 'Cannot withdraw yet - funds are still locked.',
      action: 'Please wait until the lock period ends before withdrawing.',
    }
  }

  // Strategy errors
  if (lowerReason.includes('invalid strategy')) {
    return {
      code: ErrorCode.INVALID_STRATEGY,
      userMessage: 'The selected yield strategy is invalid.',
      action: 'Please choose a valid strategy: Hold, Conservative, or Aggressive.',
    }
  }

  // Default for unrecognized revert
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    userMessage: 'Transaction failed due to a contract error.',
    action: 'Please try again or contact support if the issue persists.',
  }
}

/**
 * Parse blockchain/wallet errors into user-friendly ContractError
 *
 * Handles errors from:
 * - User wallet (MetaMask, etc.)
 * - Smart contracts (revert reasons)
 * - Network/RPC issues
 * - Invalid parameters
 */
export function parseContractError(error: unknown): ContractError {
  // Handle null/undefined
  if (!error) {
    return new ContractError(
      'Unknown error',
      ErrorCode.UNKNOWN_ERROR,
      'An unexpected error occurred.',
      'Please try again.',
      error
    )
  }

  const err = error as any
  const message = err.message || err.toString()
  const lowerMessage = message.toLowerCase()

  // User rejected transaction
  if (
    lowerMessage.includes('user rejected') ||
    lowerMessage.includes('user denied') ||
    lowerMessage.includes('user cancelled') ||
    err.code === 4001 || // MetaMask rejection code
    err.code === 'ACTION_REJECTED'
  ) {
    return new ContractError(
      message,
      ErrorCode.USER_REJECTED,
      'You cancelled the transaction.',
      'No funds were moved. Click the button again if you want to retry.',
      error
    )
  }

  // Insufficient funds
  if (
    lowerMessage.includes('insufficient funds') ||
    lowerMessage.includes('insufficient balance') ||
    lowerMessage.includes('exceeds balance')
  ) {
    return new ContractError(
      message,
      ErrorCode.INSUFFICIENT_FUNDS,
      'Insufficient balance to complete this transaction.',
      'Please add more MNT to your wallet to cover gas fees.',
      error
    )
  }

  // Insufficient allowance (ERC20 approval needed)
  if (
    lowerMessage.includes('insufficient allowance') ||
    lowerMessage.includes('exceeds allowance') ||
    lowerMessage.includes('erc20: transfer amount exceeds allowance')
  ) {
    return new ContractError(
      message,
      ErrorCode.INSUFFICIENT_ALLOWANCE,
      'Token approval required.',
      'Please approve the contract to spend your tokens first.',
      error
    )
  }

  // Contract revert with reason
  if (lowerMessage.includes('execution reverted') || lowerMessage.includes('revert')) {
    // Try to extract revert reason
    const revertMatch = message.match(/reverted with reason string ['"](.+?)['"]/i)
    const revertReason = revertMatch?.[1] || message

    const parsed = parseRevertReason(revertReason)
    return new ContractError(message, parsed.code, parsed.userMessage, parsed.action, error)
  }

  // Network/RPC errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch failed')
  ) {
    return new ContractError(
      message,
      ErrorCode.NETWORK_ERROR,
      'Network connection issue.',
      'Please check your internet connection and try again.',
      error
    )
  }

  // RPC errors
  if (lowerMessage.includes('rpc') || lowerMessage.includes('provider')) {
    return new ContractError(
      message,
      ErrorCode.RPC_ERROR,
      'Unable to connect to blockchain.',
      'The RPC node may be down. Please try again in a moment.',
      error
    )
  }

  // Chain mismatch
  if (lowerMessage.includes('chain') || lowerMessage.includes('network mismatch')) {
    return new ContractError(
      message,
      ErrorCode.CHAIN_MISMATCH,
      'Wrong network selected.',
      'Please switch to Mantle Network in your wallet.',
      error
    )
  }

  // Generic fallback
  return new ContractError(
    message,
    ErrorCode.UNKNOWN_ERROR,
    'Transaction failed.',
    'Please try again or contact support if the issue persists.',
    error
  )
}

/**
 * Format error for toast notification
 * Returns: { title, description }
 */
export function formatErrorForToast(error: unknown): {
  title: string
  description: string
} {
  const contractError = parseContractError(error)

  return {
    title: contractError.userMessage,
    description: contractError.action || 'Please try again.',
  }
}

/**
 * Check if error is a user rejection (don't show error toast for these)
 */
export function isUserRejection(error: unknown): boolean {
  const contractError = parseContractError(error)
  return contractError.code === ErrorCode.USER_REJECTED
}

/**
 * Log error to console with context
 * In production, this would send to error tracking service (Sentry, etc.)
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const contractError = parseContractError(error)

  console.error('Contract Error:', {
    code: contractError.code,
    message: contractError.message,
    userMessage: contractError.userMessage,
    action: contractError.action,
    context,
    originalError: contractError.originalError,
  })

  // TODO: Send to error tracking service in production
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: { ...context, contractError } })
  // }
}
