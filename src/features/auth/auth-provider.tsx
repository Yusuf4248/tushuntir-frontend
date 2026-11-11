import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { fetchMe, loginRequest, logoutRequest } from '@/api/auth'
import { refreshSession, setAuthFailureHandler } from '@/api/client'
import { ApiError, messageForStatus } from '@/api/errors'
import { tokens } from '@/api/tokens'
import type { AuthUser } from '@/api/types'
import { useToast } from '@/components/ui/toast'
import { t } from '@/lib/strings.uz'

import { AuthContext, type AuthState } from './auth-context'

/** Only students keep a session; any other role is logged out on the spot. */
async function stateForUser(user: AuthUser): Promise<AuthState> {
  if (user.role === 'student') return { status: 'authenticated', user }
  await logoutRequest()
  tokens.clear()
  return { status: 'wrong_role', user }
}

/** Refresh token → new pair → /auth/me. Never throws. */
async function resolveStoredSession(): Promise<AuthState> {
  try {
    const renewed = await refreshSession()
    if (!renewed) {
      tokens.clear()
      return { status: 'anonymous' }
    }
    return await stateForUser(await fetchMe())
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { status: 'anonymous' }
    const apiError = error instanceof ApiError ? error : new ApiError(0, messageForStatus(0))
    return { status: 'error', error: apiError }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [state, setState] = useState<AuthState>(() =>
    tokens.getRefresh() ? { status: 'loading' } : { status: 'anonymous' },
  )

  const statusRef = useRef(state.status)
  useEffect(() => {
    statusRef.current = state.status
  }, [state.status])

  // Restore the session once on load; the initial state is already 'loading'.
  useEffect(() => {
    if (!tokens.getRefresh()) return
    let active = true
    void resolveStoredSession().then((next) => {
      if (active) setState(next)
    })
    return () => {
      active = false
    }
  }, [])

  // The API client calls this when a refresh fails mid-session.
  useEffect(() => {
    setAuthFailureHandler(() => {
      queryClient.clear()
      if (statusRef.current === 'authenticated') {
        toast({ title: t.errors.sessionExpired, variant: 'info' })
      }
      setState({ status: 'anonymous' })
    })
    return () => setAuthFailureHandler(null)
  }, [queryClient, toast])

  const restore = useCallback(() => {
    if (!tokens.getRefresh()) {
      setState({ status: 'anonymous' })
      return
    }
    setState({ status: 'loading' })
    void resolveStoredSession().then(setState)
  }, [])

  const login = useCallback(
    async (phone: string, password: string) => {
      const { user } = await loginRequest({ login: phone, password })
      queryClient.clear()
      setState(await stateForUser(user))
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    await logoutRequest()
    tokens.clear()
    queryClient.clear()
    setState({ status: 'anonymous' })
  }, [queryClient])

  const reset = useCallback(() => {
    tokens.clear()
    setState({ status: 'anonymous' })
  }, [])

  const api = useMemo(
    () => ({ state, login, logout, reset, restore }),
    [state, login, logout, reset, restore],
  )

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}
