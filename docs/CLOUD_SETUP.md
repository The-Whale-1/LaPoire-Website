# Cloud execution and result delivery

The JavaScript test ecosystem runs on GitHub Actions after these files are published to the repository's default branch. The selected repository is [The-Whale-1/LaPoire-Website](https://github.com/The-Whale-1/LaPoire-Website), using `main`. It does not need a laptop to execute the browser tests. A repository and workflow file on disk alone do not activate cloud execution. The existing Python suite and its reports stay separate.

## Activation status

The workflow is prepared locally. Cloud publication and a first completed workflow must be verified before calling this an active service. The initial scope is public browsing/cart journeys, with results in GitHub Actions and this Codex chat. Authentication is disabled; email and webhook delivery are optional extensions. Record the first run URL here when activation is complete.

| Component | Prepared behavior | Required for activation |
| --- | --- | --- |
| Source code | JavaScript POM, Playwright tests, locked npm dependencies | Publish reviewed source to the selected repository |
| Daily regression | Every day at 06:00 in `Africa/Cairo` | Enable GitHub Actions; workflow must be on the default branch |
| Run on demand | Actions → La Poire daily regression → Run workflow | Select the default branch, suite, and desktop browser |
| Allure and Playwright reports | Reports, JSON results, and Markdown summary attached to each run | Complete the first cloud run and verify its artifact |
| Authenticated cases | Disabled for the initial public browsing/cart scope | Optional later: configure a dedicated staging account |
| Delivered report | GitHub run summary/artifacts plus Codex chat review | Verify the first cloud summary and recurring review |
| Optional email/webhook | SMTP email and/or generic JSON webhook | Optional later: configure a destination and verify delivery |
| Ongoing Codex maintenance | Separate review of failures, locator drift, and coverage | An enabled Codex follow-up with access to the repository and reports |

The selected repository is public. Its Actions artifacts are visible to signed-in users with repository read access. Treat source, run logs, and artifacts as public evidence. The initial workflow therefore exercises public browsing/cart journeys and does not receive account credentials. Account/customer evidence would need restricted handling before authenticated coverage is enabled.

## Configure variables and secrets once

Open repository **Settings → Secrets and variables → Actions**. Variables hold non-sensitive options; secrets hold credentials and notification endpoints. Never upload local `.env` files, browser authentication state, or generated reports as source code. Enter secret values directly in GitHub's secret form.

| Repository variable | Default | Accepted value/purpose |
| --- | --- | --- |
| `DAILY_SUITE` | `all` | `all` or `smoke` |
| `DAILY_PROJECT` | `chromium` | `chromium`, `firefox`, `webkit`, or `all`; Chromium is the baseline |
| `RUN_AUTH_TESTS` | `false` | Set to `true` after staging credentials are configured |
| `SELF_HEALING` | `true` | Enable the approved locator fallback mechanism |
| `SELF_HEALING_STRICT` | `false` | Set to `true` to fail any case that needs a fallback, while retaining its diagnostic evidence |
| `TEST_CITY` | Framework default | Exact delivery area shown by staging, if a fixed area is required |
| `CHECKOUT_CITY` | Framework default | Area compatible with the staging account's saved addresses |
| `TEST_PRODUCT` | Framework default | Verified in-stock fixture product |
| `SMTP_PORT` | `587` | SMTP port; usually `587` for STARTTLS or `465` for implicit TLS |
| `SMTP_SECURE` | `false` | `true` for implicit TLS, usually on port `465` |

| Repository secret | When needed |
| --- | --- |
| `TEST_EMAIL`, `TEST_PASSWORD` | Dedicated staging account for authenticated tests |
| `REPORT_WEBHOOK_URL` | HTTPS endpoint that accepts the framework's generic JSON summary |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` | Email server and credentials |
| `REPORT_FROM`, `REPORT_TO` | Approved sender address and report recipient address(es) |

The webhook is generic JSON; it may require an adapter for a service that expects its own message format. SMTP email uses the configured mail provider. Neither channel can deliver a report until its credentials and destination exist. GitHub's run summary and downloadable artifacts are available independently of email/webhook configuration. GitHub's own workflow failure notifications are controlled by your GitHub notification preferences.

Authentication being disabled is visible as skipped authenticated cases. A guest-only green run is evidence for its executed scope, not verification of account and checkout behavior. Enabling authentication with missing or invalid fixtures should fail with a setup diagnostic, rather than silently claiming complete coverage.

