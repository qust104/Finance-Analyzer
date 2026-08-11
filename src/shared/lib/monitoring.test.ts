// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  initGlobalErrorReporting,
  registerErrorReporter,
  reportError,
} from './monitoring'

describe('monitoring', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('delivers errors to registered reporters', () => {
    const reporter = vi.fn()
    const unregister = registerErrorReporter(reporter)

    reportError(new Error('kaboom'), 'feature-x')

    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'kaboom', context: 'feature-x' }),
    )
    unregister()
  })

  it('keeps reporting when one reporter throws', () => {
    const broken = vi.fn(() => {
      throw new Error('broken reporter')
    })
    registerErrorReporter(broken)
    const healthy = vi.fn()
    registerErrorReporter(healthy)

    reportError(new Error('kaboom'))

    expect(broken).toHaveBeenCalled()
    expect(healthy).toHaveBeenCalled()
  })

  it('stops delivering after the reporter is unregistered', () => {
    const reporter = vi.fn()
    const unregister = registerErrorReporter(reporter)

    unregister()
    reportError(new Error('kaboom'))

    expect(reporter).not.toHaveBeenCalled()
  })

  it('captures window errors and unhandled rejections', () => {
    const reporter = vi.fn()
    const unregister = registerErrorReporter(reporter)
    const stop = initGlobalErrorReporting()

    window.dispatchEvent(new ErrorEvent('error', { message: 'window boom' }))
    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', {
        reason: new Error('reject boom'),
        promise: Promise.resolve(),
      }),
    )

    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'window boom', context: 'window.onerror' }),
    )
    expect(reporter).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'reject boom', context: 'unhandledrejection' }),
    )

    stop()
    unregister()
  })

  it('removes global listeners on cleanup', () => {
    const reporter = vi.fn()
    const unregister = registerErrorReporter(reporter)
    const stop = initGlobalErrorReporting()

    stop()
    window.dispatchEvent(new ErrorEvent('error', { message: 'late boom' }))

    expect(reporter).not.toHaveBeenCalled()
    unregister()
  })
})