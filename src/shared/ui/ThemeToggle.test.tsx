// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'
import { THEME_STORAGE_KEY } from '../hooks/useTheme'

afterEach(cleanup)

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('reads the stored theme on mount', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Toggle dark mode' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveTextContent('On')
  })

  it('defaults to light without a stored theme', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: 'Toggle dark mode' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('toggles, persists and applies the theme to the document', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Toggle dark mode' })

    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')

    await user.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})