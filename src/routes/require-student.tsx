import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { Logo } from '@/components/logo'
import { ErrorState } from '@/components/states'
import { useAuth } from '@/features/auth/auth-context'
import { t } from '@/lib/strings.uz'

/** Renders child routes only for a logged-in student. */
export function RequireStudent() {
  const { state, restore } = useAuth()
  const location = useLocation()

  if (state.status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center" role="status">
        <div className="flex flex-col items-center gap-4">
          <Logo className="size-12" />
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          <span className="sr-only">{t.auth.restoring}</span>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-4">
        <ErrorState message={state.error.message} onRetry={restore} className="w-full" />
      </div>
    )
  }

  if (state.status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
