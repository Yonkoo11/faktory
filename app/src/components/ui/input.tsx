import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full rounded border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#e5e5e5] placeholder:text-[#444444] transition-colors outline-none',
        'focus:border-[#10b981]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-[12px] file:font-medium file:text-[#e5e5e5]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
