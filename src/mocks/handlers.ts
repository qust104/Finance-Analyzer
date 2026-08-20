import { http, HttpResponse, passthrough } from 'msw'
import { handleLocalRequest } from '../api/local'

// Node has no location, so relative paths never match in tests;
// the browser resolves "window.location.origin" to the same base.
// The deployment base ("" in dev, "/Finance-Analyzer" on Pages) must
// match the URLs the API layer sends, or the worker scope mismatch
// would send requests to the network instead of the mock backend.
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
export const API_BASE =
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost') + basePath

const API_PREFIX = `${basePath}/api/`

// The mock backend is the same "server" the production build runs
// inline (src/api/local.ts); here it is exposed as HTTP handlers so
// dev and tests exercise the real fetch path. Only API calls are
// intercepted: CSS, JS modules and SPA navigation must pass straight
// through to the dev server, or a blanket "404 no such route" reply
// breaks the page itself.
export const handlers = [
  http.all(`${API_BASE}/*`, async ({ request }) => {
    if (!new URL(request.url).pathname.startsWith(API_PREFIX)) {
      return passthrough()
    }
    const text = request.method === 'GET' ? undefined : await request.text()
    const result = handleLocalRequest(request.url, {
      method: request.method,
      body: text,
    })
    if (result.body === undefined) {
      return new HttpResponse(null, { status: result.status })
    }
    return HttpResponse.json(result.body, { status: result.status })
  }),
]