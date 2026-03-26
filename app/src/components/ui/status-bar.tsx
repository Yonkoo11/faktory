'use client'

import * as React from 'react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { usePublicClient } from 'wagmi'

interface StatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'online' | 'offline' | 'syncing'
  network?: string
}

function StatusBar({
  className,
  status = 'online',
  network = '',
  ...props
}: StatusBarProps) {
  const [blockNumber, setBlockNumber] = useState<number | null>(null)
  const [prevBlockNumber, setPrevBlockNumber] = useState<number | null>(null)
  const [blockUpdated, setBlockUpdated] = useState(false)
  const [latency, setLatency] = useState<number | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('syncing')
  const publicClient = usePublicClient()

  // Fetch block number and measure latency
  const fetchBlock = useCallback(async () => {
    if (!publicClient) {
      setConnectionStatus('syncing')
      return
    }

    const startTime = performance.now()

    try {
      const block = await publicClient.getBlockNumber()
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)

      setLatency(responseTime)
      setLastSyncTime(new Date())
      setSecondsAgo(0)
      setConnectionStatus('online')

      const newBlock = Number(block)

      // Check if block changed
      if (blockNumber !== null && newBlock !== blockNumber) {
        setPrevBlockNumber(blockNumber)
        setBlockUpdated(true)
        // Reset the updated flag after animation
        setTimeout(() => setBlockUpdated(false), 600)
      }

      setBlockNumber(newBlock)
    } catch (error) {
      console.error('Failed to fetch block:', error)
      setConnectionStatus('offline')
    }
  }, [publicClient, blockNumber])

  // Poll for new blocks
  useEffect(() => {
    fetchBlock()
    const interval = setInterval(fetchBlock, 2000)
    return () => clearInterval(interval)
  }, [fetchBlock])

  // Update "seconds ago" counter
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSyncTime) {
        const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000)
        setSecondsAgo(seconds)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [lastSyncTime])

  // Determine latency status
  const getLatencyStatus = (ms: number | null): 'good' | 'medium' | 'slow' => {
    if (ms === null) return 'slow'
    if (ms < 200) return 'good'
    if (ms < 500) return 'medium'
    return 'slow'
  }

  const latencyStatus = getLatencyStatus(latency)

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 h-6 bg-[#111111] border-t border-[#1f1f1f]',
        'flex items-center justify-between px-4',
        'text-[11px] text-[#666666] font-mono z-50',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        {/* Agent Status */}
        <StatusBarItem>
          <StatusDot status={connectionStatus} />
          <span>agent: {connectionStatus}</span>
        </StatusBarItem>

        {/* Block Number with tick animation */}
        {blockNumber && (
          <StatusBarItem>
            <span className="text-[#444444]">block:</span>
            <span
              className={cn(
                'tabular-nums transition-colors duration-300',
                blockUpdated ? 'text-[#34d399]' : 'text-[#10b981]'
              )}
            >
              {blockNumber.toLocaleString()}
            </span>
            {blockUpdated && (
              <span className="text-[#34d399] animate-pulse">↑</span>
            )}
          </StatusBarItem>
        )}

        {/* Latency Indicator */}
        {latency !== null && (
          <StatusBarItem>
            <LatencyDot status={latencyStatus} />
            <span className={cn(
              'tabular-nums',
              latencyStatus === 'good' && 'text-[#10b981]',
              latencyStatus === 'medium' && 'text-[#f59e0b]',
              latencyStatus === 'slow' && 'text-[#ef4444]'
            )}>
              {latency}ms
            </span>
          </StatusBarItem>
        )}

        {/* Last Sync */}
        <StatusBarItem>
          <span className="text-[#444444]">synced:</span>
          <span className={cn(
            'tabular-nums',
            secondsAgo > 10 && 'text-[#f59e0b]',
            secondsAgo > 30 && 'text-[#ef4444]'
          )}>
            {secondsAgo}s ago
          </span>
        </StatusBarItem>
      </div>

      <div className="flex items-center gap-4">
        {/* Network */}
        <StatusBarItem>
          <span className="text-[#10b981]">{network}</span>
        </StatusBarItem>
      </div>
    </div>
  )
}

function StatusBarItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>{children}</div>
  )
}

function StatusDot({ status }: { status: 'online' | 'offline' | 'syncing' }) {
  return (
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'online' && 'bg-[#10b981] status-pulse',
        status === 'offline' && 'bg-[#ef4444]',
        status === 'syncing' && 'bg-[#f59e0b] animate-pulse'
      )}
    />
  )
}

function LatencyDot({ status }: { status: 'good' | 'medium' | 'slow' }) {
  return (
    <span
      className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'good' && 'bg-[#10b981]',
        status === 'medium' && 'bg-[#f59e0b]',
        status === 'slow' && 'bg-[#ef4444]'
      )}
    />
  )
}

export { StatusBar, StatusBarItem, StatusDot }
