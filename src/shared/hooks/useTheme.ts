import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'finance-analyzer.theme'

// theme-init.js applies the stored theme before first paint; this
// re-reads it so the first render agrees even when the script
// could not run (tests, blocked storage).
export function readTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}