# La Poire quality ecosystem

JavaScript + Playwright + Page Object Model + Allure for [La Poire staging](https://lapoire-stag.endlg.com/). The daily schedule is **06:07 Africa/Cairo**. Tests also run on test code changes to main and on demand through GitHub Actions.

The initial scope is public browsing, delivery, search, product details, categories, sorting/filtering, language, guest cart, and login form reachability. Account and checkout-review checks require explicit opt-in and staging fixtures. No orders, payments, account creation, password resets, profile saves, complaints, or cake requests are submitted. This project detects site defects; it does not contain the deployed website source and cannot promise zero downtime.

## Run in the cloud

Open [GitHub Actions](https://github.com/The-Whale-1/LaPoire-Website/actions), choose **La Poire daily regression**, and select **Run workflow**. Choose all tests or smoke and a browser. Daily execution uses Chromium. The job summary contains counts and failures; its **Artifacts** section contains Allure and Playwright HTML reports. Download and extract the artifact, then serve its report folder to open the HTML.

This repository is public. Its Actions artifacts are visible to signed-in users with repository read access. Credentials belong in GitHub secrets. Keep generated reports out of source control.

See [cloud configuration](docs/CLOUD_SETUP.md), [operation and maintenance](docs/ECOSYSTEM.md), and [execution evidence](docs/JS_VALIDATION.md).

## Run locally

Use Node.js 22 or newer. In PowerShell, use npm.cmd/npx.cmd if script policy blocks npm.

```sh
npm ci
npx playwright install chromium
npm run test:unit
npm run test:list
npm run test:smoke
npm test
# Generate reports even when tests fail.
npm run report:js
npm run report:summary
npm run report:open
```

Defaults work without credentials. Copy `.env.js.example` to the ignored `.env.js` for optional JavaScript settings. The existing Python `.env` is preserved and is not loaded by the JavaScript suite. JavaScript defaults to `RUN_AUTH_TESTS=false` even when credentials exist.

## Self-healing and reporting

Page objects prefer semantic locators and stable CSS module prefixes. If a declared primary locator disappears, self-healing can use only an explicit equivalent fallback with exactly one visible match. Every fallback creates a report attachment and makes the result summary **DEGRADED**. Ambiguous matches and broken business assertions fail. Set `SELF_HEALING_STRICT=true` to fail on any fallback, or `SELF_HEALING=false` to disable it. Default retries are zero; a repeat must never erase the original failure evidence.

Screenshots, traces, and video are disabled to limit captured personal data. Report events redact configured secrets and contact details; authenticated diagnostics are suppressed. Allure, JSON, Playwright HTML, and daily summaries are generated under `artifacts/js/`. The runner clears only designated current outputs.

Daily report delivery is GitHub Actions plus the scheduled follow-up in this Codex chat. The follow-up investigates defects, tracks missing runs, and adds meaningful regression coverage. Desktop follow-ups need the computer and app running; GitHub test execution works independently. Optional SMTP and generic HTTPS webhook integrations are available if a delivery channel is configured.

## Layout

| Path | Purpose |
| --- | --- |
| e2e/pages/ | Page objects and centralized UI interactions |
| e2e/tests/ | Business assertions and regression cases |
| e2e/fixtures/, e2e/support/ | Isolation, destination guards, healing, privacy |
| e2e/unit/, scripts/js/unit/ | Offline harness and report verification |
| playwright.config.js | Browser projects and reporting |
| scripts/js/ | Cleanup, report generation, summary and delivery |
| .github/workflows/ | Daily/manual regression and pull-request checks |
| AGENTS.md | Recurring maintenance rules |

Existing Python code and evidence are preserved locally. Its original guide is [docs/PYTHON_SUITE.md](docs/PYTHON_SUITE.md); `npm run report:python` retains its Allure generator. JavaScript uses separate output directories.
