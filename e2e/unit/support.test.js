'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, validateBaseURL } = require('../support/config');
const { resolveLocator, getHealingEvents } = require('../support/healing');
const { requestDecision, guardedRequest, blockedRequestEvent, partitionSafetyEvents, CART_AND_LOCATION_MUTATIONS, AUTH_MUTATIONS } = require('../support/guards');
const { redactText, sanitizeResult } = require('../support/privacy');

test('the destination is restricted to the exact HTTPS staging root', () => {
  assert.equal(validateBaseURL('https://lapoire-stag.endlg.com'), 'https://lapoire-stag.endlg.com/');
  for (const url of [
    'http://lapoire-stag.endlg.com/', 'https://lapoire-stag.endlg.com.evil.test/',
    'https://lapoire-stag.endlg.com:8443/', 'https://user:password@lapoire-stag.endlg.com/',
    'https://lapoire-stag.endlg.com/cart', 'https://lapoire-stag.endlg.com/?token=example',
    'https://lapoire-stag.endlg.com/#section', 'https://evil.test/',
  ]) assert.throws(() => validateBaseURL(url), /BASE_URL/);
});

test('config validates coordinates, switches and dedicated account prerequisites', () => {
  const config = loadConfig({ TEST_PASSWORD: 'dummy-unit-secret' });
  assert.equal(config.authEnabled, false);
  assert.equal(config.retries, 0);
  assert(!JSON.stringify(config).includes('dummy-unit-secret'));
  assert.throws(() => loadConfig({ TEST_LATITUDE: 'Infinity' }), /TEST_LATITUDE/);
  assert.throws(() => loadConfig({ TEST_LONGITUDE: '181' }), /TEST_LONGITUDE/);
  assert.throws(() => loadConfig({ RUN_AUTH_TESTS: 'yes' }), /RUN_AUTH_TESTS/);
  assert.throws(() => loadConfig({ RUN_AUTH_TESTS: 'true' }), /requires TEST_EMAIL/);
  assert.throws(() => loadConfig({ TEST_PROJECTS: 'chromium,chromium' }), /TEST_PROJECTS/);
  assert.throws(() => loadConfig({ TEST_PROJECTS: 'unknown' }), /TEST_PROJECTS/);
  assert.throws(() => loadConfig({ TEST_RETRIES: '0.5' }), /TEST_RETRIES/);
});

const graphqlURL = 'https://xrsm.lapoire.endlg.com/graphql';
function graphql(query, extra = {}) { return requestDecision({ url: graphqlURL, method: 'POST', postData: { query }, ...extra }, { authEnabled: false }); }

test('request safety allows reads/cart and blocks order/payment/profile writes and foreign navigation', () => {
  assert.equal(requestDecision({ url: '/product/example', method: 'GET' }).allowed, true);
  assert.equal(requestDecision({ url: '/api/cart/items', method: 'POST' }).allowed, true);
  for (const path of ['/api/orders', '/api/payments', '/api/customer', '/api/customers', '/api/profile', '/api/addresses', '/api/complaint']) {
    assert.equal(requestDecision({ url: path, method: 'POST' }).allowed, false, path);
  }
  assert.equal(requestDecision({ url: 'https://evil.test/', method: 'GET', isMainFrame: true, isNavigationRequest: true }).allowed, false);
  assert.equal(requestDecision({ url: 'https://evil.test/api/cart', method: 'POST' }).allowed, false);
  assert.equal(requestDecision({ url: 'https://user:secret@lapoire-stag.endlg.com/', method: 'GET' }).allowed, false);
  assert.equal(requestDecision({ url: '/api/orders/delete', method: 'GET' }).allowed, false);
});

test('GraphQL guards inspect actual mutation roots, aliases and batch operations', () => {
  // Inject reviewed test-only roots; production starts with no assumed mutation.
  CART_AND_LOCATION_MUTATIONS.add('addToCart');
  AUTH_MUTATIONS.add('login');
  try {
  assert.equal(graphql('query Catalog { products { id name } }').allowed, true);
  assert.equal(graphql('query Catalog($keyword: String = "mutation createOrder") { products(keyword: $keyword) { id } }').allowed, true);
  assert.equal(graphql('mutation Cart($input: CartInput!) { cart: addToCart(input: $input) { id } }').allowed, true);
  assert.equal(graphql('mutation { cart: createOrder(input: {items: []}) { id } }').allowed, false);
  assert.equal(graphql('mutation { addToCart { id } createPayment { id } }').allowed, false);
  assert.equal(graphql('mutation { ...Unsafe } fragment Unsafe on Mutation { createOrder { id } }').allowed, false);
  assert.equal(graphql('mutation { addToCart { id }').allowed, false);
  assert.equal(requestDecision({ url: graphqlURL, method: 'POST', postData: { query: 'mutation { login { token } }' } }, { authEnabled: true }).allowed, true);
  assert.equal(requestDecision({ url: graphqlURL, method: 'POST', postData: { query: 'mutation { login { token } }' } }, { authEnabled: false }).allowed, false);
  assert.equal(requestDecision({ url: graphqlURL, method: 'POST', postData: [{ query: '{ products { id } }' }, { query: 'mutation { createOrder { id } }' }] }).allowed, false);
  assert.equal(requestDecision({ url: graphqlURL, method: 'POST', postData: { extensions: { persistedQuery: { sha256Hash: 'unknown' } } } }).allowed, false);
  } finally {
    CART_AND_LOCATION_MUTATIONS.delete('addToCart');
    AUTH_MUTATIONS.delete('login');
  }
});

