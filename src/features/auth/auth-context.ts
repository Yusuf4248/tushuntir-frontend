import { createContext, useContext } from 'react'

import type { ApiError } from '@/api/errors'
import type { AuthUser } from '@/api/types'

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: AuthUser }
  /** Logged in with a valid account that is not a student; the tokens are already dropped. */
  | { status: 'wrong_role'; user: AuthUser }
  /** The session could not be checked (offline, server down); tokens are kept. */
  | { status: 'error'; error: ApiError }

export type AuthApi = {
  state: AuthState
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Back to the login form after the wrong-role screen. */
  reset: () => void
  /** Retry restoring the session after an error. */
  restore: () => void
}

export const AuthContext = createContext<AuthApi | null>(null)

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** For screens behind the student guard, where the user is always present. */
export function useStudent(): AuthUser {
  const { state } = useAuth()
  if (state.status !== 'authenticated') throw new Error('useStudent needs an authenticated user')
  return state.user
}
