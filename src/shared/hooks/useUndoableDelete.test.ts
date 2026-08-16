// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUndoableDelete } from './useUndoableDelete'

interface Item {
  id: string
}

const items: Item[] = [{ id: 'a' }, { id: 'b' }]
const remove = vi.fn((id: string) => {
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) items.splice(index, 1)
})
const restore = vi.fn((item: Item) => {
  items.push(item)
})
const find = vi.fn((id: string) => items.find((item) => item.id === id))

function setup(durationMs = 5000) {
  return renderHook(() =>
    useUndoableDelete({ remove, restore, find, message: 'Item deleted' }, durationMs),
  )
}

beforeEach(() => {
  items.length = 0
  items.push({ id: 'a' }, { id: 'b' })
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useUndoableDelete', () => {
  it('removes immediately and exposes an undo entry', () => {
    const { result } = setup()

    act(() => result.current.requestDelete('a'))

    expect(remove).toHaveBeenCalledWith('a')
    expect(items.map((item) => item.id)).toEqual(['b'])
    expect(result.current.pendingUndo).toEqual({
      message: 'Item deleted',
      item: { id: 'a' },
    })
  })

  it('restores the removed item on demand', () => {
    const { result } = setup()

    act(() => result.current.requestDelete('a'))
    act(() => result.current.restorePending(result.current.pendingUndo!.item))

    expect(restore).toHaveBeenCalledWith({ id: 'a' })
    expect(result.current.pendingUndo).toBeNull()
  })

  it('dismisses the undo entry after the window expires', () => {
    vi.useFakeTimers()
    const { result } = setup(5000)

    act(() => result.current.requestDelete('a'))
    expect(result.current.pendingUndo).not.toBeNull()

    act(() => vi.advanceTimersByTime(5000))

    expect(result.current.pendingUndo).toBeNull()
    expect(remove).toHaveBeenCalledTimes(1)
    expect(restore).not.toHaveBeenCalled()
  })

  it('ignores unknown ids and clears the undo state', () => {
    const { result } = setup()

    act(() => result.current.requestDelete('nope'))
    expect(remove).not.toHaveBeenCalled()
    expect(result.current.pendingUndo).toBeNull()

    act(() => result.current.requestDelete('b'))
    act(() => result.current.clearUndo())
    expect(result.current.pendingUndo).toBeNull()
    expect(items.map((item) => item.id)).toEqual(['a'])
  })
})