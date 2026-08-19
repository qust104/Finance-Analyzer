import { describe, expect, it } from 'vitest'
import { computeVirtualRange } from './virtualWindow'

describe('computeVirtualRange', () => {
  it('returns empty range for an empty list', () => {
    expect(computeVirtualRange(0, 600, 48, 0, 8)).toEqual({ start: 0, end: 0 })
  })

  it('renders the whole range when the list fits the viewport', () => {
    expect(computeVirtualRange(0, 600, 48, 10, 8)).toEqual({ start: 0, end: 10 })
  })

  it('clips the start to zero', () => {
    expect(computeVirtualRange(0, 600, 48, 100, 8)).toEqual({ start: 0, end: 21 })
  })

  it('advances the window with the scroll offset', () => {
    expect(computeVirtualRange(48 * 20, 480, 48, 100, 8)).toEqual({ start: 12, end: 38 })
  })

  it('clamps the end to the total count', () => {
    expect(computeVirtualRange(48 * 90, 480, 48, 100, 8)).toEqual({ start: 82, end: 100 })
  })

  it('keeps overscan rows below the fold', () => {
    expect(computeVirtualRange(0, 480, 48, 1000, 8)).toEqual({ start: 0, end: 18 })
  })

  it('handles a fractional row height at odd scroll positions', () => {
    expect(computeVirtualRange(100, 500, 48, 50, 4)).toEqual({ start: 0, end: 17 })
  })
})