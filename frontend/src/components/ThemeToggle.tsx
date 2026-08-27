import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dailyflow-theme')
    const shouldDark = saved === 'dark'
    // default is light (white) per spec — ignore system preference unless explicitly saved
    setIsDark(shouldDark)
    document.documentElement.classList.toggle('dark', shouldDark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('dailyflow-theme', next ? 'dark' : 'light')
  }

  return { isDark, toggle }
}

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="h-8 w-8 rounded-full border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
    >
      {isDark ? <Sun className="h-4 w-4 text-zinc-600 dark:text-zinc-400" /> : <Moon className="h-4 w-4 text-zinc-600" />}
    </button>
  )
}
