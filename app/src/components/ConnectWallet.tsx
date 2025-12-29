'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { CHAIN_IDS, areContractsDeployed } from '@/lib/contracts/addresses';

// Supported chains for the app (in order of preference)
const SUPPORTED_CHAINS = [CHAIN_IDS.MANTLE_TESTNET, CHAIN_IDS.LOCAL, CHAIN_IDS.MANTLE_MAINNET];

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongChain = isConnected && !SUPPORTED_CHAINS.includes(chainId as typeof SUPPORTED_CHAINS[number]);
  const contractsDeployed = areContractsDeployed(chainId);

  // Handle switching to the correct chain
  const handleSwitchChain = () => {
    // Prefer testnet for demo
    switchChain({ chainId: CHAIN_IDS.MANTLE_TESTNET });
  };

  if (isConnected && address) {
    // Show chain warning if on unsupported chain
    if (isWrongChain) {
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-yellow-400">Wrong Network</span>
          <button
            onClick={handleSwitchChain}
            disabled={isSwitching}
            className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSwitching ? 'Switching...' : 'Switch to Mantle'}
          </button>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">
          {!contractsDeployed && <span className="text-yellow-400 mr-2" title="Contracts not deployed">[!]</span>}
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
