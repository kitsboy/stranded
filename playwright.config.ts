import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003',
    trace: 'on-first-retry',
  },
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: true,
  },
})