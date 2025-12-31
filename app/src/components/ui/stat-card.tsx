import React from 'react'
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  variant?: 'default' | 'primary' | 'success' | 'warning'
  isLoading?: boolean
  className?: string
}

const variantStyles = {
  default: {
    card: 'bg-card border-border',
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
  },
  primary: {
    card: 'bg-card border-primary/20',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
  success: {
    card: 'bg-card border-success/20',
    icon: 'bg-success/10 text-success',
    value: 'text-success',
  },
  warning: {
    card: 'bg-card border-warning/20',
    icon: 'bg-warning/10 text-warning',
    value: 'text-warning',
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  isLoading = false,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]

  if (isLoading) {
    return (
      <div className={cn('rounded-lg border p-6', styles.card, className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            {subtitle && <Skeleton className="h-3 w-40" />}
          </div>
          {Icon && <Skeleton className="h-12 w-12 rounded-full" />}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-6 transition-shadow hover:shadow-md',
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <p className={cn('text-3xl font-bold', styles.value)}>{value}</p>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium',
                  trend.direction === 'up' ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.direction === 'up' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'rounded-full p-3 transition-colors',
              styles.icon
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}
