'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { root, checkedPath, reset } = require('./paths.cjs');
for (const folder of ['allure-results', 'playwright-report', 'test-results', 'allure-report']) reset(folder);
for (const file of ['results.json', 'summary.json', 'summary.md', 'notification-preview.json']) reset(file);
fs.mkdirSync(checkedPath(''), { recursive: true });
const run = spawnSync(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit', windowsHide: true,
});
const exitCode = run.status ?? 1;
fs.writeFileSync(checkedPath('execution.json'), JSON.stringify({ exitCode, completedAt: new Date().toISOString(), signal: run.signal || null }, null, 2));
if (run.error) console.error('Playwright could not start. Install dependencies with npm ci.');
process.exitCode = exitCode;
