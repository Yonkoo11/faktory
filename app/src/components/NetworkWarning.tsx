'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { SUPPORTED_CHAINS, anvil } from '@/lib/wagmi';
import { mantleSepoliaTestnet } from 'wagmi/chains';
import { areContractsDeployed } from '@/lib/contracts/addresses';

export function NetworkWarning() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  const isSupported = (SUPPORTED_CHAINS as readonly number[]).includes(chainId);
  const contractsDeployed = areContractsDeployed(chainId);

  // Show contract deployment warning if on supported network but contracts not deployed
  if (isSupported && !contractsDeployed) {
    return (
      <div className="bg-red-900/50 border-b border-red-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <span>⚠️</span>
            <span className="text-sm">
              Contracts not deployed on this network. Please deploy contracts or switch to Local (Anvil) for testing.
            </span>
          </div>
          <button
            onClick={() => switchChain({ chainId: anvil.id })}
            disabled={isPending}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-xs font-medium transition-colors"
          >
            {isPending ? 'Switching...' : 'Switch to Local'}
          </button>
        </div>
      </div>
    );
  }

  if (isSupported) return null;

  return (
    <div className="bg-yellow-900/50 border-b border-yellow-700">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-yellow-400">
          <span>⚠️</span>
          <span className="text-sm">
            Please switch to a supported network (Anvil Local, Mantle Sepolia, or Mantle)
          </span>
        </div>
        <div className="flex gap-2" role="group" aria-label="Network selection">
          <button
            onClick={() => switchChain({ chainId: anvil.id })}
            disabled={isPending}
            aria-label="Switch to Anvil local development network"
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-xs font-medium transition-colors"
          >
            {isPending ? 'Switching...' : 'Anvil (Local)'}
          </button>
          <button
            onClick={() => switchChain({ chainId: mantleSepoliaTestnet.id })}
            disabled={isPending}
            aria-label="Switch to Mantle Sepolia testnet"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-xs font-medium transition-colors"
          >
            {isPending ? 'Switching...' : 'Mantle Sepolia'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CurrentNetwork() {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  const networkNames: Record<number, string> = {
    31337: 'Anvil Local',
    5003: 'Mantle Sepolia',
    5000: 'Mantle',
  };

  const networkColors: Record<number, string> = {
    31337: 'bg-purple-900/50 text-purple-400 border-purple-800',
    5003: 'bg-blue-900/50 text-blue-400 border-blue-800',
    5000: 'bg-green-900/50 text-green-400 border-green-800',
  };

  const name = networkNames[chainId] || `Chain ${chainId}`;
  const color = networkColors[chainId] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <span className={`px-2 py-1 text-xs rounded border ${color}`}>
      {name}
    </span>
  );
}
