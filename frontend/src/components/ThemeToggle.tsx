import { Moon, Sun, Palette, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useThemeStore, THEME_PALETTES } from '../stores/theme'

export function useTheme() {
  const { isDark, toggleDark, themeId, setTheme } = useThemeStore()
  return { isDark, toggle: toggleDark, themeId, setTheme }
}

export default function ThemeToggle() {
  const { isDark, toggle, themeId, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={menuRef}>
      {/* Palette Selector Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Theme Palette Selector"
        className="h-8 px-2.5 rounded-full border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-xs"
      >
        <Palette className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {/* Light / Dark Mode Toggle */}
      <button
        onClick={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="h-8 w-8 rounded-full border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-xs"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-500" />
        ) : (
          <Moon className="h-4 w-4 text-zinc-600" />
        )}
      </button>

      {/* Dropdown Menu for 5 Color Palettes */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Color Themes
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              5 Presets
            </span>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {THEME_PALETTES.map((palette) => {
              const active = themeId === palette.id
              return (
                <button
                  key={palette.id}
                  onClick={() => {
                    setTheme(palette.id)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition border ${
                    active
                      ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800 font-semibold'
                      : 'border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Swatch Preview */}
                    <div className="flex items-center -space-x-1">
                      <span
                        className="h-4 w-4 rounded-full border border-white dark:border-zinc-900 shadow-xs"
                        style={{ backgroundColor: palette.primary }}
                        title={`Primary: ${palette.primary}`}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-white dark:border-zinc-900 shadow-xs"
                        style={{ backgroundColor: palette.secondary }}
                        title={`Secondary: ${palette.secondary}`}
                      />
                      <span
                        className="h-4 w-4 rounded-full border border-white dark:border-zinc-900 shadow-xs"
                        style={{ backgroundColor: palette.accent }}
                        title={`Accent: ${palette.accent}`}
                      />
                    </div>
                    <div>
                      <p className="text-zinc-900 dark:text-zinc-100 text-xs leading-tight">
                        {palette.name}
                        {palette.isDefault && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {palette.label}
                      </p>
                    </div>
                  </div>

                  {active && (
                    <Check className="h-4 w-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
