import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const STRATEGY_INFO = [
  { name: 'Hold', apy: '0%', description: 'No yield, waiting for conditions' },
  { name: 'Conservative', apy: '3-4%', description: 'Stable, low-risk yield' },
  { name: 'Aggressive', apy: '6-8%', description: 'Higher yield, more risk' },
];

interface InvoiceDepositFormProps {
  tokenId: string;
  isApproving: boolean;
  isApproveConfirming: boolean;
  isDepositing: boolean;
  isDepositConfirming: boolean;
  onDeposit: (principal: string, strategy: number) => void;
  onCancel: () => void;
}

export function InvoiceDepositForm({
  tokenId,
  isApproving,
  isApproveConfirming,
  isDepositing,
  isDepositConfirming,
  onDeposit,
  onCancel,
}: InvoiceDepositFormProps) {
  const [principal, setPrincipal] = useState('10000');
  const [selectedStrategy, setSelectedStrategy] = useState(1);

  const isProcessing = isApproving || isApproveConfirming || isDepositing || isDepositConfirming;

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onDeposit(principal, selectedStrategy);
      }}
      aria-label="Deposit to yield vault"
    >
      <div>
        <label htmlFor={`principal-${tokenId}`} className="block text-xs text-gray-400 mb-1">
          Principal Amount (USD)
        </label>
        <input
          id={`principal-${tokenId}`}
          type="number"
          value={principal}
          onChange={(e) => setPrincipal(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="10000"
          min="100"
        />
      </div>

      <fieldset>
        <legend className="block text-xs text-gray-400 mb-1">Yield Strategy</legend>
        <div className="grid grid-cols-3 gap-2">
          {STRATEGY_INFO.map((strategy, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedStrategy(idx)}
              className={`p-2 rounded border text-xs transition-colors ${
                selectedStrategy === idx
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-medium">{strategy.name}</div>
              <div className="text-[10px] opacity-75">{strategy.apy}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-xs text-gray-400">
            {isApproving || isApproveConfirming ? 'Approving...' : 'Depositing...'}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !principal}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {isApproving || isApproveConfirming
          ? 'Step 1: Approving NFT...'
          : isDepositing || isDepositConfirming
            ? 'Step 2: Depositing to Vault...'
            : `Deposit $${Number(principal).toLocaleString()} → ${STRATEGY_INFO[selectedStrategy].name}`}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-gray-400 hover:text-gray-300 py-1 text-xs"
      >
        Cancel
      </button>
    </form>
  );
}
