import { env } from './env'

/** File and audio links from the API are relative to its origin (e.g. /uploads/…). */
export function apiFileUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url, new URL(env.apiUrl).origin).toString()
  } catch {
    return null
  }
}
