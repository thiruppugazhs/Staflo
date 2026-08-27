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

export function updateFavicon(primaryColor: string, accentColor: string) {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 100 100" fill="none"><path d="M 68 14 C 80 14 88 23 88 34 C 88 45 80 54 68 54 L 48 54 C 42 54 38 58 38 64 C 38 70 42 74 48 74 L 72 74 C 77 74 81 78 81 83 C 81 88 77 92 72 92 L 32 92 C 20 92 12 83 12 72 C 12 61 20 52 32 52 L 52 52 C 58 52 62 48 62 42 C 62 36 58 32 52 32 L 28 32 C 23 32 19 28 19 23 C 19 18 23 14 28 14 L 68 14 Z" fill="${primaryColor}"/><circle cx="72" cy="34" r="4.5" fill="#FFFFFF" opacity="0.9"/><circle cx="28" cy="72" r="4.5" fill="#FFFFFF" opacity="0.9"/></svg>`
    const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/svg+xml'
    link.href = encoded
  } catch (e) {}
}

export function applyThemeToDOM(themeId: string, isDark: boolean) {
  const root = document.documentElement
  root.setAttribute('data-theme', themeId || 'default')
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Find active palette to update favicon
  const activePalette = THEME_PALETTES.find((p) => p.id === themeId) || THEME_PALETTES[0]
  updateFavicon(activePalette.primary, activePalette.accent)
}

