'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { summarize, redact, markdown } = require('../summarize.cjs');
function report(status, attachments = []) {
  return { suites: [{ specs: [{ title: 'Cart total', tests: [{ status, projectName: 'chromium',
    results: [{ status: status === 'expected' ? 'passed' : 'failed', attachments, error: { message: 'Example assertion' } }] }] }] }], stats: { duration: 123 } };
}
test('A zero-test run cannot produce a passing daily report', () => {
  assert.equal(summarize({ suites: [] }).outcome, 'FAILED');
});
test('Business failure is retained with evidence in summary', () => {
  const result = summarize(report('unexpected'), 1);
  assert.equal(result.outcome, 'FAILED');
  assert.equal(result.counts.failed, 1);
  assert.match(markdown(result), /Example assertion/);
});
test('Flaky and healed outcomes remain visible as degraded', () => {
  assert.equal(summarize(report('flaky')).outcome, 'DEGRADED');
  const result = summarize(report('expected', [{ name: 'self-healing-event' }]));
  assert.equal(result.outcome, 'DEGRADED');
  assert.equal(result.counts.healed, 1);
});
test('Only skipped coverage never looks healthy', () => {
  const result = summarize(report('skipped'));
  assert.equal(result.outcome, 'NO_COVERAGE');
  assert.equal(result.counts.passed, 0);
});
test('Runner errors and nonzero exits fail otherwise passing reports', () => {
  assert.equal(summarize(report('expected'), 7).outcome, 'FAILED');
  assert.equal(summarize({ ...report('expected'), errors: [{ message: 'Runner unavailable' }] }).outcome, 'FAILED');
});
test('Secrets and contact details are removed from outgoing evidence', () => {
  const prior = process.env.TEST_PASSWORD;
  try {
    process.env.TEST_PASSWORD = 'synthetic-secret-only';
    assert.equal(redact('synthetic-secret-only user@example.test +201234567890'), '[redacted] [email] [phone]');
  } finally {
    if (prior === undefined) delete process.env.TEST_PASSWORD;
    else process.env.TEST_PASSWORD = prior;
  }
});
