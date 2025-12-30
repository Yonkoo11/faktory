"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient } from 'wagmi'

interface PendingTransaction {
  hash: string
  type: 'mint' | 'deposit' | 'withdraw' | 'approve'
  timestamp: number
  description: string
}

const STORAGE_KEY = 'faktory_pending_txs'
const TX_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function usePendingTransactions() {
  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([])
  const publicClient = usePublicClient()

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const txs: PendingTransaction[] = JSON.parse(stored)
        // Filter out old transactions
        const recent = txs.filter(tx => Date.now() - tx.timestamp < TX_TIMEOUT_MS)
        setPendingTxs(recent)
        if (recent.length !== txs.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
        }
      }
    } catch (e) {
      console.error('Failed to load pending transactions:', e)
    }
  }, [])

  // Check status of pending transactions
  useEffect(() => {
    if (!publicClient || pendingTxs.length === 0) return

    const checkTxs = async () => {
      const updatedTxs: PendingTransaction[] = []

      for (const tx of pendingTxs) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash as `0x${string}` })
          if (!receipt) {
            // Still pending
            updatedTxs.push(tx)
          }
          // If receipt exists, transaction is confirmed - remove from pending
        } catch {
          // Transaction not found or error - keep in pending if recent
          if (Date.now() - tx.timestamp < TX_TIMEOUT_MS) {
            updatedTxs.push(tx)
          }
        }
      }

      if (updatedTxs.length !== pendingTxs.length) {
        setPendingTxs(updatedTxs)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTxs))
      }
    }

    // Check immediately and then every 10 seconds
    checkTxs()
    const interval = setInterval(checkTxs, 10000)
    return () => clearInterval(interval)
  }, [publicClient, pendingTxs])

  const addPendingTx = useCallback((tx: Omit<PendingTransaction, 'timestamp'>) => {
    const newTx: PendingTransaction = { ...tx, timestamp: Date.now() }
    setPendingTxs(prev => {
      const updated = [...prev, newTx]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removePendingTx = useCallback((hash: string) => {
    setPendingTxs(prev => {
      const updated = prev.filter(tx => tx.hash !== hash)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setPendingTxs([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    pendingTxs,
    addPendingTx,
    removePendingTx,
    clearAll,
    hasPending: pendingTxs.length > 0,
  }
}
