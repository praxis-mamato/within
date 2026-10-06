import { defineConfig, devices } from '@playwright/test';

// Accessibility checks against the production build (docs/next-features.md A4).
// PLAYWRIGHT_CHROMIUM lets a machine with a preinstalled Chromium skip the browser download.
export default defineConfig({
  testDir: 'e2e',
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    ...devices['iPhone 13'],
    browserName: 'chromium',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
