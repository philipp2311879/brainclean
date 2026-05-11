import { useEffect, useRef, useState } from 'react'

interface CountingNumberProps {
  target: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

export function CountingNumber({ target, duration = 1200, className, prefix = '', suffix = '' }: CountingNumberProps) {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    startRef.current = start

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return (
    <span className={className}>
      {prefix}{current}{suffix}
    </span>
  )
}
