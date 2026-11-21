import { defineConfig, devices } from '@playwright/test'

/**
 * Quick local design check (no AI calls) on real device profiles.
 * One device: npm run e2e:design -- --project=iphone-14
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'design-check.spec.ts',
  timeout: 10 * 60_000,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: 'report/design-results',
  use: { locale: 'uz-UZ', timezoneId: 'Asia/Tashkent' },
  projects: [
    {
      // The reference phone width for screenshots.
      name: '375',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: 'iphone-14', use: { ...devices['iPhone 14'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 7)'] } },
    {
      name: 'desktop-1440',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
  ],
})
