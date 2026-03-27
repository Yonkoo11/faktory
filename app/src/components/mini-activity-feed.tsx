'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: number
  time: string
  message: string
  type: 'info' | 'success' | 'yield'
}

const ACTIVITY_MESSAGES = [
  { message: 'scanning aave v3 markets...', type: 'info' as const },
  { message: 'USDC supply APY: 4.25%', type: 'success' as const },
  { message: 'monitoring vault positions', type: 'info' as const },
  { message: 'yield +$0.003 accrued', type: 'yield' as const },
  { message: 'pyth oracle: connected', type: 'success' as const },
  { message: 'rebalance check: optimal', type: 'info' as const },
  { message: 'CRO/USD $0.082 ↑0.5%', type: 'success' as const },
  { message: 'strategy scoring complete', type: 'success' as const },
  { message: 'gas: 5000 gwei (low)', type: 'info' as const },
  { message: 'yield +$0.002 accrued', type: 'yield' as const },
  { message: 'USDT borrow rate: 5.1%', type: 'info' as const },
  { message: 'health factor: 2.4 (safe)', type: 'success' as const },
  { message: 'next rebalance: 2h 14m', type: 'info' as const },
  { message: 'TVL delta: +$12.50', type: 'yield' as const },
]

export function MiniActivityFeed({ className }: { className?: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [messageIndex, setMessageIndex] = useState(0)

  // Generate initial activities (newest first)
  useEffect(() => {
    const now = Date.now()
    const initial: ActivityItem[] = []

    for (let i = 0; i < 3; i++) {
      const msg = ACTIVITY_MESSAGES[2 - i]
      const timestamp = now - i * 4000
      initial.push({
        id: timestamp,
        time: i === 0 ? 'now' : `${i * 4}s ago`,
        message: msg.message,
        type: msg.type,
      })
    }

    setActivities(initial)
    setMessageIndex(3)
  }, [])

  // Add new activity periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const msg = ACTIVITY_MESSAGES[messageIndex % ACTIVITY_MESSAGES.length]

      setActivities(prev => {
        const newActivity: ActivityItem = {
          id: Date.now(),
          time: 'now',
          message: msg.message,
          type: msg.type,
        }

        // Keep only last 3
        return [newActivity, ...prev.slice(0, 2)]
      })

      setMessageIndex(prev => prev + 1)
    }, 2500 + Math.random() * 1500)

    return () => clearInterval(interval)
  }, [messageIndex])

  // Update times based on actual timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev =>
        prev.map((a) => ({
          ...a,
          time: formatTimeAgo(new Date(a.id))
        }))
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] status-pulse" />
        <span className="text-[10px] text-[#666666] uppercase tracking-wider">Agent Activity</span>
      </div>
      <div className="space-y-0">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              'flex items-center gap-3 py-2 text-[11px]',
              index === 0 && 'animate-fade-in'
            )}
          >
            <span className="text-[#444444]">&gt;</span>
            <span className="text-[#666666] w-14 tabular-nums shrink-0">{activity.time}</span>
            <span className={cn(
              activity.type === 'success' && 'text-[#10b981]',
              activity.type === 'yield' && 'text-[#34d399]',
              activity.type === 'info' && 'text-[#e5e5e5]'
            )}>
              {activity.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 2) return 'now'
  if (seconds < 60) return `${seconds}s ago`
  return `${Math.floor(seconds / 60)}m ago`
}
