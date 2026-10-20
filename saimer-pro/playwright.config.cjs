const { defineConfig } = require('@playwright/test');
const os = require('node:os');
const path = require('node:path');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: 'list',
  outputDir: process.env.TEST_OUTPUT_DIR || path.join(os.tmpdir(), 'saimer-browser-results'),
  use: {
    baseURL: 'http://127.0.0.1:4174/saimer-pro/',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'node tools/preview.mjs --port 4174',
    url: 'http://127.0.0.1:4174/saimer-pro/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    ...[320,375,390,430,768,1024,1440].map(width => ({
      name: `chromium-${width}`,
      use: { browserName: 'chromium', viewport: { width, height: 900 }, isMobile: width < 768, hasTouch: width < 768 },
    })),
    { name: 'webkit-iphone', use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'webkit-landscape', use: { browserName: 'webkit', viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
  ],
});
