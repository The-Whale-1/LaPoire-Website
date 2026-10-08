'use strict';

const { loadConfig } = require('./config');
const events = new WeakMap();

class LocatorResolutionError extends Error {
  constructor(key, reason) { super(`Locator ${key}: ${reason}`); this.name = 'LocatorResolutionError'; }
}

function safeIdentifier(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(value)) {
    throw new Error('Healing keys and fallback names must be static identifiers (letters, digits, _, ., :, -).');
  }
  return value;
}

function getHealingEvents(testInfo) { return testInfo ? [...(events.get(testInfo) || [])] : []; }

async function record(testInfo, event) {
  if (!testInfo) return;
  const list = events.get(testInfo) || [];
  list.push(event);
  events.set(testInfo, list);
  testInfo.annotations.push({ type: 'self-healing', description: `${event.key} -> ${event.fallback}${event.strictRejected ? ' (strict rejection)' : ''}` });
  await testInfo.attach('self-healing-event', { body: Buffer.from(JSON.stringify(event, null, 2)), contentType: 'application/json' });
}

async function inspect(locator, key) {
  const count = await locator.count();
  if (count > 1) throw new LocatorResolutionError(key, 'ambiguous locator; multiple elements match.');
  if (count === 1 && await locator.isVisible()) return locator;
  return null;
}

/**
 * Only caller-supplied, reviewed equivalent selectors may replace a locator.
 * The caller's action and assertion remain unchanged. No DOM inference occurs.
 */
async function resolveLocator(page, specification, testInfo, options) {
  void page; // Factories close over page or a scoped locator; no DOM evaluation.
  const key = safeIdentifier(specification.key);
  if (typeof specification.primary !== 'function') throw new Error('A primary locator factory is required.');
  const fallbacks = specification.fallbacks || [];
  fallbacks.forEach(fallback => {
    safeIdentifier(fallback.name);
    if (typeof fallback.locator !== 'function') throw new Error('Each fallback needs a locator factory.');
  });
  const config = options || loadConfig();
  const lookupTimeout = config.healingTimeout === undefined ? 1500 : config.healingTimeout;
  const deadline = Date.now() + lookupTimeout;
  const primary = specification.primary();
  do {
    const candidate = await inspect(primary, key);
    if (candidate) return candidate;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise(resolve => setTimeout(resolve, Math.min(100, remaining)));
  } while (Date.now() <= deadline);

  if (!config.selfHealing) throw new LocatorResolutionError(key, 'primary element is missing or hidden; self-healing is disabled.');
  for (const fallback of fallbacks) {
    const candidate = await inspect(fallback.locator(), `${key}.${fallback.name}`);
    if (!candidate) continue;
    const event = { key, fallback: fallback.name, reason: 'primary missing or hidden', strictRejected: Boolean(config.healingStrict) };
    await record(testInfo, event);
    if (config.healingStrict) throw new LocatorResolutionError(key, 'equivalent fallback found, but strict mode rejects fallback use.');
    return candidate;
  }
  throw new LocatorResolutionError(key, 'no single visible primary or reviewed equivalent fallback found.');
}

module.exports = { resolveLocator, getHealingEvents, LocatorResolutionError };
