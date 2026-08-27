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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 100 100" fill="none"><path d="M44 14 H68 C71 14 73.5 16 72.5 19 L48 43 C46.5 44.5 44 45 42 45 H30 C27 45 25 42.5 26.5 40 L41 16.5 C42 15 43 14 44 14 Z" fill="${primaryColor}"/><path d="M44 38 L54 44 C56.5 45.5 58 48 58 51 L48 51 C45.5 51 43.5 49 42 47 L36 41 C38 39.5 41 38 44 38 Z" fill="${primaryColor}" opacity="0.85"/><path d="M58 55 H70 C73 55 75 57.5 73.5 60 L59 83.5 C58 85 57 86 56 86 H32 C29 86 26.5 84 27.5 81 L52 57 C53.5 55.5 56 55 58 55 Z" fill="${accentColor}"/></svg>`
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

