const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 150_000,
  // Keep Playwright's transform resolver away from the Harness workspace
  // solution; the Electron tests are plain JavaScript.
  tsconfig: './tsconfig.json',
})
