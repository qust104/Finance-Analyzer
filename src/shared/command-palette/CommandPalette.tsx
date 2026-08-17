import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBudgets } from '../hooks/useBudgets'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'
import { Modal } from '../ui/Modal'
import type { MatchSpan } from './searchIndex'
import { buildSearchIndex, groupResults, rankResults } from './searchIndex'
import type { SearchResult } from './searchIndex'
import { useCommandPaletteStore } from './useCommandPalette'
import './CommandPalette.css'

const GROUP_LABELS: Record<SearchResult['type'], string> = {
  transaction: 'Transactions',
  budget: 'Budgets',
  category: 'Categories',
  page: 'Pages',
}

// Splits the text on the match ranges and wraps each hit in <mark>.
function HighlightedText({ text, spans }: { text: string; spans: readonly MatchSpan[] }) {
  if (spans.length === 0) {
    return <>{text}</>
  }
  const nodes: ReactNode[] = []
  let cursor = 0
  for (const span of spans) {
    if (span.start > cursor) {
      nodes.push(text.slice(cursor, span.start))
    }
    nodes.push(<mark key={`${span.start}:${span.end}`}>{text.slice(span.start, span.end)}</mark>)
    cursor = span.end
  }
  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }
  return <>{nodes}</>
}

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
  const { groups, total } = useMemo(() => groupResults(rankResults(index, query)), [index, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const flatGroups = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.map((entry) => ({ groupType: group.type, entry })),
      ),
    [groups],
  )
  const active = flatGroups[activeIndex]

  const activate = (result: (typeof index)[number]) => {
    navigate(result.href)
    close()
  }

  const handleListKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, Math.max(flatGroups.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && active) {
      event.preventDefault()
      activate(active.entry.result)
    }
  }

  let cursor = -1
  const listNodes: ReactNode[] = []
  for (const group of groups) {
    listNodes.push(
      <li key={`label:${group.type}`} className="command-palette__group-label">
        {GROUP_LABELS[group.type]}
      </li>,
    )
    for (const entry of group.items) {
      cursor += 1
      const index = cursor
      const isActive = index === activeIndex
      listNodes.push(
        <li key={`${group.type}:${entry.result.id}`} role="option" aria-selected={isActive}>
          <button
            type="button"
            className={`command-palette__result${
              isActive ? ' command-palette__result--active' : ''
            }`}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => activate(entry.result)}
          >
            <span className="command-palette__type">{entry.result.type}</span>
            <span className="command-palette__texts">
              <span className="command-palette__title">
                <HighlightedText text={entry.result.title} spans={entry.titleSpans} />
              </span>
              <span className="command-palette__subtitle">
                <HighlightedText text={entry.result.subtitle} spans={entry.subtitleSpans} />
              </span>
            </span>
          </button>
        </li>,
      )
    }
    if (group.more > 0) {
      listNodes.push(
        <li key={`more:${group.type}`} className="command-palette__more">
          +{group.more} more {group.type}s
        </li>,
      )
    }
  }
  if (total > flatGroups.length) {
    listNodes.push(
      <li key="more:all" className="command-palette__more">
        +{total - flatGroups.length} more matches overall
      </li>,
    )
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
        aria-expanded={flatGroups.length > 0}
        role="combobox"
      />
      {query.trim() === '' ? (
        <p className="command-palette__hint">
          Type to search transactions, budgets, categories or pages.
        </p>
      ) : flatGroups.length === 0 ? (
        <p className="command-palette__empty">No matches for “{query.trim()}”.</p>
      ) : (
        <ul className="command-palette__results" role="listbox">
          {listNodes}
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