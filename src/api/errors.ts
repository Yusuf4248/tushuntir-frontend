import { t } from '@/lib/strings.uz'

import type { ApiErrorBody } from './types'

/** status 0 = the request never reached the server. */
export class ApiError extends Error {
  readonly status: number
  /** The backend's own (English) message, for logic and logs; never shown to students. */
  readonly serverMessage?: string

  constructor(status: number, message: string, serverMessage?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.serverMessage = serverMessage
  }
}

export function messageForStatus(status: number): string {
  if (status === 0) return t.errors.network
  if (status === 400 || status === 422) return t.errors.validation
  if (status === 401) return t.errors.sessionExpired
  if (status === 403) return t.errors.forbidden
  if (status === 404) return t.errors.notFound
  if (status === 409) return t.errors.conflict
  if (status === 429) return t.errors.tooManyRequests
  if (status === 503) return t.errors.aiBusy
  if (status >= 500) return t.errors.server
  return t.errors.unknown
}

export async function errorFromResponse(res: Response): Promise<ApiError> {
  let serverMessage: string | undefined
  try {
    const body = (await res.json()) as ApiErrorBody
    serverMessage = Array.isArray(body.message) ? body.message.join('; ') : body.message
  } catch {
    // Not JSON (proxy page, empty body).
  }
  return new ApiError(res.status, messageForStatus(res.status), serverMessage)
}

/** A readable Uzbek message for anything thrown by the API layer. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return t.errors.unknown
}
