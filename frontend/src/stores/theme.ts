import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThemePalette {
  id: string
  name: string
  label: string
  primary: string
  secondary: string
  accent: string
  bg: string
  isDefault?: boolean
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'default',
    name: 'Ocean & Orange',
    label: 'Default Theme',
    primary: '#004E72',      // Blue
    secondary: '#092634',    // Navy Blue
    accent: '#FF6E42',       // Orange
    bg: '#F9F9F9',           // White
    isDefault: true,
  },
  {
    id: 'sage-forest',
    name: 'Sage & Forest',
    label: 'Option 1: Soft Sage',
    primary: '#8BC53D',      // Apple Green
    secondary: '#012F13',    // Dark Forest Green
    accent: '#011207',       // Near-Black Green
    bg: '#E2F0CC',           // Soft Sage Mint
  },
  {
    id: 'pebble-yam',
    name: 'Yam & Cadet',
    label: 'Option 2: Pebble & Yam',
    primary: '#EA9216',      // Yam
    secondary: '#3A4750',    // Cadet Blue
    accent: '#313841',       // High Tide
    bg: '#EEEEEE',           // Pebble
  },
  {
    id: 'crimson-sand',
    name: 'Crimson & Pearl',
    label: 'Option 3: Crimson Depth',
    primary: '#710014',      // Crimson Depth
    secondary: '#161616',    // Obsidian Black
    accent: '#B38F6F',       // Warm Sand
    bg: '#F2F1ED',           // Soft Pearl
  },
  {
    id: 'almond-matcha',
    name: 'Almond & Matcha',
    label: 'Option 4: Almond Matcha',
    primary: '#677D6A',      // Matcha Brew
    secondary: '#40534C',    // Forest Roast
    accent: '#1A3636',       // Eclipse
    bg: '#D6BD98',           // Almond
  },
]

interface ThemeState {
  themeId: string
  isDark: boolean
  setTheme: (themeId: string) => void
  toggleDark: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeId: 'default',
      isDark: false,
      setTheme: (themeId: string) => {
        set({ themeId })
        applyThemeToDOM(themeId, get().isDark)
      },
      toggleDark: () => {
        const nextDark = !get().isDark
        set({ isDark: nextDark })
        applyThemeToDOM(get().themeId, nextDark)
      },
    }),
    {
      name: 'staflo-theme-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.themeId, state.isDark)
        }
      },
    }
  )
)

export function applyThemeToDOM(themeId: string, isDark: boolean) {
  const root = document.documentElement
  root.setAttribute('data-theme', themeId || 'default')
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
