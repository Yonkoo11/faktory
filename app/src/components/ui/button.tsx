import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[12px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-[#10b981] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]",
  {
    variants: {
      variant: {
        default:
          'bg-[#10b981] text-black border border-[#10b981] hover:bg-[#059669] hover:border-[#059669] font-semibold',
        secondary:
          'bg-transparent text-[#e5e5e5] border border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]',
        outline:
          'bg-transparent text-[#e5e5e5] border border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]',
        ghost:
          'bg-transparent text-[#666666] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]',
        destructive:
          'bg-[#ef4444] text-white border border-[#ef4444] hover:bg-[#dc2626] hover:border-[#dc2626]',
        link: 'text-[#10b981] underline-offset-4 hover:underline bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2 rounded',
        sm: 'h-8 px-3 rounded text-[11px]',
        lg: 'h-11 px-6 rounded',
        icon: 'size-10 rounded',
        'icon-sm': 'size-8 rounded',
        'icon-lg': 'size-11 rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
