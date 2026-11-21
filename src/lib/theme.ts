import { useSyncExternalStore } from 'react'

/** Light / dark / system theme, remembered on this device (a convenience, not account data). */
export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'tushuntir.theme'
const THEME_COLOR = { light: '#f6f8fb', dark: '#0e1526' }

const listeners = new Set<() => void>()
let current: ThemeChoice = readStored()

function readStored(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function systemDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function getTheme(): ThemeChoice {
  return current
}

/** Sets <html data-theme> (absent = follow the system) and the browser bar colour. */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement
  if (choice === 'system') delete root.dataset.theme
  else root.dataset.theme = choice
  const dark = choice === 'dark' || (choice === 'system' && systemDark())
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light)
}

function update(choice: ThemeChoice) {
  current = choice
  applyTheme(choice)
  listeners.forEach((listener) => listener())
}

export function setTheme(choice: ThemeChoice): void {
  try {
    if (choice === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, choice)
  } catch {
    // Still applied for this visit.
  }
  update(choice)
}

/** Applies the saved theme and keeps it current: system changes and other tabs. */
export function initTheme(): void {
  applyTheme(current)
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (current === 'system') applyTheme('system')
  })
  window.addEventListener('storage', (event) => {
    if (event.key === KEY || event.key === null) update(readStored())
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current choice and a setter; every switch on screen stays in sync. */
export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribe, getTheme, getTheme)
  return [choice, setTheme]
}
