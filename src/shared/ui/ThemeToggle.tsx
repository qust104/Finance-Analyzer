import { useTheme } from '../hooks/useTheme'
import './ThemeToggle.css'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label="Toggle dark mode"
    >
      <span>Dark mode</span>
      <span className="theme-toggle__state">{isDark ? 'On' : 'Off'}</span>
    </button>
  )
}