import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import { initGlobalErrorReporting } from './shared/lib/monitoring'
import { ErrorBoundary } from './shared/ui/ErrorBoundary'

// The app has no real backend: MSW intercepts network requests and
// serves data from the same storage layer. It is the only
// infrastructure, so it runs in production builds as well.
const queryClient = new QueryClient()

initGlobalErrorReporting()

async function mount() {
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  } catch {
    // If the worker cannot start (private browsing, blocked service
    // worker registration) the app still mounts: requests fail and
    // the error states take over instead of a blank screen.
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void mount()
