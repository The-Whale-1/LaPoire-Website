'use strict';

const SAFE_ATTACHMENT_NAMES = new Set(['self-healing-event', 'self-healing-summary', 'request-guard-events']);

function redactText(value, env = process.env) {
  if (typeof value !== 'string') return value;
  let output = value;
  for (const [name, secret] of Object.entries(env)) {
    if (secret && (name === 'TEST_EMAIL' || /(?:PASSWORD|TOKEN|SECRET|AUTHORIZATION|API_KEY|WEBHOOK_URL)$/.test(name))) output = output.split(secret).join('[redacted]');
  }
  output = output.replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[email redacted]');
  output = output.replace(/\+?20\d{10,11}\b/g, '[phone redacted]');
  output = output.replace(/(authorization["'\s:=]+)(bearer\s+)?[^\s,}"']+/gi, '$1[redacted]');
  return output;
}

function isAuthTest(test) {
  const tags = test.tags || [];
  const title = typeof test.titlePath === 'function' ? test.titlePath().join(' ') : test.title || '';
  return tags.includes('@auth') || /(^|\s)@auth\b/i.test(title) || (test.annotations || []).some(item => item.type === 'auth');
}

function sanitizeError(error, auth) {
  if (!error) return error;
  if (auth) {
    error.message = 'Authenticated test failed. Detailed browser diagnostics are suppressed to protect account data.';
    error.stack = error.message;
    if ('snippet' in error) error.snippet = '';
    if ('value' in error) error.value = '[authenticated diagnostic suppressed]';
    if ('errorContext' in error) error.errorContext = '';
  } else {
    for (const key of ['message', 'stack', 'snippet', 'value', 'errorContext']) if (typeof error[key] === 'string') error[key] = redactText(error[key]);
  }
  return error;
}

function sanitizeResult(test, result) {
  const auth = isAuthTest(test);
  if (result.error) sanitizeError(result.error, auth);
  for (const error of result.errors || []) sanitizeError(error, auth);
  for (const step of result.steps || []) sanitizeStep(test, step);
  result.stdout = (result.stdout || []).map(value => auth ? '[authenticated output suppressed]\n' : redactText(Buffer.isBuffer(value) ? value.toString('utf8') : value));
  result.stderr = (result.stderr || []).map(value => auth ? '[authenticated output suppressed]\n' : redactText(Buffer.isBuffer(value) ? value.toString('utf8') : value));
  // Only fixture-generated locator/guard metadata is report-safe.
  result.attachments = (result.attachments || []).filter(attachment => SAFE_ATTACHMENT_NAMES.has(attachment.name));
  return result;
}

function sanitizeStep(test, step) {
  const auth = isAuthTest(test);
  step.title = auth ? 'Authenticated browser step (details suppressed)' : redactText(step.title);
  if (step.error) sanitizeError(step.error, auth);
  // Allure copies step attachments before onTestEnd; enforce the same whitelist
  // here so screenshot, DOM, storage or other arbitrary evidence never reaches it.
  if (step.attachments) step.attachments = step.attachments.filter(attachment => SAFE_ATTACHMENT_NAMES.has(attachment.name));
  for (const nested of step.steps || []) sanitizeStep(test, nested);
  return step;
}

module.exports = { redactText, isAuthTest, sanitizeError, sanitizeResult, sanitizeStep };
