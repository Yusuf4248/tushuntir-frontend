import { defineConfig } from '@playwright/test'

/** Production smoke test: one long serial test, Chromium only. */
export default defineConfig({
  testDir: '.',
  testMatch: 'prod-smoke.spec.ts',
  timeout: 30 * 60_000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'report/test-results',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
