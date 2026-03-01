'use client'

import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { cn } from '@/lib/utils'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
  as?: 'div' | 'section'
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  as: Tag = 'div',
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15, triggerOnce: true })

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement> & React.RefObject<HTMLElement>}
      className={cn(
        'scroll-reveal',
        isVisible && 'is-visible',
        delay > 0 && `scroll-reveal-delay-${delay}`,
        direction === 'left' && 'scroll-reveal-left',
        direction === 'right' && 'scroll-reveal-right',
        className
      )}
    >
      {children}
    </Tag>
  )
}
