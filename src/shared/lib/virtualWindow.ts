export interface VirtualRange {
  start: number
  end: number
}

// Windowed rendering for long lists: only the rows inside the visible
// viewport (plus an overscan buffer) hit the DOM. Pure and synchronous,
// so it is trivially testable; the scroll container keeps total height
// unchanged via spacer rows.
export function computeVirtualRange(
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  total: number,
  overscan: number,
): VirtualRange {
  if (total === 0) {
    return { start: 0, end: 0 }
  }
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleEnd = Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
  return { start, end: Math.min(total, visibleEnd) }
}