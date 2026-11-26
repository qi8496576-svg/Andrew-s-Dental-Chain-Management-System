import { defineConfig, devices } from '@playwright/test'
if (!process.env.ADC_AUTH_BASE_URL || !process.env.ADC_TEST_USERNAME || !process.env.ADC_TEST_PASSWORD) throw new Error('Owned real-backend authentication fixture required')
export default defineConfig({
  testDir: './tests/e2e', testMatch: ['authentication.spec.ts', 'shell.spec.ts', 'staff-accounts.spec.ts', 'clinic-grants.spec.ts', 'patients.spec.ts', 'organization-resources.spec.ts','patient-bindings.spec.ts','schedules.spec.ts','appointment-booking.spec.ts','appointment-transitions.spec.ts','appointment-review.spec.ts','clinical-treatment.spec.ts','invoicing.spec.ts','quarterly-performance.spec.ts','analytics.spec.ts'], workers: 1, retries: 0, forbidOnly: true,
  timeout: 60_000,
  reporter: [['list'], ['junit', { outputFile: 'test-results/authentication.xml' }]], outputDir: 'test-results/authentication-browser',
  use: { baseURL: process.env.ADC_AUTH_BASE_URL, ignoreHTTPSErrors: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [{ name: 'real-mysql-authentication', use: { ...devices['Desktop Chrome'], ...(process.env.ADC_BROWSER_CHANNEL ? {channel:process.env.ADC_BROWSER_CHANNEL} : {}) } }],
})




