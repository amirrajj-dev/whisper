import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'coffee' | 'night' | 'forest' | 'dracula'

export const themeNames: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  coffee: 'Coffee',
  night: 'Night',
  forest: 'Forest',
  dracula: 'Dracula',
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  setTheme: (theme: Theme) => set({ theme }),
}))
