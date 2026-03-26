'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { SUPPORTED_CHAINS } from '@/lib/wagmi';
import { areContractsDeployed, getChainMeta } from '@/lib/contracts/addresses';

export function NetworkWarning() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  const isSupported = (SUPPORTED_CHAINS as readonly number[]).includes(chainId);
  const contractsDeployed = areContractsDeployed(chainId);
  const meta = getChainMeta(chainId);
  const chainName = meta?.name || `Chain ${chainId}`;

  // Show contract deployment warning if on supported network but contracts not deployed
  if (isSupported && !contractsDeployed) {
    return (
      <div className="bg-red-900/50 border-b border-red-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <span>⚠️</span>
            <span className="text-sm">
              Contracts not deployed on {chainName}. Please deploy contracts or switch networks.
            </span>
          </div>
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
            Unsupported network. Please switch to a supported chain.
          </span>
        </div>
      </div>
    </div>
  );
}

export function CurrentNetwork() {
  const chainId = useChainId();
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  const meta = getChainMeta(chainId);
  const name = meta?.name || (chainId === 31337 ? 'Anvil Local' : `Chain ${chainId}`);

  return (
    <span className="px-2 py-1 text-xs rounded border bg-gray-800 text-gray-400 border-gray-700">
      {name}
    </span>
  );
}
