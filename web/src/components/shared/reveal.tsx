'use client'

import { motion } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  rootMargin?: string
  y?: number
  duration?: number
}

export function Reveal({
  children,
  className = '',
  delay = 0,
  rootMargin = '-80px 0px',
  y = 30,
  duration = 0.6,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setRevealed(true), delay)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [delay, rootMargin])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
