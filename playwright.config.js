import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  timeout: 120000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.HYDRO_BASE_URL || 'http://localhost:8080',
    headless: true,
    viewport: { width: 1440, height: 900 }
  },
  retries: 0,
  reporter: [['list']]
});
