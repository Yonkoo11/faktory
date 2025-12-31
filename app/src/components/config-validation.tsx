'use client'

import { useEffect, useState } from 'react'
import { useChainId } from 'wagmi'
import { validateContractAddresses } from '@/lib/contracts/addresses'
import { AlertTriangle, X } from 'lucide-react'

export function ConfigValidation() {
  const chainId = useChainId()
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const { errors } = validateContractAddresses(chainId)
    setValidationErrors(errors)
  }, [chainId])

  if (validationErrors.length === 0 || dismissed) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-4 shadow-lg">
      <div className="container mx-auto flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">Configuration Error</h3>
            <p className="text-sm mb-2">
              Invalid contract addresses detected. The application may not function correctly.
            </p>
            <ul className="text-sm space-y-1">
              {validationErrors.map((error, i) => (
                <li key={i} className="opacity-90">
                  • {error}
                </li>
              ))}
            </ul>
            <p className="text-xs mt-2 opacity-75">
              Check your <code className="bg-destructive-foreground/10 px-1 rounded">.env.local</code> file
              or environment variables.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-destructive-foreground/10 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
