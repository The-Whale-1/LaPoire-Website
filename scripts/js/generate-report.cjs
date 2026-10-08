'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { root, checkedPath, reset } = require('./paths.cjs');
const resultsDir = checkedPath('allure-results');
if (!fs.existsSync(resultsDir)) throw new Error('No current JavaScript Allure results. Run npm test first.');
const results = fs.readdirSync(resultsDir).filter(name => name.endsWith('-result.json'));
if (!results.length) throw new Error('No test results were produced; inspect the run setup failure.');
reset('allure-report');
const report = spawnSync(process.execPath, [path.join(root, 'node_modules/allure/cli.js'), 'generate', resultsDir,
  '--output', checkedPath('allure-report'), '--name', 'La Poire JavaScript regression'], { cwd: root, stdio: 'inherit', windowsHide: true });
if (report.status !== 0) process.exit(report.status || 1);
const summary = JSON.parse(fs.readFileSync(checkedPath('allure-report/summary.json'), 'utf8'));
if (summary.stats.total !== results.length) throw new Error('Allure report count differs from this run.');
console.log(`Generated Allure report for ${results.length} results.`);
