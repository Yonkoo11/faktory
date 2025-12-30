"use client"

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { SUPPORTED_CHAINS } from '@/lib/wagmi'
import { mantleSepoliaTestnet } from 'wagmi/chains'

export function NetworkCheck({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  const isWrongNetwork = isConnected && !(SUPPORTED_CHAINS as readonly number[]).includes(chainId)

  if (!isWrongNetwork) {
    return <>{children}</>
  }

  return (
    <>
      {/* Wrong Network Banner */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-warning/10 border-b border-warning/30 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-warning">
              You&apos;re connected to an unsupported network. Please switch to Mantle.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-warning/30 text-warning hover:bg-warning/10 flex-shrink-0"
            onClick={() => switchChain({ chainId: mantleSepoliaTestnet.id })}
            disabled={isPending}
          >
            {isPending ? 'Switching...' : 'Switch to Mantle'}
          </Button>
        </div>
      </div>
      {/* Add padding to account for banner */}
      <div className="pt-12">
        {children}
      </div>
    </>
  )
}
