'use strict';

const base = require('@playwright/test');
const { loadConfig } = require('../support/config');
const { requestDecision, guardedRequest, blockedRequestEvent, partitionSafetyEvents } = require('../support/guards');
const { getHealingEvents } = require('../support/healing');
const { isAuthTest, sanitizeError } = require('../support/privacy');

const test = base.test.extend({
  appConfig: [async ({}, use) => { await use(loadConfig()); }, { scope: 'worker' }],
  _safetyEvents: async ({}, use) => { await use([]); },
  request: async ({ request, appConfig, _safetyEvents }, use) => {
    await use(guardedRequest(request, appConfig, event => _safetyEvents.push(event)));
  },
  context: async ({ context, appConfig, _safetyEvents }, use) => {
    await context.grantPermissions(['geolocation'], { origin: appConfig.origin });
    // Browser routing disables HTTP cache; service workers are disabled in config.
    await context.route('**/*', async route => {
      const request = route.request();
      let isMainFrame = false;
      try { isMainFrame = request.frame().parentFrame() === null; } catch { /* A worker request has no frame. */ }
      const decision = requestDecision({
        url: request.url(), method: request.method(), postData: request.postData(),
        isNavigationRequest: request.isNavigationRequest(), isMainFrame,
      }, appConfig);
      if (decision.allowed) return route.continue();
      _safetyEvents.push(blockedRequestEvent({ url: request.url(), method: request.method() }, decision, 'browser'));
      return route.abort('blockedbyclient');
    });
    await use(context);
  },
  page: async ({ page, appConfig }, use) => {
    page.setDefaultTimeout(appConfig.timeout);
    page.setDefaultNavigationTimeout(60000);
    await use(page);
  },
  _audit: [async ({ _safetyEvents }, use, testInfo) => {
    await use();
    const healingEvents = getHealingEvents(testInfo);
    const eventGroups = partitionSafetyEvents(_safetyEvents);
    const businessSafetyEvents = eventGroups.business;
    if (healingEvents.length) await testInfo.attach('self-healing-summary', { body: Buffer.from(JSON.stringify(healingEvents, null, 2)), contentType: 'application/json' });
    if (_safetyEvents.length) {
      await testInfo.attach('request-guard-events', { body: Buffer.from(JSON.stringify(_safetyEvents, null, 2)), contentType: 'application/json' });
      if (businessSafetyEvents.length) testInfo.annotations.push({ type: 'safety-guard', description: `${businessSafetyEvents.length} unreviewed request(s) blocked` });
      const telemetryCount = eventGroups.telemetry.length;
      if (telemetryCount) testInfo.annotations.push({ type: 'telemetry-suppressed', description: `${telemetryCount} analytics request(s) suppressed` });
      if (eventGroups.ancillary.length) testInfo.annotations.push({ type: 'external-write-suppressed', description: `Warning: ${eventGroups.ancillary.length} unknown third-party write(s) aborted. Review the isolation audit.` });
    }
    for (const error of testInfo.errors) sanitizeError(error, isAuthTest(testInfo));
    // Business safety blocks fail the journey. Suppressed third-party traffic
    // remains an audited warning and never counts as a healed assertion.
    if (businessSafetyEvents.length) {
      const summaries = [...new Set(businessSafetyEvents.map(event => `${event.method} ${event.origin}${event.path}: ${event.reason}${event.operationRoots?.length ? ` (${event.operationRoots.join(',')})` : ''}`))];
      throw new Error(`Request safety guard blocked unreviewed requests:\n${summaries.join('\n')}`);
    }
  }, { auto: true }],
});

module.exports = { test, expect: base.expect };
