import { apiRequest } from './client'
import { tokens } from './tokens'
import type { AuthUser, LoginBody, TokenResponse } from './types'

export async function loginRequest(body: LoginBody): Promise<TokenResponse> {
  const data = await apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body,
    auth: false,
  })
  tokens.set(data.accessToken, data.refreshToken)
  return data
}

export function fetchMe(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { signal })
}

/** Revokes the refresh token on the server. Best effort: callers clear local state anyway. */
export async function logoutRequest(): Promise<void> {
  if (!tokens.getAccess()) return
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST', refreshOn401: false })
  } catch {
    // Already invalid or offline; local logout still happens.
  }
}
