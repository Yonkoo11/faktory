import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import React from 'react'

const boxVariants = cva('', {
  variants: {
    padding: {
      none: 'p-0',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    background: {
      none: '',
      default: 'bg-background',
      card: 'bg-card',
      muted: 'bg-muted',
      primary: 'bg-primary',
      'primary-subtle': 'bg-primary/10',
    },
    border: {
      none: '',
      default: 'border border-border',
      muted: 'border border-muted',
    },
    rounded: {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },
  defaultVariants: {
    padding: 'none',
    background: 'none',
    border: 'none',
    rounded: 'none',
  },
})

export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boxVariants> {
  as?: 'div' | 'section' | 'article' | 'aside' | 'main'
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, padding, background, border, rounded, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(boxVariants({ padding, background, border, rounded }), className)}
        {...props}
      />
    )
  }
)

Box.displayName = 'Box'
