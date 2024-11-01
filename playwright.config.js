import dotenv from 'dotenv';

dotenv.config();

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  timeout: 80000,
  retries: 1,
  use: {
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 100,
    },
  },
  reporter: 'list',
});