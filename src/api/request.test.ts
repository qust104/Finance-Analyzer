import { describe, expect, it } from 'vitest'
import { resolveUrl } from './request'

describe('resolveUrl', () => {
  it('keeps absolute URLs untouched', () => {
    expect(resolveUrl('https://example.com/api/x')).toBe('https://example.com/api/x')
  })

  it('keeps the root-relative path in dev (BASE_URL is "/")', () => {
    expect(resolveUrl('/api/transactions')).toBe('/api/transactions')
  })

  it('prefixes the path with the deployment base', () => {
    const original = import.meta.env.BASE_URL
    import.meta.env.BASE_URL = '/Finance-Analyzer/'
    try {
      expect(resolveUrl('/api/transactions')).toBe('/Finance-Analyzer/api/transactions')
    } finally {
      import.meta.env.BASE_URL = original
    }
  })
})
