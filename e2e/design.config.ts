import { defineConfig } from '@playwright/test'

/** Quick local design check (no AI calls), Chromium only. */
export default defineConfig({
  testDir: '.',
  testMatch: 'design-check.spec.ts',
  timeout: 10 * 60_000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'report/design-results',
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
