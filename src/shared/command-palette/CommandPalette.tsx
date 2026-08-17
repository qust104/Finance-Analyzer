import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import { Modal } from '../ui/Modal'
import { buildSearchIndex, searchIndex } from './searchIndex'
import { useCommandPaletteStore } from './useCommandPalette'
import './CommandPalette.css'

// Content sits below the visibility gate, so every open mounts it fresh:
// query and selection start clean without reset effects.
function CommandPaletteContent() {
  const close = useCommandPaletteStore((state) => state.close)
  const navigate = useNavigate()

  const { transactions } = useTransactions()
  const { budgets } = useBudgets()
  const { categories } = useCategories()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // The index depends only on cached data, so it recomputes only when
  // one of those collections actually changes.
  const index = useMemo(
    () => buildSearchIndex(transactions, budgets, categories),
    [transactions, budgets, categories],
  )
  const results = useMemo(() => searchIndex(index, query), [index, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const activate = (result: (typeof results)[number]) => {
    navigate(result.href)
    close()
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault()
      activate(results[activeIndex])
    }
  }

  return (
    <div className="command-palette">
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(0)
        }}
        onKeyDown={handleListKeyDown}
        className="command-palette__input"
        placeholder="Transactions, budgets, categories, pages…"
        aria-label="Search query"
        aria-expanded={results.length > 0}
        role="combobox"
      />
      {query.trim() === '' ? (
        <p className="command-palette__hint">
          Type to search transactions, budgets, categories or pages.
        </p>
      ) : results.length === 0 ? (
        <p className="command-palette__empty">No matches for “{query.trim()}”.</p>
      ) : (
        <ul className="command-palette__results" role="listbox">
          {results.map((result, index) => (
            <li key={`${result.type}:${result.id}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={`command-palette__result${
                  index === activeIndex ? ' command-palette__result--active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => activate(result)}
              >
                <span className="command-palette__type">{result.type}</span>
                <span className="command-palette__texts">
                  <span className="command-palette__title">{result.title}</span>
                  <span className="command-palette__subtitle">{result.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Open with Ctrl/Cmd+K from anywhere; Escape unloads via the Modal.
export function CommandPalette() {
  const isOpen = useCommandPaletteStore((state) => state.isOpen)
  const open = useCommandPaletteStore((state) => state.open)
  const close = useCommandPaletteStore((state) => state.close)

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      {isOpen && (
        <Modal title="Search" onClose={close}>
          <CommandPaletteContent />
        </Modal>
      )}
    </>
  )
}