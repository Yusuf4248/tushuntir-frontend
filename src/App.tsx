import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
  // A language change re-renders everything: the screens are remounted (the URL and the
  // cached data stay), so no text keeps the old language.
  const { i18n } = useTranslation()
  // The backend translates content (topics, questions, AI text) per Accept-Language: refetch it.
  const language = useRef(i18n.language)
  useEffect(() => {
    if (language.current === i18n.language) return
    language.current = i18n.language
    void queryClient.invalidateQueries()
  }, [i18n.language])
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider key={i18n.language} router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
