import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dailyflow-theme') || localStorage.getItem('dailyflow-theme')
    const shouldDark = saved === 'dark'
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
      className="h-8 w-8 rounded-full border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer shadow-2xs"
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-stone-600" />}
    </button>
  )
}

