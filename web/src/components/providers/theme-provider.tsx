'use client'

import { useEffect } from 'react'
import { useThemeStore, type Theme } from '@/src/store/theme-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    const saved = localStorage.getItem('whisper-theme') as Theme | null
    if (saved) {
      setTheme(saved)
    }
  }, [setTheme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('whisper-theme', theme)
  }, [theme])

  return <>{children}</>
}
