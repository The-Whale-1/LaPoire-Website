'use strict';
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.js'), quiet: true });
const { checkedPath } = require('./paths.cjs');
const { redact, markdown } = require('./summarize.cjs');

async function main() {
  const summary = JSON.parse(fs.readFileSync(checkedPath('summary.json'), 'utf8'));
  const payload = { title: `La Poire daily tests: ${summary.outcome}`, outcome: summary.outcome, counts: summary.counts,
    generatedAt: summary.generatedAt, runUrl: summary.runUrl, artifactUrl: process.env.REPORT_ARTIFACT_URL || null,
    failures: summary.cases.filter(item => item.status === 'unexpected').map(({ title, project }) => ({ title, project })) };
  if (process.argv.includes('--dry-run')) {
    fs.writeFileSync(checkedPath('notification-preview.json'), JSON.stringify(payload, null, 2));
    console.log('Saved notification preview; no message sent.');
    return;
  }
  let sent = 0;
  if (process.env.REPORT_WEBHOOK_URL) {
    const url = new URL(process.env.REPORT_WEBHOOK_URL);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Report webhook must use HTTPS without URL credentials.');
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!response.ok) throw new Error(`Report webhook returned HTTP ${response.status}.`);
    sent++;
  }
  const smtpKeys = ['SMTP_HOST', 'REPORT_FROM', 'REPORT_TO'];
  if (smtpKeys.some(key => process.env[key])) {
    if (smtpKeys.some(key => !process.env[key])) throw new Error('SMTP_HOST, REPORT_FROM, and REPORT_TO must all be configured.');
    if (Boolean(process.env.SMTP_USER) !== Boolean(process.env.SMTP_PASSWORD)) throw new Error('SMTP authentication requires both username and password.');
    const port = Number(process.env.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP_PORT.');
    const secure = (process.env.SMTP_SECURE || 'false') === 'true';
    const transport = require('nodemailer').createTransport({ host: process.env.SMTP_HOST, port, secure,
      requireTLS: !secure, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 20000, greetingTimeout: 20000, socketTimeout: 30000 });
    try { await transport.sendMail({ from: process.env.REPORT_FROM, to: process.env.REPORT_TO,
      subject: payload.title, text: markdown(summary) + (payload.artifactUrl ? `\nReports: ${payload.artifactUrl}\n` : '') }); }
    finally { transport.close(); }
    sent++;
  }
  console.log(sent ? `Delivered report through ${sent} configured channel(s).` : 'No delivery channel configured. Report remains in the run summary and artifacts.');
}
if (require.main === module) main().catch(error => { console.error(redact(error.message)); process.exitCode = 1; });
module.exports = { main };
