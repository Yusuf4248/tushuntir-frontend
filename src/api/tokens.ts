/**
 * Access token: memory only. Refresh token: localStorage, so a reload can restore the session.
 * Storage can throw (private mode, blocked site data); then the refresh token lives in memory
 * for this tab only.
 */
const REFRESH_KEY = 'tushuntir.refreshToken'

let accessToken: string | null = null
let memoryRefreshToken: string | null = null

export const tokens = {
  getAccess(): string | null {
    return accessToken
  },

  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY) ?? memoryRefreshToken
    } catch {
      return memoryRefreshToken
    }
  },

  set(access: string, refresh: string): void {
    accessToken = access
    memoryRefreshToken = refresh
    try {
      localStorage.setItem(REFRESH_KEY, refresh)
    } catch {
      // Memory copy above is enough for this tab.
    }
  },

  clear(): void {
    accessToken = null
    memoryRefreshToken = null
    try {
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      // Nothing stored.
    }
  },
}
