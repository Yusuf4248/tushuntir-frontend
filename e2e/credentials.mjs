// Reads E2E_PHONE / E2E_PASSWORD from the environment, else from e2e/.env.local (gitignored).
// Never prints the password.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export function loadCredentials() {
  const fromFile = {}
  const file = join(here, '.env.local')
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = /^\s*(E2E_[A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
      if (m) fromFile[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
    }
  }
  const phone = process.env.E2E_PHONE || fromFile.E2E_PHONE
  const password = process.env.E2E_PASSWORD || fromFile.E2E_PASSWORD
  if (!phone || !password) {
    throw new Error(
      'Set E2E_PHONE and E2E_PASSWORD in the environment, or put them in e2e/.env.local ' +
        '(E2E_PHONE=+998…, E2E_PASSWORD=…). The file is gitignored.',
    )
  }
  return { phone, password }
}

export const PROD = {
  app: process.env.E2E_BASE_URL || 'https://tushuntir-frontend.vercel.app',
  api: process.env.E2E_API_URL || 'https://api.tushuntir.uz/api',
}
