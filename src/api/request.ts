import { reportError } from '../shared/lib/monitoring'
import { handleLocalRequest, type LocalResponse } from './local'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// The app is served from a sub-path on GitHub Pages while the mock
// worker only intercepts requests inside its scope, so relative paths
// must be prefixed with the deployment base ("/Finance-Analyzer/").
export function resolveUrl(url: string): string {
  if (/^https?:\/\//.test(url)) {
    return url
  }
  return import.meta.env.BASE_URL + url.replace(/^\//, '')
}

function throwAsApiError(url: string, result: LocalResponse): never {
  const body = result.body as { error?: unknown } | undefined
  const message =
    typeof body?.error === 'string'
      ? body.error
      : `Request failed with status ${result.status}`
  reportError(new Error(message), `api: ${url}`)
  throw new ApiError(message, result.status)
}

// Every endpoint returns { error: string } on failure.
// In production the "server" runs inline (no network, no worker);
// dev and tests hit the real fetch path intercepted by MSW.
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const resolved = resolveUrl(url)

  if (import.meta.env.PROD) {
    const result = handleLocalRequest(resolved, init)
    if (result.status < 200 || result.status >= 300) {
      throwAsApiError(url, result)
    }
    if (result.status === 204) {
      return undefined as T
    }
    return result.body as T
  }

  let response: Response
  try {
    response = await fetch(resolved, init)
  } catch (error) {
    // A failed fetch (offline, unreachable host) throws before the
    // status check; the query layer shows the ErrorState, and the
    // monitoring core records the raw cause.
    reportError(error, `network: ${url}`)
    throw new ApiError('Network request failed', 0)
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as { error?: unknown }
      if (typeof body.error === 'string') {
        message = body.error
      }
    } catch {
      // Non-JSON error body, keep the status fallback message.
    }
    reportError(new Error(message), `api: ${url}`)
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}