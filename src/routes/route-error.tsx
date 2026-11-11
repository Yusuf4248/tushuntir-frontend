import { useEffect } from 'react'
import { useRouteError } from 'react-router'

import { CrashScreen } from '@/components/crash-screen'

/** errorElement for the route tree: a failed lazy chunk or a render error. */
export function RouteError() {
  const error = useRouteError()
  useEffect(() => console.error('Route error', error), [error])
  return <CrashScreen />
}
