'use strict';

const { STAGING_ORIGIN } = require('./config');

// Unknown mutations fail closed. Add a root only after observing its request,
// confirming its limited effect, and reviewing the change with its test.
// Observed delivery selection changes only an unauthenticated draft cart.
// Authenticated cart operations remain outside this read-only account scope.
const GUEST_CART_MUTATIONS = new Set([
  'clearShipments', 'clearPayments', 'updateCartDynamicProperties',
  'addItem', 'changeCartItemQuantity', 'removeCartItems',
]);
const CART_AND_LOCATION_MUTATIONS = GUEST_CART_MUTATIONS;
const AUTH_MUTATIONS = new Set();
const BROWSER_API_ORIGINS = new Set([STAGING_ORIGIN, 'https://xrsm.lapoire.endlg.com']);
const SAFE_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
// Observed browser telemetry only. Abort it to avoid recording QA traffic;
// suppression is evidence, rather than a failure of a customer journey.
const SUPPRESSED_TELEMETRY = new Set([
  'https://analytics.google.com/g/collect',
  'https://stats.g.doubleclick.net/g/collect',
  'https://www.google.com/ccm/collect',
  'https://ad.doubleclick.net/ccm/s/collect',
  `${STAGING_ORIGIN}/cdn-cgi/rum`,
]);
const riskyPath = /(?:^|\/)(?:orders?|payments?(?:[_-]intents?)?|complaints?|customers?|accounts?|profiles?|address(?:es)?|wallet|checkout|register|signup|forgot-password|reset-password|custom-cake-requests?)(?:\/|$)/i;
const actionPath = /(?:^|\/)(?:delete|remove|create|update|submit|reset|cancel|refund|capture|charge|pay|register|signup|unsubscribe)[_-]?(?:orders?|payments?|customers?|accounts?|profiles?|address(?:es)?|password|complaints?)?(?:\/|$)/i;
const safeWritePath = /(?:^|\/)(?:cart|basket|bag|location|locations|zone|zones|delivery-area|delivery-zone)(?:\/|$)/i;
const authPath = /(?:^|\/)(?:login|signin|sign-in|logout)(?:\/|$)/i;

function parseGraphQLRoots(query) {
  if (typeof query !== 'string' || !query.trim()) return { valid: false, roots: [], hasMutation: false };
  const tokens = [];
  const lexer = /\s+|#[^\r\n]*|"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|\.\.\.|[A-Za-z_][A-Za-z_0-9]*|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[!$():=@\[\]{|},]/gy;
  let position = 0;
  while (position < query.length) {
    lexer.lastIndex = position;
    const match = lexer.exec(query);
    if (!match) return { valid: false, roots: [], hasMutation: false };
    position = lexer.lastIndex;
    const token = match[0];
    if (/^\s|^#|^,/.test(token)) continue;
    tokens.push(token[0] === '"' ? '<string>' : token);
  }
  let depth = 0;
  let parentheses = 0;
  let brackets = 0;
  let mutation = false;
  let hasMutation = false;
  let needField = false;
  const roots = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (depth === 0 && parentheses === 0 && token === 'mutation') {
      mutation = true;
      hasMutation = true;
    }
    if (token === '(') { parentheses++; continue; }
    if (token === ')') { if (--parentheses < 0) return { valid: false, roots: [], hasMutation }; continue; }
    if (token === '[') { brackets++; continue; }
    if (token === ']') { if (--brackets < 0) return { valid: false, roots: [], hasMutation }; continue; }
    if (parentheses > 0 || brackets > 0) continue;
    if (token === '{') { depth++; if (depth === 1) needField = true; continue; }
    if (token === '}') {
      if (--depth < 0) return { valid: false, roots: [], hasMutation };
      if (depth === 0) mutation = false;
      if (depth === 1) needField = true;
      continue;
    }
    if (!mutation || depth !== 1) continue;
    if (token === '...') return { valid: false, roots: [], hasMutation };
    if (token === '@') { index++; continue; }
    if (/^[A-Za-z_]/.test(token)) {
      if (tokens[index + 1] === ':') { index += 2; roots.push(tokens[index]); }
      else if (needField || tokens[index - 1] !== ':') roots.push(token);
      needField = false;
    }
  }
  return { valid: depth === 0 && parentheses === 0 && brackets === 0 && (!hasMutation || roots.length > 0), roots, hasMutation };
}

