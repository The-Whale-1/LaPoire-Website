'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { checkedPath } = require('./paths.cjs');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env.js'), quiet: true });

function redact(value) {
  let result = String(value || '');
  for (const key of ['TEST_EMAIL', 'TEST_PASSWORD', 'SMTP_USER', 'SMTP_PASSWORD', 'REPORT_WEBHOOK_URL', 'QA_MANAGER_AUTHORIZATION']) {
    const secret = process.env[key];
    if (secret) result = result.split(secret).join('[redacted]');
  }
  return result.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/(?:\+?\d[\d ()-]{8,}\d)/g, '[phone]');
}
function summarize(report, exitCode = 0) {
  const cases = [];
  function visit(suite, ancestry = []) {
    const names = suite.title ? [...ancestry, suite.title] : ancestry;
    for (const spec of suite.specs || []) {
      for (const item of spec.tests || []) {
        const attempts = item.results || [];
        const last = attempts.at(-1);
        const healed = attempts.some(attempt => (attempt.attachments || []).some(a => /heal/i.test(a.name)));
        cases.push({ title: redact([...names, spec.title].filter(Boolean).join(' > ')), project: item.projectName,
          status: item.status || 'unexpected', result: last?.status || 'missing', attempts: attempts.length, healed,
          error: item.status === 'unexpected' ? redact(last?.error?.message || last?.errors?.[0]?.message || 'No result produced.').slice(0, 1600) : undefined });
      }
    }
    for (const child of suite.suites || []) visit(child, names);
  }
  for (const suite of report.suites || []) visit(suite);
  const counts = { total: cases.length, passed: 0, failed: 0, skipped: 0, flaky: 0, healed: 0 };
  for (const item of cases) {
    if (item.status === 'expected') counts.passed++;
    else if (item.status === 'skipped') counts.skipped++;
    else if (item.status === 'flaky') counts.flaky++;
    else counts.failed++;
    if (item.healed) counts.healed++;
  }
  const infrastructureErrors = (report.errors || []).map(error => redact(error.message || 'Runner error').slice(0, 1200));
  const outcome = !cases.length || infrastructureErrors.length || exitCode !== 0 || counts.failed ? 'FAILED'
    : counts.flaky || counts.healed ? 'DEGRADED' : counts.passed === 0 ? 'NO_COVERAGE' : 'PASSED';
  return { generatedAt: new Date().toISOString(), environment: 'La Poire staging', outcome, counts, exitCode,
    durationMs: report.stats?.duration || 0, runUrl: process.env.REPORT_RUN_URL || (process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null),
    infrastructureErrors, cases };
}
function markdown(summary) {
  const { counts: c } = summary;
  const lines = ['# La Poire test results', '', `**${summary.outcome}** — ${c.passed} passed, ${c.failed} failed, ${c.skipped} skipped, ${c.flaky} flaky, ${c.healed} healed (${c.total} total).`, '',
    `Environment: staging. Generated: ${summary.generatedAt}. Duration: ${(summary.durationMs / 1000).toFixed(1)}s.`, '',
    'Skipped tests do not count as verified coverage. A healed locator is reported as degradation even when its business assertion passes.', ''];
  if (summary.runUrl) lines.push(`[Cloud run and downloadable reports](${summary.runUrl})`, '');
  for (const error of summary.infrastructureErrors) lines.push('Runner error:', '```text', error.replaceAll('```', "'''"), '```', '');
  const failures = summary.cases.filter(item => item.status === 'unexpected');
  for (const item of failures) lines.push(`### ${item.title.replace(/[\r\n]/g, ' ')} (${item.project})`, '', '```text', (item.error || '').replaceAll('```', "'''"), '```', '');
  const skips = summary.cases.filter(item => item.status === 'skipped');
  if (skips.length) lines.push('Skipped coverage:', '', ...skips.map(item => `- ${item.title} (${item.project})`), '');
  return lines.join('\n');
}
if (require.main === module) {
  let report = { errors: [{ message: 'Playwright results file is missing; test execution did not complete.' }], suites: [] };
  if (fs.existsSync(checkedPath('results.json'))) report = JSON.parse(fs.readFileSync(checkedPath('results.json'), 'utf8'));
  const execution = fs.existsSync(checkedPath('execution.json')) ? JSON.parse(fs.readFileSync(checkedPath('execution.json'), 'utf8')) : {};
  const summary = summarize(report, Number(process.env.TEST_EXIT_CODE ?? execution.exitCode ?? 1));
  fs.mkdirSync(checkedPath(''), { recursive: true });
  fs.writeFileSync(checkedPath('summary.json'), JSON.stringify(summary, null, 2));
  const text = markdown(summary);
  fs.writeFileSync(checkedPath('summary.md'), text);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  console.log(`${summary.outcome}: ${summary.counts.passed}/${summary.counts.total} passed.`);
}
module.exports = { redact, summarize, markdown };
