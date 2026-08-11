import { reportError } from '../shared/lib/monitoring'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

// Every endpoint returns { error: string } on failure.
// Network boundary code must stay tiny: real work lives in the features.
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, init)
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
