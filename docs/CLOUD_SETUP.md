# Cloud execution and result delivery

The JavaScript test ecosystem is published to [The-Whale-1/LaPoire-Website](https://github.com/The-Whale-1/LaPoire-Website) on `main`. GitHub Actions executes its browser tests without a laptop. The first cloud run completed, and its Allure/Playwright reports and summary were verified. A real website defect remains a failed test. The existing Python suite and its reports stay separate.

## Activation status

Source publication succeeded on 2026-10-08 at [commit 8c11dde](https://github.com/The-Whale-1/LaPoire-Website/commit/8c11dde10f7087a13f2d997ce1aa37f699493a93). The [first regression run](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839846812) completed with **37 passed, 1 failed, 10 skipped, 0 flaky, and 0 healed**, out of 48 cases. Its test duration was 202.204 seconds. The failure is Chocolates category navigation reaching `/list/undefined`; the failed workflow correctly preserves this staging defect. The 10 skipped cases are outside the enabled public scope.

Allure generation, summary generation, and artifact upload succeeded. The summary matched the test results, and the downloaded [report artifact](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839846812/artifacts/11576543769) was verified to contain both HTML reports and 48 Allure results, with no raw `test-results` directory. The artifact is `lapoire-js-37839846812-1`, ID `11576543769`, and expires on 2026-10-22.

The [offline framework checks](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839847013) succeeded: 18 unit checks passed and 48 Playwright cases were discovered. The notification step also succeeded with no optional delivery destination configured; this confirms the Actions/chat reporting path, not SMTP or webhook receipt.

This maintenance revision moves the daily schedule to 06:07 Cairo with the same `Africa/Cairo` timezone. It takes effect after merge to `main`; the next intended scheduled event on 2026-10-10 remains unverified. The Codex heartbeat `la-poire-daily-quality-review` is ACTIVE at a configured 09:00 Cairo daily in this chat. Its first review arrived on 2026-10-09 at 08:52:09 UTC (11:52 Cairo), so delivery precisely at the configured time has not been verified. The initial scope is public browsing/cart journeys. Authentication is disabled, and email/webhook delivery remain optional extensions.

| Component | Current state | Remaining verification |
| --- | --- | --- |
| Source code | Published JavaScript POM, Playwright tests, locked npm dependencies | Publication verified at the linked commit |
| Daily regression | Maintenance revision: 06:07 in `Africa/Cairo`, effective after merge | Verify the next intended scheduled event on 2026-10-10 |
| Run on demand | Manual workflow definition accepted on `main` | A manual dispatch has not yet been independently verified |
| Allure and Playwright reports | Verified: 48 Allure results, both HTML reports, matching summary, uploaded/downloaded artifact | First cloud reporting path verified; artifact expires 2026-10-22 |
| Authenticated cases | Disabled for the initial public browsing/cart scope | Optional later: configure a dedicated staging account |
| Delivered report | Initial result reported through GitHub Actions and this Codex chat | First desktop review arrived 11:52 Cairo on 2026-10-09; no SMTP/webhook receipt claimed |
| Optional email/webhook | SMTP email and/or generic JSON webhook | Optional later: configure a destination and verify delivery |
| Ongoing Codex maintenance | ACTIVE heartbeat: configured 09:00 Cairo daily in this chat | First review observed at 11:52 Cairo on 2026-10-09; computer and Codex app must be running |

The selected repository is public. Its Actions artifacts are visible to signed-in users with repository read access. Treat source, run logs, and artifacts as public evidence. The initial workflow therefore exercises public browsing/cart journeys and does not receive account credentials. Account/customer evidence would need restricted handling before authenticated coverage is enabled.

The [patched full regression](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37841095390), after [PR #1](https://github.com/The-Whale-1/LaPoire-Website/pull/1), also completed with **37 passed, 1 failed, 10 skipped, 0 flaky, and 0 healed** in 194.5 seconds. Dependency installation reported zero vulnerabilities. Allure generation, summary and upload succeeded; the downloaded [latest report](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37841095390/artifacts/11577338407) contains both HTML reports with matching 48-result counts. Chocolates navigation remains the sole website failure. The saved heartbeat recurrence was checked directly: daily 09:00 Cairo. Manual UI dispatch remains unverified because the inspected browser session was signed out; no login or settings change was attempted.

Schedule audit on 2026-10-09 at 11:57 Cairo found zero `schedule` events: the expected 06:00 Cairo run under the previous cron was missing. Public API metadata reported the workflow `active`, with the workflow on default branch `main` and the visible scheduling prerequisites satisfied; the repository was recently active, not a fork, and not archived. The cause is unconfirmed. The latest completed cloud run was about 12 hours old, below the 30-hour freshness limit. Repository Actions administration settings were unavailable through public API reads (HTTP 401), and manual dispatch could not be verified in the inspected signed-out browser session. [GitHub documents possible schedule delays or dropped events at hourly peaks](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule); moving execution seven minutes later is preventive, and does not establish or repair a confirmed root cause.

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

## Verify activation and run on demand

1. Inspect the linked first cloud run and report artifact. Source publication, cloud execution, report generation, summary counts, and artifact contents are verified. The remaining Chocolates navigation defect stays visible. Future pushes to `main` start a live run immediately. Continue excluding credentials, `.env.js`, generated reports, `.venv`, and discovery snapshots from source.
2. Keep the defaults for the initial scope: `chromium`, the full public suite, and `RUN_AUTH_TESTS=false`. No account or email secret is needed. Configure optional extensions only when their intended fixtures and destinations exist.
3. For future runs, check the test step, run summary, and `lapoire-js-<run id>-<attempt>` artifact when the run completes. The initial run verified that a genuine staging defect makes the workflow fail while its report remains downloadable.
4. To run on demand, open **Actions → La Poire daily regression → Run workflow**. Choose `main`, `all`, and `chromium`. Manual runs from other branches are intentionally skipped by the live job; pull requests receive offline framework checks. The workflow requests `contents: read` and does not push source changes.
5. Verify that the summary/report links open and Codex can read the completed run. If email/webhook delivery is configured later, verify receipt separately.
6. After this maintenance revision is merged to `main`, verify the next intended 06:07 Cairo `schedule` event on 2026-10-10. A push run does not verify scheduling. The heartbeat remains configured for 09:00 Cairo; its first review arrived at 11:52 Cairo on 2026-10-09, so continue checking actual delivery times.

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

This maintenance revision uses `cron: '7 6 * * *'` with `timezone: Africa/Cairo`, scheduling execution at 06:07 Cairo and following local daylight-saving changes. The timezone is unchanged. The preventive move away from the hourly peak takes effect after merge to `main` and has not yet been verified by a `schedule` event. It is not a confirmed fix for the missing October 9 event. GitHub supports IANA time zones directly; see [workflow schedule syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule).

The regression workflow allows one active staging run at a time and does not cancel an active run when another is requested. GitHub concurrency may replace older pending runs; this is a guard against overlap, not an unlimited run queue. Avoid starting a local authenticated run while cloud tests use the same account.

GitHub can delay or drop scheduled jobs during heavy load, and schedules run only from the default branch. Public-repository schedules may be disabled after 60 days without repository activity. These limits are documented in [GitHub schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). A separate monitor must alert if the last completed regression is over 30 hours old; a test job cannot notify you about a schedule event that never started.

Dependency installation or browser startup failures still produce a failed workflow. Summary/report/upload/notification steps are attempted after test failure when their prerequisites are available. If dependency installation does not complete after a successful checkout, a shell-only fallback writes a failed setup summary and JSON artifact without requiring npm packages. Allure and external delivery may be unavailable for that run. If checkout fails, GitHub's job logs remain the source of infrastructure diagnostics. A failed test exit remains a failed workflow even when report generation and email succeed.

The live suite targets `https://lapoire-stag.endlg.com/`. Production uptime is a separate monitoring target and has not been configured by this staging framework. Tests detect failures in the covered journeys; fixing application defects requires access to the website's source, deployment process, and service owners.
