/**
 * Button Component - Faktory Protocol Design System v1.0
 *
 * Professional button variants following design system
 * NO gradients, NO scale animations, NO gimmicks
 *
 * @see /DESIGN_SYSTEM.md
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        // Primary: Main CTA button (blue background)
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',

        // Destructive: Delete, dangerous actions (red)
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',

        // Outline: Secondary actions (transparent with border)
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',

        // Secondary: Tertiary actions (gray background)
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',

        // Ghost: Minimal, inline actions (transparent, no border)
        ghost: 'hover:bg-accent hover:text-accent-foreground',

        // Link: Text-only button (looks like a link)
        link: 'text-primary underline-offset-4 hover:underline',

        // Success: Positive actions (green background)
        success: 'bg-success text-white hover:bg-success/90 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-md px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
