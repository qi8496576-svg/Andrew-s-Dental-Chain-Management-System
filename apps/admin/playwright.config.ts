import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/resource-extension.spec.ts','**/authentication.spec.ts', '**/staff-accounts.spec.ts', '**/clinic-grants.spec.ts', '**/patients.spec.ts', '**/organization-resources.spec.ts','**/patient-bindings.spec.ts','**/schedules.spec.ts','**/appointment-booking.spec.ts','**/appointment-transitions.spec.ts','**/appointment-review.spec.ts','**/clinical-treatment.spec.ts','**/invoicing.spec.ts','**/quarterly-performance.spec.ts','**/analytics.spec.ts'], // Real-MySQL fixture/config required.
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['junit', { outputFile: 'test-results/playwright.xml' }]],
  outputDir: 'test-results/browser',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], ...(process.env.ADC_BROWSER_CHANNEL ? { channel: process.env.ADC_BROWSER_CHANNEL } : {}) },
  }],
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})




