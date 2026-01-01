interface InvoiceWithdrawConfirmProps {
  tokenId: string;
  accruedYield: string;
  isWithdrawing: boolean;
  isWithdrawConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InvoiceWithdrawConfirm({
  tokenId,
  accruedYield,
  isWithdrawing,
  isWithdrawConfirming,
  onConfirm,
  onCancel,
}: InvoiceWithdrawConfirmProps) {
  return (
    <div
      className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
      role="dialog"
      aria-labelledby={`withdraw-title-${tokenId}`}
    >
      <div className="text-sm">
        <h4 id={`withdraw-title-${tokenId}`} className="font-medium text-yellow-400 mb-1">
          Confirm Withdrawal
        </h4>
        <p className="text-gray-400 text-xs">
          You will receive your principal plus ${accruedYield} in accrued yield.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-xs font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isWithdrawing || isWithdrawConfirming}
          aria-busy={isWithdrawing || isWithdrawConfirming}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 py-2 rounded text-xs font-medium transition-colors"
        >
          {isWithdrawing || isWithdrawConfirming ? 'Withdrawing...' : 'Confirm Withdraw'}
        </button>
      </div>
    </div>
  );
}
