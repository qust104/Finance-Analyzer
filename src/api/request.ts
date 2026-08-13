import { reportError } from '../shared/lib/monitoring'

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

// Every endpoint returns { error: string } on failure.
// Network boundary code must stay tiny: real work lives in the features.
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(resolveUrl(url), init)
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
