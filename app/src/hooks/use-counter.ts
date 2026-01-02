import { useEffect, useState } from 'react'

interface UseCounterOptions {
  start?: number
  end: number
  duration?: number
  decimals?: number
  delay?: number
}

/**
 * Smooth number counter animation hook
 * Used for animating stats from 0 to target value
 */
export function useCounter({
  start = 0,
  end,
  duration = 2000,
  decimals = 0,
  delay = 0,
}: UseCounterOptions) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrame: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * easeOut

      setCount(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
        setCount(end)
      }
    }

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [start, end, duration, delay])

  // Format the number based on decimals
  return decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toString()
}
