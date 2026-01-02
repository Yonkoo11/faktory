import { useEffect, useRef } from 'react'

interface UseParallaxOptions {
  speed?: number
  direction?: 'vertical' | 'horizontal'
}

/**
 * Parallax scroll effect hook
 * Elements move at different speeds than scroll for depth effect
 */
export function useParallax({
  speed = 0.5,
  direction = 'vertical',
}: UseParallaxOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleScroll = () => {
      const scrolled = window.scrollY
      const offset = scrolled * speed

      if (direction === 'vertical') {
        element.style.transform = `translateY(${offset}px)`
      } else {
        element.style.transform = `translateX(${offset}px)`
      }
    }

    // Throttle scroll events for performance
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [speed, direction])

  return ref
}
