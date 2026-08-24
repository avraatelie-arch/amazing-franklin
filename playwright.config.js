// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--host-resolver-rules=MAP * 127.0.0.1'],
    },
  },
  webServer: {
    command: 'npx http-server . -p 3000 -c-1',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