function graphQLDecision(payload, authEnabled) {
  if (Array.isArray(payload)) {
    if (!payload.length) return { allowed: false, reason: 'empty-graphql-batch' };
    for (const entry of payload) {
      const decision = graphQLDecision(entry, authEnabled);
      if (!decision.allowed) return decision;
    }
    return { allowed: true, reason: 'reviewed-graphql-batch' };
  }
  const operation = parseGraphQLRoots(payload && payload.query);
  if (!operation.valid) return { allowed: false, reason: 'unknown-or-malformed-graphql-operation' };
  if (!operation.hasMutation) return { allowed: true, reason: 'graphql-query' };
  if (operation.roots.every(root => (!authEnabled && GUEST_CART_MUTATIONS.has(root)) || (authEnabled && AUTH_MUTATIONS.has(root)))) {
    return { allowed: true, reason: 'reviewed-graphql-mutation' };
  }
  return { allowed: false, reason: 'unreviewed-graphql-mutation', operationRoots: operation.roots };
}

const SAFE_PATH_SEGMENTS = new Set(['api', 'graphql', 'cart', 'carts', 'basket', 'bag', 'items', 'location', 'locations', 'zone', 'zones', 'delivery', 'delivery-area', 'delivery-zone', 'login', 'signin', 'logout', 'auth', 'payment', 'payments', 'order', 'orders', 'customer', 'customers', 'register', 'profile', 'profiles', 'account', 'address', 'addresses', 'complaint', 'complaints', 'custom-cake-requests', 'reset-password', 'forgot-password', 'log', 'logs', 'tracking', 'track', 'collect', 'analytics', 'events', 'event', 'batch', 'checkout', 'update', 'create', 'delete', 'remove', 'g', 'cdn-cgi', 'rum', 'ccm', 's']);

function blockedRequestEvent(request, decision, channel) {
  let origin = 'invalid-url';
  let pathname = '/';
  try {
    const url = new URL(request.url, STAGING_ORIGIN);
    origin = url.origin;
    // No query, body, credentials, account IDs, names or tokens in evidence.
    pathname = url.pathname.split('/').map(segment => !segment ? '' : SAFE_PATH_SEGMENTS.has(segment.toLowerCase()) ? segment.toLowerCase() : ':segment').join('/');
  } catch { /* Static invalid-url metadata suffices. */ }
  const event = { reason: decision.reason, channel, method: request.method, origin, path: pathname };
  if (decision.suppressedTelemetry) event.suppressedTelemetry = true;
  if (decision.suppressedAncillary) event.suppressedAncillary = true;
  if (decision.operationRoots) event.operationRoots = decision.operationRoots.filter(root => /^[A-Za-z_][A-Za-z_0-9]{0,100}$/.test(root));
  return event;
}

