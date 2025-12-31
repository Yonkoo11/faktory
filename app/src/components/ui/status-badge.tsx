import React from 'react'
import { cn } from '@/lib/utils'

export type InvoiceStatus =
  | 'active'
  | 'in-yield'
  | 'paid'
  | 'withdrawn'
  | 'at-risk'
  | 'defaulted'
  | 'pending'

interface StatusBadgeProps {
  status: InvoiceStatus | string
  size?: 'sm' | 'default' | 'lg'
  showDot?: boolean
  className?: string
}

// Normalize status to lowercase-hyphenated format
function normalizeStatus(status: string): InvoiceStatus {
  const normalized = status.toLowerCase().replace(/\s+/g, '-')
  if (normalized in statusConfig) {
    return normalized as InvoiceStatus
  }
  // Default fallback
  return 'pending'
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-primary/10 text-primary border-primary/20',
    dotColor: 'bg-primary',
  },
  'in-yield': {
    label: 'In Yield',
    color: 'bg-success/10 text-success border-success/20',
    dotColor: 'bg-success',
  },
  paid: {
    label: 'Paid',
    color: 'bg-success/10 text-success border-success/20',
    dotColor: 'bg-success',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'bg-muted/50 text-muted-foreground border-muted',
    dotColor: 'bg-muted-foreground',
  },
  'at-risk': {
    label: 'At Risk',
    color: 'bg-warning/10 text-warning border-warning/20',
    dotColor: 'bg-warning',
  },
  defaulted: {
    label: 'Defaulted',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    dotColor: 'bg-destructive',
  },
  pending: {
    label: 'Pending',
    color: 'bg-muted/50 text-muted-foreground border-muted',
    dotColor: 'bg-muted-foreground',
  },
}

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export function StatusBadge({
  status,
  size = 'default',
  showDot = false,
  className,
}: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status)
  const config = statusConfig[normalizedStatus]
  const sizeStyle = sizeStyles[size]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.color,
        sizeStyle,
        className
      )}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          {/* Animated pulse for active statuses */}
          {(normalizedStatus === 'active' || normalizedStatus === 'in-yield') && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                config.dotColor
              )}
            />
          )}
          <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dotColor)} />
        </span>
      )}
      {config.label}
    </span>
  )
}
