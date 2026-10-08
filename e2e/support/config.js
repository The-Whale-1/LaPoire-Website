'use strict';

const STAGING_ORIGIN = 'https://lapoire-stag.endlg.com';
// Page objects use desktop navigation. Firefox/WebKit presets are available;
// their live behavior must be validated separately before extending coverage.
const PROJECT_NAMES = ['chromium', 'firefox', 'webkit'];

function boolean(env, name, fallback = false) {
  const value = env[name];
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be true or false.`);
}

function number(env, name, fallback, minimum, maximum, integer = false) {
  const source = env[name];
  const value = source === undefined || source === '' ? fallback : Number(source);
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < minimum || value > maximum) {
    throw new Error(`${name} must be ${integer ? 'an integer' : 'a number'} between ${minimum} and ${maximum}.`);
  }
  return value;
}

function validateBaseURL(value = `${STAGING_ORIGIN}/`) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error('BASE_URL must be the La Poire HTTPS staging root.'); }
  if (parsed.origin !== STAGING_ORIGIN || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('BASE_URL must be https://lapoire-stag.endlg.com/ with no credentials, path, query or fragment.');
  }
  return `${STAGING_ORIGIN}/`;
}

function loadConfig(env = process.env) {
  const projectNames = (env.TEST_PROJECTS || 'chromium').split(',').map(value => value.trim());
  if (!projectNames.length || projectNames.some(name => !PROJECT_NAMES.includes(name)) || new Set(projectNames).size !== projectNames.length) {
    throw new Error(`TEST_PROJECTS must be unique names from ${PROJECT_NAMES.join(', ')}.`);
  }
  const config = {
    baseURL: validateBaseURL(env.BASE_URL),
    origin: STAGING_ORIGIN,
    city: (env.TEST_CITY || '').trim(),
    checkoutCity: (env.CHECKOUT_CITY || 'El Haram').trim(),
    latitude: number(env, 'TEST_LATITUDE', 30.0444, -90, 90),
    longitude: number(env, 'TEST_LONGITUDE', 31.2357, -180, 180),
    product: (env.TEST_PRODUCT || 'Raspberry Gateau').trim(),
    timeout: number(env, 'UI_TIMEOUT_MS', 20000, 1000, 120000, true),
    retries: number(env, 'TEST_RETRIES', 0, 0, 2, true),
    healingTimeout: number(env, 'HEALING_TIMEOUT_MS', 1500, 0, 10000, true),
    selfHealing: boolean(env, 'SELF_HEALING', true),
    healingStrict: boolean(env, 'SELF_HEALING_STRICT', false),
    authEnabled: boolean(env, 'RUN_AUTH_TESTS', false),
    projectNames: Object.freeze(projectNames),
  };
  // Non-enumerable credentials cannot accidentally appear in JSON metadata.
  Object.defineProperties(config, {
    email: { value: env.TEST_EMAIL || '', enumerable: false },
    password: { value: env.TEST_PASSWORD || '', enumerable: false },
  });
  if (config.authEnabled && (!config.email || !config.password)) {
    throw new Error('RUN_AUTH_TESTS=true requires TEST_EMAIL and TEST_PASSWORD for a dedicated staging test account.');
  }
  if (!config.product) throw new Error('TEST_PRODUCT must contain a product name.');
  return Object.freeze(config);
}

module.exports = { loadConfig, validateBaseURL, STAGING_ORIGIN, PROJECT_NAMES };
