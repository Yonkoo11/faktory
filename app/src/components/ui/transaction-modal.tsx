'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TransactionState = 'idle' | 'approving' | 'confirming' | 'success' | 'error'

export interface TransactionStep {
  label: string
  description?: string
}

export interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  state: TransactionState
  steps: TransactionStep[]
  currentStep: number
  hash?: string
  error?: string
  onRetry?: () => void
  onClose?: () => void
  successTitle?: string
  successMessage?: string
  explorerUrl?: string
}

export function TransactionModal({
  open,
  onOpenChange,
  state,
  steps,
  currentStep,
  hash,
  error,
  onRetry,
  onClose,
  successTitle = 'Transaction Successful',
  successMessage = 'Your transaction was completed successfully',
  explorerUrl = 'https://explorer.sepolia.mantle.xyz',
}: TransactionModalProps) {
  const handleClose = () => {
    onClose?.()
    onOpenChange(false)
  }

  // Success state
  if (state === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 animate-scale-in">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">{successTitle}</h2>
            <p className="mb-6 text-muted-foreground">{successMessage}</p>
            {hash && (
              <a
                href={`${explorerUrl}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="mt-4">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">Transaction Failed</h2>
            <p className="mb-6 text-muted-foreground">
              {error || 'Something went wrong. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {onRetry && (
                <Button onClick={onRetry}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Processing state (approving or confirming)
  const isProcessing = state === 'approving' || state === 'confirming'

  if (isProcessing) {
    const isConfirming = state === 'confirming'
    const currentStepData = steps[currentStep - 1]

    return (
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h2 className="mb-3 text-2xl font-bold">Processing</h2>
            <p className="mb-2 text-muted-foreground">
              {currentStepData?.label || 'Processing transaction...'}
            </p>

            {/* Time estimate */}
            <p className="mb-6 text-sm text-muted-foreground">
              {isConfirming ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  ~15-30 seconds remaining
                </span>
              ) : (
                'Waiting for wallet confirmation...'
              )}
            </p>

            {/* Progress steps */}
            <div className="mb-6 flex items-center justify-center gap-4">
              {steps.map((step, index) => {
                const stepNumber = index + 1
                const isComplete = stepNumber < currentStep
                const isCurrent = stepNumber === currentStep
                const isPending = stepNumber > currentStep

                return (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <div
                        className={cn(
                          'h-0.5 w-8',
                          isComplete ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                          isComplete && 'bg-primary text-primary-foreground',
                          isCurrent && 'bg-primary text-primary-foreground',
                          isPending && 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          stepNumber
                        )}
                      </div>
                      <span className="text-sm">{step.label}</span>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>

            {/* Explorer link */}
            {hash && (
              <a
                href={`${explorerUrl}/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              {isConfirming
                ? 'Transaction submitted. Waiting for block confirmation...'
                : 'Please confirm the transaction in your wallet'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Default idle state (if needed)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction</DialogTitle>
        </DialogHeader>
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Ready to process transaction</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
