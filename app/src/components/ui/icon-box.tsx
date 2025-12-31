import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconBoxProps {
  icon: LucideIcon
  size?: 'sm' | 'default' | 'md' | 'lg'
  variant?: 'primary' | 'success' | 'warning' | 'muted' | 'destructive'
  className?: string
}

const variantStyles = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
}

const sizeStyles = {
  sm: {
    box: 'p-2',
    icon: 'h-4 w-4',
  },
  default: {
    box: 'p-3',
    icon: 'h-5 w-5',
  },
  md: {
    box: 'p-2.5',
    icon: 'h-5 w-5',
  },
  lg: {
    box: 'p-4',
    icon: 'h-6 w-6',
  },
}

export function IconBox({
  icon: Icon,
  size = 'default',
  variant = 'muted',
  className,
}: IconBoxProps) {
  const variantStyle = variantStyles[variant]
  const { box, icon } = sizeStyles[size]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        variantStyle,
        box,
        className
      )}
    >
      <Icon className={icon} />
    </div>
  )
}