test('observed draft cart operations are permitted only in unauthenticated guest scope', () => {
  const query = 'mutation DraftCart { clearShipments { id } clearPayments { id } updateCartDynamicProperties { id } addItem { id } changeCartItemQuantity { id } removeCartItems { id } }';
  const request = { url: graphqlURL, method: 'POST', postData: { query } };
  assert.equal(requestDecision(request, { authEnabled: false }).allowed, true);
  assert.equal(requestDecision(request, { authEnabled: true }).allowed, false);
  assert.equal(requestDecision({ url: '/api/cart/items', method: 'POST' }, { authEnabled: true }).allowed, false);
});

test('API wrapper cannot follow redirects or call another origin', async () => {
  const seen = [];
  const request = { get: async (url, options) => { seen.push({ url, options }); return { status: () => 200 }; } };
  const guarded = guardedRequest(request, {});
  await guarded.get('/');
  assert.equal(seen[0].options.maxRedirects, 0);
  assert.throws(() => guarded.get('https://evil.test/'), /api-origin-not-staging/);
  assert.throws(() => guarded.get('/api/orders/delete'), /risky-action-endpoint/);
});

test('only observed telemetry endpoints suppress traffic without hiding risky writes', () => {
  for (const url of ['https://analytics.google.com/g/collect?token=private', 'https://stats.g.doubleclick.net/g/collect', 'https://www.google.com/ccm/collect', 'https://ad.doubleclick.net/ccm/s/collect', 'https://lapoire-stag.endlg.com/cdn-cgi/rum']) {
    const decision = requestDecision({ url, method: 'POST' });
    assert.equal(decision.allowed, false);
    assert.equal(decision.suppressedTelemetry, true);
    const event = blockedRequestEvent({ url, method: 'POST' }, decision, 'browser');
    assert.equal(JSON.stringify(event).includes('private'), false);
  }
  for (const url of ['https://analytics.google.com.evil.test/g/collect', 'https://analytics.google.com/orders', 'https://lapoire-stag.endlg.com/cdn-cgi/order']) {
    const decision = requestDecision({ url, method: 'POST' });
    assert.equal(decision.allowed, false);
    assert.equal(decision.suppressedTelemetry, undefined);
  }
});

test('changing third-party writes are aborted as audit warnings while risky/app/GraphQL requests fail', () => {
  const isolated = [];
  for (const url of ['https://dynamic-telemetry.example/events', 'https://content.hotjar.io/', 'https://www.google.com/g/collect', 'https://random.example/tr']) {
    const request = { url, method: 'POST' };
    const decision = requestDecision(request);
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'external-write-suppressed');
    assert.equal(decision.suppressedAncillary, true);
    isolated.push(blockedRequestEvent(request, decision, 'browser'));
  }
  assert.equal(partitionSafetyEvents(isolated).business.length, 0);
  assert.equal(partitionSafetyEvents(isolated).ancillary.length, 4);
  for (const path of ['/orders', '/payments', '/payment-intents', '/accounts', '/customers', '/address', '/addresses', '/checkout', '/update-profile']) {
    const request = { url: `https://unknown.example${path}`, method: 'POST' };
    const decision = requestDecision(request);
    assert.equal(decision.allowed, false, path);
    assert.equal(decision.suppressedAncillary, undefined, path);
    assert.equal(partitionSafetyEvents([blockedRequestEvent(request, decision, 'browser')]).business.length, 1, path);
  }
  for (const origin of ['https://lapoire-stag.endlg.com', 'https://xrsm.lapoire.endlg.com']) {
    const decision = requestDecision({ url: `${origin}/events`, method: 'POST' });
    assert.equal(decision.reason, 'unreviewed-write-endpoint');
    assert.equal(decision.suppressedAncillary, undefined);
  }
  for (const request of [
    { url: 'https://unknown.example/graphql', method: 'POST', postData: { query: '{ products { id } }' } },
    { url: 'https://unknown.example/events', method: 'POST', postData: [{ query: 'mutation { createOrder { id } }' }] },
    { url: 'https://unknown.example/events', method: 'POST', postData: { extensions: { persistedQuery: { sha256Hash: 'unknown' } } } },
    { url: 'https://unknown.example/', method: 'GET', isMainFrame: true, isNavigationRequest: true },
  ]) {
    const decision = requestDecision(request);
    assert.equal(decision.allowed, false);
    assert.equal(decision.suppressedAncillary, undefined);
  }
});

