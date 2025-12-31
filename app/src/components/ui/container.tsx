import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import React from 'react'

const containerVariants = cva('mx-auto w-full px-4 sm:px-6 lg:px-8', {
  variants: {
    size: {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    },
    centered: {
      true: 'text-center',
      false: '',
    },
  },
  defaultVariants: {
    size: 'lg',
    centered: false,
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: 'div' | 'section' | 'article' | 'main'
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, centered, as: Component = 'div', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, centered }), className)}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'