function requestDecision(request, config = {}) {
  let parsed;
  try { parsed = new URL(request.url, STAGING_ORIGIN); } catch { return { allowed: false, reason: 'invalid-url' }; }
  if (!['https:', 'http:', 'data:', 'blob:'].includes(parsed.protocol)) return { allowed: false, reason: 'unsupported-protocol' };
  if (parsed.username || parsed.password) return { allowed: false, reason: 'url-credentials' };
  if (request.apiRequest && parsed.origin !== STAGING_ORIGIN) return { allowed: false, reason: 'api-origin-not-staging' };
  if (request.isMainFrame && request.isNavigationRequest && parsed.origin !== STAGING_ORIGIN) return { allowed: false, reason: 'navigation-origin-not-staging' };
  if (!request.apiRequest && !request.isNavigationRequest && SUPPRESSED_TELEMETRY.has(`${parsed.origin}${parsed.pathname}`)) {
    return { allowed: false, reason: 'telemetry-suppressed', suppressedTelemetry: true };
  }
  const method = (request.method || 'GET').toUpperCase();
  const path = decodePath(parsed.pathname);
  if (actionPath.test(path)) return { allowed: false, reason: 'risky-action-endpoint' };
  let payload = request.postData;
  if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { payload = null; } }
  const hasGraphQLPayload = entry => entry && (typeof entry.query === 'string' || entry.extensions?.persistedQuery || (typeof entry.operationName === 'string' && entry.variables));
  const graphql = /(?:^|\/)graphql(?:\/|$)/i.test(path) || (Array.isArray(payload) ? payload.some(hasGraphQLPayload) : hasGraphQLPayload(payload));
  if (graphql) {
    if (!BROWSER_API_ORIGINS.has(parsed.origin)) return { allowed: false, reason: 'graphql-origin-not-reviewed' };
    if (method === 'GET') {
      // Persisted queries cannot be proven read-only without their query text.
      payload = { query: parsed.searchParams.get('query') };
    }
    return graphQLDecision(payload, config.authEnabled);
  }
  if (SAFE_HTTP_METHODS.has(method)) return { allowed: true, reason: 'http-read' };
  if (riskyPath.test(path)) return { allowed: false, reason: 'risky-write-endpoint' };
  // Third-party scripts use changing telemetry hosts. Abort every unknown
  // external write without making a working shop fail for ancillary traffic.
  // Dangerous paths, GraphQL and foreign main-frame navigations already fail.
  if (!BROWSER_API_ORIGINS.has(parsed.origin)) return { allowed: false, reason: 'external-write-suppressed', suppressedAncillary: true };
  if (config.authEnabled && /(?:^|\/)(?:cart|carts|basket|bag)(?:\/|$)/i.test(path)) return { allowed: false, reason: 'authenticated-cart-write-outside-scope' };
  if (safeWritePath.test(path)) return { allowed: true, reason: 'cart-or-location-write' };
  if (config.authEnabled && authPath.test(path)) return { allowed: true, reason: 'explicitly-enabled-login' };
  return { allowed: false, reason: 'unreviewed-write-endpoint' };
}

function decodePath(path) {
  try { return decodeURIComponent(path); } catch { return path; }
}

function partitionSafetyEvents(events) {
  return {
    business: events.filter(event => !event.suppressedTelemetry && !event.suppressedAncillary),
    telemetry: events.filter(event => event.suppressedTelemetry),
    ancillary: events.filter(event => event.suppressedAncillary),
  };
}

function guardedRequest(request, config, onBlocked = () => {}) {
  function wrapped(method, url, options = {}) {
    const actualMethod = method === 'fetch' ? options.method || 'GET' : method.toUpperCase();
    const body = options.data === undefined ? options.form : options.data;
    const decision = requestDecision({ url, method: actualMethod, postData: body, apiRequest: true }, config);
    if (!decision.allowed) {
      onBlocked(blockedRequestEvent({ url, method: actualMethod }, decision, 'api'));
      throw new Error(`Request safety guard blocked ${actualMethod}: ${decision.reason}.`);
    }
    // APIRequestContext follows redirects by default. Do not leave the reviewed origin.
    return request[method](url, { ...options, maxRedirects: 0 });
  }
  return new Proxy(request, {
    get(target, name) {
      if (['fetch', 'get', 'post', 'put', 'patch', 'delete', 'head'].includes(name)) return (url, options) => wrapped(name, url, options);
      const value = target[name];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

module.exports = { requestDecision, parseGraphQLRoots, graphQLDecision, guardedRequest, blockedRequestEvent, partitionSafetyEvents, GUEST_CART_MUTATIONS, CART_AND_LOCATION_MUTATIONS, AUTH_MUTATIONS, BROWSER_API_ORIGINS };