## First cloud run

1. Publish the prepared source, including `package-lock.json` and `.github/workflows/`, to the selected repository's `main` branch. Exclude local credentials, reports, `.venv`, and discovery snapshots. A push to `main` starts a live run immediately.
2. Ensure GitHub Actions is enabled and allowed to use the pinned official GitHub actions. The workflow requests `contents: read` and does not push source changes.
3. Start with the defaults: `chromium`, the full public suite, and `RUN_AUTH_TESTS=false`. No account or email secret is needed for the initial scope. Configure optional extensions only when the intended fixtures and destinations exist.
4. Open **Actions → La Poire daily regression → Run workflow**. Choose the default branch, `all`, and `chromium`. Manual runs from other branches are intentionally skipped by the live job; pull requests receive offline framework checks.
5. Check the test step, run summary, and `lapoire-js-<run id>-<attempt>` artifact. Verify that any genuine staging defect makes the workflow fail while its report remains downloadable.
6. Verify the summary/report links open and that Codex can read the run. If optional email/webhook delivery is configured later, verify receipt. Confirm the next daily run appears before considering scheduling activated.

The source workflow pins verified official action revisions: [checkout v7.0.1](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1), [setup-node v7.1.0](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1), and [upload-artifact v7.0.2](https://github.com/actions/upload-artifact/commit/cf430e030ddbb5b0abf93d22962f4752f3646cd9), checked on 2026-10-08. Update these deliberately when maintaining the framework.

## Run any time

Use GitHub's **Run workflow** button to run without a local environment. Pushes to `main` also run the live suite after code changes. `smoke` selects cases tagged `@smoke`; `all` executes the enabled suite. The baseline is desktop Chromium. Firefox, WebKit, and `all` are optional cross-browser choices that need their own execution verification. Mobile layouts are not yet supported by these page objects. Tests execute serially, which also protects a shared account if authenticated coverage is added later.

With GitHub CLI authenticated to the chosen repository, the equivalent command is:

```bash
gh workflow run daily-regression.yml --ref <default-branch> -f suite=all -f project=chromium
gh run list --workflow daily-regression.yml --limit 5
gh run watch <run-id> --exit-status
gh run download <run-id> --name lapoire-js-<run-id>-<attempt> --dir downloaded-report
```

Replace the placeholders with the repository's real branch and run values. GitHub's workflow UI lists them. To review the downloaded Playwright report, run `npx playwright show-report <path-to-playwright-report>`. The Allure HTML artifact must be served with a local HTTP server if the browser disallows its JavaScript/data files through a `file:` URL.

Each run keeps artifacts for 14 days. Download evidence before expiry if longer retention is needed. Allure HTML is generated from that run's results; cross-run Allure history is not configured. GitHub run history and summaries still retain the outcome of each execution subject to repository retention settings.

## Schedule and operational limits

The daily schedule uses `cron: '0 6 * * *'` with `timezone: Africa/Cairo`, so it follows Cairo local time and daylight-saving changes. GitHub now supports IANA time zones directly; see [workflow schedule syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule).

The regression workflow allows one active staging run at a time and does not cancel an active run when another is requested. GitHub concurrency may replace older pending runs; this is a guard against overlap, not an unlimited run queue. Avoid starting a local authenticated run while cloud tests use the same account.

GitHub can delay or drop scheduled jobs during heavy load, and schedules run only from the default branch. Public-repository schedules may be disabled after 60 days without repository activity. These limits are documented in [GitHub schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). A separate monitor must alert if the last completed regression is over 30 hours old; a test job cannot notify you about a schedule event that never started.

Dependency installation or browser startup failures still produce a failed workflow. Summary/report/upload/notification steps are attempted after test failure when their prerequisites are available. If dependency installation does not complete after a successful checkout, a shell-only fallback writes a failed setup summary and JSON artifact without requiring npm packages. Allure and external delivery may be unavailable for that run. If checkout fails, GitHub's job logs remain the source of infrastructure diagnostics. A failed test exit remains a failed workflow even when report generation and email succeed.

The live suite targets `https://lapoire-stag.endlg.com/`. Production uptime is a separate monitoring target and has not been configured by this staging framework. Tests detect failures in the covered journeys; fixing application defects requires access to the website's source, deployment process, and service owners.
