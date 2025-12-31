import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import React from 'react'

const metricDisplayVariants = cva('', {
  variants: {
    size: {
      sm: 'space-y-1',
      md: 'space-y-2',
      lg: 'space-y-3',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    size: 'md',
    align: 'center',
  },
})

const labelVariants = cva('font-medium', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    uppercase: {
      true: 'uppercase tracking-wider',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    uppercase: true,
  },
})

const valueVariants = cva('font-bold', {
  variants: {
    size: {
      sm: 'text-2xl md:text-3xl',
      md: 'text-3xl md:text-4xl',
      lg: 'text-4xl md:text-5xl',
      xl: 'text-5xl md:text-6xl',
    },
    variant: {
      default: 'text-foreground',
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      muted: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  },
})

export interface MetricDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricDisplayVariants> {
  label: string
  value: string | number
  description?: string
  labelUppercase?: boolean
  valueSize?: VariantProps<typeof valueVariants>['size']
  valueVariant?: VariantProps<typeof valueVariants>['variant']
}

export const MetricDisplay = React.forwardRef<HTMLDivElement, MetricDisplayProps>(
  ({
    className,
    label,
    value,
    description,
    size,
    align,
    labelUppercase = true,
    valueSize,
    valueVariant,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(metricDisplayVariants({ size, align }), className)}
        {...props}
      >
        <div className={cn(labelVariants({ size, uppercase: labelUppercase }), 'text-muted-foreground')}>
          {label}
        </div>
        <div className={cn(valueVariants({ size: valueSize || size, variant: valueVariant }))}>
          {value}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">
            {description}
          </div>
        )}
      </div>
    )
  }
)

MetricDisplay.displayName = 'MetricDisplay'
