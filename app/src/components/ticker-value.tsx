'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TickerValueProps {
  value: string
  label: string
  suffix?: string
  className?: string
}

export function TickerValue({ value, label, suffix = '%', className }: TickerValueProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [trend, setTrend] = useState<'up' | 'down' | null>(null)
  const [flash, setFlash] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (value !== prevValue.current) {
      const current = parseFloat(value) || 0
      const previous = parseFloat(prevValue.current) || 0

      // Determine trend
      if (current > previous) {
        setTrend('up')
      } else if (current < previous) {
        setTrend('down')
      }

      // Flash animation
      setFlash(true)
      setTimeout(() => setFlash(false), 600)

      // Clear trend after a bit
      setTimeout(() => setTrend(null), 3000)

      setDisplayValue(value)
      prevValue.current = value
    }
  }, [value])

  return (
    <div className={cn('ticker-item', className)}>
      <span className="ticker-label">{label}</span>
      <span
        className={cn(
          'ticker-value tabular-nums transition-colors duration-300',
          flash && trend === 'up' && 'text-[#34d399]',
          flash && trend === 'down' && 'text-[#f87171]'
        )}
      >
        {displayValue}{suffix}
        {trend && (
          <span
            className={cn(
              'ml-1 text-[10px] animate-fade-in',
              trend === 'up' && 'text-[#34d399]',
              trend === 'down' && 'text-[#f87171]'
            )}
          >
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </span>
    </div>
  )
}
