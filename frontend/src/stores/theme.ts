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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 200 200" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M 103 14 C 112.5 14 120 21.5 120 31 C 120 39 114.5 45.5 107 47.5 L 84 61 C 74 67 68 77.5 68 89 C 68 96.5 70.8 103.5 75.8 108.8 L 88 101.8 C 89.5 101 91 100 93 99 L 138 73 C 144.5 69 153 74 153 81.5 C 153 86.5 150 91 145.5 93.5 L 98 121 C 94 123.3 92 127.5 92 132 L 92 168.5 C 92 173 95 177 99 178.8 C 103 180.5 107.5 179.5 110.5 176.5 L 161 133 C 165.5 129 168 123.5 168 117.5 L 168 59 C 168 44 156 32 141 32 C 134.5 32 128.5 34.5 124 38.5 C 122 25 113.5 14 103 14 Z M 64 68 C 64 54 75 43 89 43 L 103 35 C 106 33 107 29.5 105 26.5 C 103 23.5 99.5 22.5 96.5 24.5 L 68 41 C 47.5 53 35 75 35 99 L 35 138 C 35 153 47 165 62 165 C 77 165 89 153 89 138 L 89 116 C 73.8 116 64 103.5 64 89 L 64 68 Z" fill="${primaryColor}"/></svg>`
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

