'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther, keccak256, encodePacked, toHex } from 'viem';
import { getContractAddresses, areContractsDeployed } from '@/lib/wagmi';
import { InvoiceNFTABI } from '@/lib/abi';

const INITIAL_FORM_STATE = {
  clientName: '',
  amount: '',
  dueDate: '',
  description: '',
};

export function InvoiceForm() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const contractsDeployed = areContractsDeployed(chainId);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [showSuccess, setShowSuccess] = useState(false);

  const { writeContract, data: hash, isPending, error, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Auto-clear form after successful mint
  const handleSuccessfulMint = useCallback(() => {
    setShowSuccess(true);
    setFormData(INITIAL_FORM_STATE);
    // Hide success message after 5 seconds
    const timer = setTimeout(() => {
      setShowSuccess(false);
      resetWrite();
    }, 5000);
    return () => clearTimeout(timer);
  }, [resetWrite]);

  useEffect(() => {
    if (isSuccess) {
      handleSuccessfulMint();
    }
  }, [isSuccess, handleSuccessfulMint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contractsDeployed) {
      console.error('Contracts not deployed on this chain');
      return;
    }

    // Generate salt for privacy using cryptographically secure random bytes
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const salt = keccak256(toHex(randomBytes));

    // Create data commitment (hash of invoice data)
    const invoiceData = JSON.stringify({
      client: formData.clientName,
      amount: formData.amount,
      description: formData.description,
    });
    const dataCommitment = keccak256(
      encodePacked(['string', 'bytes32'], [invoiceData, salt])
    );

    // Create amount commitment
    const amountCommitment = keccak256(
      encodePacked(['uint256', 'bytes32'], [parseEther(formData.amount), salt])
    );

    // Due date as Unix timestamp
    const dueDate = BigInt(Math.floor(new Date(formData.dueDate).getTime() / 1000));

    writeContract({
      address: contracts.invoiceNFT,
      abi: InvoiceNFTABI,
      functionName: 'mint',
      args: [dataCommitment, amountCommitment, dueDate],
    });

    // Store salt locally (in production, would use secure storage)
    if (typeof window !== 'undefined') {
      const salts = JSON.parse(localStorage.getItem('invoiceSalts') || '{}');
      salts[dataCommitment] = {
        salt,
        data: invoiceData,
        createdAt: Date.now(),
      };
      localStorage.setItem('invoiceSalts', JSON.stringify(salts));
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-gray-400">Connect your wallet to tokenize invoices</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📄</span> Tokenize Invoice
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Tokenize invoice form">
        <div>
          <label htmlFor="clientName" className="block text-sm text-gray-400 mb-1">Client Name</label>
          <input
            id="clientName"
            type="text"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Acme Corporation"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
          <input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="10000"
            min="1"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm text-gray-400 mb-1">Due Date</label>
          <input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20 resize-none"
            placeholder="Web development services - Q4 2024"
          />
        </div>

        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <span>🔒</span> Privacy Protected
          </div>
          <p className="text-gray-400">
            Invoice data is stored as cryptographic commitments. Only you can reveal the details.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          aria-busy={isPending || isConfirming}
          aria-label={isPending ? 'Waiting for wallet confirmation' : isConfirming ? 'Minting invoice on blockchain' : 'Submit form to tokenize invoice'}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 rounded-lg font-medium transition-colors"
        >
          {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Tokenize Invoice'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400" role="alert">
            {error.message}
          </div>
        )}

        {showSuccess && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-sm text-green-400" role="status" aria-live="polite">
            Invoice tokenized successfully! View it in your portfolio.
          </div>
        )}
      </form>
    </div>
  );
}
