import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router/dom'

import { ApiError } from '@/api/errors'
import { ErrorBoundary } from '@/components/error-boundary'
import { ToastProvider } from '@/components/ui/toast'
import { AuthProvider } from '@/features/auth/auth-provider'

import { router } from './routes/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // Retry once, and only when the server or network failed; 4xx answers will not change.
      retry: (failureCount, error) =>
        failureCount < 1 &&
        error instanceof ApiError &&
        (error.status === 0 || error.status >= 500),
    },
  },
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
