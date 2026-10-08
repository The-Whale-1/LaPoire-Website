'use strict';

const path = require('node:path');
// Playwright otherwise writes an automatic DOM snapshot on any failure, even
// with screenshots and tracing disabled. Reports retain sanitized errors.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
require('dotenv').config({ path: path.join(__dirname, '.env.js'), quiet: true });
const { defineConfig, devices } = require('@playwright/test');
const { loadConfig } = require('./e2e/support/config');
const settings = loadConfig();
const presets = {
  chromium: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
  firefox: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 1000 } },
  webkit: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } },
};

module.exports = defineConfig({
  testDir: './e2e/tests',
  testMatch: '**/*.spec.js',
  outputDir: './artifacts/js/test-results',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: settings.retries,
  timeout: 120000,
  globalTimeout: 30 * 60 * 1000,
  expect: { timeout: settings.timeout },
  reporter: [
    ['./e2e/support/safe-reporter.js', { kind: 'list' }],
    ['./e2e/support/safe-reporter.js', { kind: 'html', outputFolder: 'artifacts/js/playwright-report', open: 'never' }],
    ['./e2e/support/safe-reporter.js', { kind: 'json', outputFile: 'artifacts/js/results.json' }],
    ['./e2e/support/safe-reporter.js', { kind: 'allure', resultsDir: 'artifacts/js/allure-results', environmentInfo: {
      Application: 'La Poire staging', Scope: 'Cart and catalog; no order or payment submission',
      'Self healing': settings.selfHealing ? (settings.healingStrict ? 'strict' : 'reviewed equivalent fallbacks') : 'disabled',
    } }],
  ],
  use: {
    baseURL: settings.baseURL,
    locale: 'en-US',
    geolocation: { latitude: settings.latitude, longitude: settings.longitude },
    actionTimeout: settings.timeout,
    navigationTimeout: 60000,
    serviceWorkers: 'block',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: settings.projectNames.map(name => ({ name, use: presets[name] })),
});