const locator = (count, visible = true) => ({ count: async () => count, isVisible: async () => visible });
const healingOptions = { selfHealing: true, healingStrict: false, healingTimeout: 0 };
const info = () => ({ annotations: [], attachments: [], attach: async function (name, attachment) { this.attachments.push({ name, ...attachment }); } });

test('self-healing uses a reviewed single visible fallback and records its use', async () => {
  const fallback = locator(1);
  const testInfo = info();
  const actual = await resolveLocator(null, { key: 'search.field', primary: () => locator(0), fallbacks: [{ name: 'search-role', locator: () => fallback }] }, testInfo, healingOptions);
  assert.equal(actual, fallback);
  assert.equal(getHealingEvents(testInfo).length, 1);
  assert.equal(testInfo.attachments[0].name, 'self-healing-event');
});

test('healing rejects ambiguous/hidden matches and strict fallback without weakening assertions', async () => {
  await assert.rejects(resolveLocator(null, { key: 'cart.icon', primary: () => locator(2), fallbacks: [{ name: 'fallback', locator: () => locator(1) }] }, info(), healingOptions), /ambiguous/);
  await assert.rejects(resolveLocator(null, { key: 'cart.icon', primary: () => locator(1, false), fallbacks: [{ name: 'fallback', locator: () => locator(1, false) }] }, info(), healingOptions), /no single visible/);
  const strictInfo = info();
  await assert.rejects(resolveLocator(null, { key: 'cart.icon', primary: () => locator(0), fallbacks: [{ name: 'fallback', locator: () => locator(1) }] }, strictInfo, { ...healingOptions, healingStrict: true }), /strict mode/);
  assert.equal(getHealingEvents(strictInfo)[0].strictRejected, true);
  await assert.rejects(resolveLocator(null, { key: 'cart.icon', primary: () => locator(0), fallbacks: [{ name: 'fallback', locator: () => locator(1) }] }, info(), { ...healingOptions, selfHealing: false }), /disabled/);
});

test('report privacy strips known secrets and suppresses authenticated diagnostics', () => {
  assert.equal(redactText('unit-secret test@example.test', { TEST_PASSWORD: 'unit-secret' }), '[redacted] [email redacted]');
  const result = { errors: [{ message: 'Private address on an auth page', stack: 'private stack', snippet: 'account input', errorContext: 'private account DOM' }], steps: [{ title: 'fill("unit-secret")', attachments: [{ name: 'auth-screenshot' }, { name: 'request-guard-events' }] }], stdout: ['private account'], attachments: [{ name: 'screenshot' }, { name: 'self-healing-event' }] };
  sanitizeResult({ tags: ['@auth'], title: 'sign-in' }, result);
  assert(!JSON.stringify(result).includes('unit-secret'));
  assert(!JSON.stringify(result).includes('Private address'));
  assert.equal(result.attachments.length, 1);
  assert.equal(result.steps[0].attachments.length, 1);
  assert.equal(result.steps[0].attachments[0].name, 'request-guard-events');
  assert.equal(result.errors[0].errorContext, '');
  assert.equal(redactText('smtp-secret github-secret', { SMTP_PASSWORD: 'smtp-secret', GITHUB_TOKEN: 'github-secret' }), '[redacted] [redacted]');
});

test('privacy reporter initializes bundled Playwright v2 and adapts Allure v1 without raw fallback', async () => {
  const SafeReporter = require('../support/safe-reporter');
  const listing = new SafeReporter({ kind: 'list' });
  assert.equal(listing.printsToStdio(), true);
  assert.equal(listing.version(), 'v2');
  await listing.ready;
  assert.equal(listing.delegate.version(), 'v2');
  const allure = new SafeReporter({ kind: 'allure' });
  let observed;
  const config = { example: 'config' };
  const suite = { example: 'suite' };
  allure.delegate = { onBegin: (first, second) => { observed = [first, second]; } };
  allure.onConfigure(config);
  allure.onBegin(suite);
  assert.deepEqual(observed, [config, suite]);
});
