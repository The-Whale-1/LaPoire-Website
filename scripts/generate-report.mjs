import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const featureRun = process.argv.includes('--new');
const reportRelative = featureRun ? 'artifacts/new-feature-api-report' : 'allure-report';
const target = resolve(root, reportRelative);
const resultsDir = join(root, featureRun ? 'artifacts/new-feature-api-results' : 'allure-results');
const results = readdirSync(resultsDir).filter(name => name.endsWith('-result.json')).map(name => JSON.parse(readFileSync(join(resultsDir, name), 'utf8')));
if (!results.length) throw new Error('Run pytest before generating the report.');
// Delete only this project's generated report, never a junction or linked folder.
if (target !== resolve(root, reportRelative)) throw new Error('Unexpected report output.');
if (existsSync(target)) {
  if (lstatSync(target).isSymbolicLink() || realpathSync(target).toLowerCase() !== join(realpathSync(root), reportRelative).toLowerCase()) {
    throw new Error('Report directory resolves outside the intended workspace folder.');
  }
  rmSync(target, { recursive: true, force: true });
}
execFileSync(process.execPath, [join(root, 'node_modules/allure/cli.js'), 'generate', resultsDir, '--output', target, '--name', featureRun ? 'La Poire new feature filters' : 'La Poire happy-path regression'], { cwd: root, stdio: 'inherit', windowsHide: true });
const summary = JSON.parse(readFileSync(join(target, 'summary.json'), 'utf8'));
if (summary.stats.total !== results.length || (summary.stats.passed || 0) !== results.filter(result => result.status === 'passed').length) {
  throw new Error('Generated report does not match the current pytest results.');
}
console.log(`Generated current Allure report: ${summary.stats.total} cases, ${summary.stats.passed || 0} passed.`);
