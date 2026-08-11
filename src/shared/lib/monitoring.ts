// A tiny reporting core: the app has no real backend endpoint, so by
// default errors land in the console. In production a transport
// (Sentry, LogRocket, a metrics endpoint) plugs in via
// registerErrorReporter, and the app code stays transport-agnostic.
export interface ErrorReport {
  message: string
  context?: string
  error?: unknown
}

export type ErrorReporter = (report: ErrorReport) => void

const reporters: ErrorReporter[] = []

export function registerErrorReporter(reporter: ErrorReporter): () => void {
  reporters.push(reporter)
  return () => {
    const index = reporters.indexOf(reporter)
    if (index !== -1) {
      reporters.splice(index, 1)
    }
  }
}

export function reportError(error: unknown, context?: string): void {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[monitoring] ${context ? `${context}: ` : ''}${message}`, error)
  for (const reporter of reporters) {
    try {
      reporter({ message, context, error })
    } catch {
      // A broken reporter must never break the app.
    }
  }
}

// Catches everything React's error boundary cannot see: plain runtime
// errors and unhandled promise rejections. Returns a cleanup function
// so tests can mount and unmount the listeners cleanly.
export function initGlobalErrorReporting(): () => void {
  let stopped = false
  const onError = (event: ErrorEvent) => {
    if (!stopped) {
      reportError(event.error ?? new Error(event.message), 'window.onerror')
    }
  }
  const onRejection = (event: PromiseRejectionEvent) => {
    if (!stopped) {
      reportError(event.reason, 'unhandledrejection')
    }
  }
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  return () => {
    stopped = true
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}