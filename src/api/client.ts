import { env } from '@/lib/env'
import { t } from '@/lib/strings.uz'

import { ApiError, errorFromResponse, messageForStatus } from './errors'
import { tokens } from './tokens'
import type { TokenResponse } from './types'

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type RequestOptions = {
  method?: Method
  body?: unknown
  signal?: AbortSignal
  /** Send the access token (default true). */
  auth?: boolean
  /** On 401, refresh the token pair once and retry (default true when auth is on). */
  refreshOn401?: boolean
}

let onAuthFailure: (() => void) | null = null

/** Called once the session cannot be renewed; the auth provider logs the student out. */
export function setAuthFailureHandler(handler: (() => void) | null): void {
  onAuthFailure = handler
}

function failAuth(): never {
  tokens.clear()
  onAuthFailure?.()
  throw new ApiError(401, t.errors.sessionExpired)
}

async function send(path: string, { method = 'GET', body, signal, auth = true }: RequestOptions) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const isForm = body instanceof FormData
  // FormData sets its own multipart Content-Type with the boundary.
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const access = tokens.getAccess()
  if (auth && access) headers.Authorization = `Bearer ${access}`

  try {
    return await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, messageForStatus(0))
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/**
 * Exchanges the refresh token for a new pair. Refresh tokens are single-use, so concurrent
 * callers share one request. Resolves false when the token is rejected; throws ApiError on
 * network or server errors (the session may still be valid, so nothing is cleared).
 */
let refreshing: Promise<TokenResponse | null> | null = null

export function refreshSession(): Promise<TokenResponse | null> {
  refreshing ??= runRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function runRefresh(): Promise<TokenResponse | null> {
  const used = tokens.getRefresh()
  if (!used) return null
  const result = await postRefresh(used)
  if (result) return result
  // Another tab may have rotated the token while this request was in flight.
  const current = tokens.getRefresh()
  if (current && current !== used) return postRefresh(current)
  return null
}

async function postRefresh(refreshToken: string): Promise<TokenResponse | null> {
  const res = await send('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  })
  if (res.status === 400 || res.status === 401 || res.status === 403) return null
  if (!res.ok) throw await errorFromResponse(res)
  const data = await parse<TokenResponse>(res)
  tokens.set(data.accessToken, data.refreshToken)
  return data
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, refreshOn401 = auth } = options
  let res = await send(path, options)

  if (res.status === 401 && refreshOn401) {
    const renewed = await refreshSession()
    if (!renewed) failAuth()
    res = await send(path, options)
    if (res.status === 401) failAuth()
  }

  if (!res.ok) throw await errorFromResponse(res)
  return parse<T>(res)
}
