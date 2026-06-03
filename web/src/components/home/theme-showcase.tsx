'use client'

import { motion } from 'framer-motion'
import { useThemeStore, type Theme, themeNames } from '@/src/store/theme-store'
import { Palette, Check } from 'lucide-react'
import { Reveal } from '@/src/components/shared/reveal'

const themeColors: Record<Theme, { primary: string; secondary: string; accent: string; bg: string }> = {
  light: { primary: '#570df8', secondary: '#f000b8', accent: '#37cdbe', bg: '#ffffff' },
  dark: { primary: '#661ae6', secondary: '#d926a9', accent: '#37cdbe', bg: '#1d232a' },
  coffee: { primary: '#db924b', secondary: '#263e3c', accent: '#a78bfa', bg: '#20161f' },
  night: { primary: '#38bdf8', secondary: '#818cf8', accent: '#f472b6', bg: '#0f172a' },
  forest: { primary: '#00b37e', secondary: '#00a96c', accent: '#f59e0b', bg: '#171212' },
  dracula: { primary: '#ff79c6', secondary: '#bd93f9', accent: '#50fa7b', bg: '#282a36' },
}

export function ThemeShowcase() {
  const { theme: currentTheme, setTheme } = useThemeStore()
  const themes: Theme[] = ['light', 'dark', 'coffee', 'night', 'forest', 'dracula']

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-12" delay={50}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="w-6 h-6 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold">Choose Your Style</h2>
          </div>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">Express yourself with beautiful themes</p>
        </Reveal>

        <Reveal delay={150}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {themes.map((theme, i) => {
              const colors = themeColors[theme]
              const isActive = currentTheme === theme
              return (
                <motion.button
                  key={theme}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(theme)}
                  className={`card bg-base-200 border-2 transition-all duration-300 cursor-pointer overflow-hidden ${isActive ? 'border-primary shadow-lg shadow-primary/20' : 'border-base-300 hover:border-primary/50'}`}
                >
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }} />
                  <div className="card-body items-center p-4 text-center">
                    <div className="flex gap-1.5 mb-3">
                      <div className="w-5 h-5 rounded-full border border-base-content/10 shadow-sm" style={{ backgroundColor: colors.primary }} />
                      <div className="w-5 h-5 rounded-full border border-base-content/10 shadow-sm" style={{ backgroundColor: colors.secondary }} />
                      <div className="w-5 h-5 rounded-full border border-base-content/10 shadow-sm" style={{ backgroundColor: colors.bg }} />
                    </div>
                    <h3 className="font-semibold text-sm capitalize">{themeNames[theme]}</h3>
                    {isActive && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1 badge badge-primary badge-sm mt-1">
                        <Check className="w-2.5 h-2.5" />Active
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
