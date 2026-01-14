import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import React from 'react'

const headingVariants = cva('font-semibold tracking-tight', {
  variants: {
    level: {
      h1: 'text-4xl md:text-5xl font-bold',
      h2: 'text-3xl md:text-4xl',
      h3: 'text-2xl md:text-3xl',
      h4: 'text-xl md:text-2xl',
      h5: 'text-lg md:text-xl',
      h6: 'text-base md:text-lg',
    },
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      gradient: 'bg-gradient-to-r from-primary to-primary-muted bg-clip-text text-transparent',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    level: 'h2',
    variant: 'default',
    align: 'left',
  },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level, variant, align, as, ...props }, ref) => {
    const Component = as || level || 'h2'

    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ level: level || (as as typeof level), variant, align }), className)}
        {...props}
      />
    )
  }
)

Heading.displayName = 'Heading'
