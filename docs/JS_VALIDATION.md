# JavaScript execution evidence — 8 October 2026

Target: https://lapoire-stag.endlg.com/. Desktop Chromium, serial fresh browser
contexts, guest scope, zero automatic retries. Authentication is disabled by the
user's chosen initial scope. No order, payment, account creation, password reset,
profile/address save, complaint, or custom cake request was submitted.

## Framework and discovery

- Installed locked Playwright 1.64.0, Allure Playwright 3.13.0, and Allure Report 3.19.1.
- All **18 offline checks passed**, covering destinations, guest mutation scope,
  request isolation, safe reporting, zero-test/failed/flaky/healed outcomes, and
  ambiguity/strict-mode locator fallback handling.
- Discovery found **48 cases** in seven files: 38 public and 10 opt-in account checks.
- The focused guest empty-cart guard check passed before the full baseline.

## First complete local baseline

**31 passed, 7 failed, 10 skipped; 341.75 seconds.** Allure generated 48 current
results; JSON and Markdown summary counts agree. The failed exit code remained 1.
Evidence is preserved locally in `artifacts/js-initial-baseline/`.

The seven failures were investigated before publication:

- **Website:** Chocolates menu navigation opens `/list/undefined` rather than a
  valid category. The assertion remains a normal failure until the site is fixed.
- **Harness:** Cart reload reached its control before header hydration, giving
  the locator resolver only its short healing budget. Public diagnostics found
  no header at DOMContentLoaded, a visible cart icon about 1.4 seconds later, and
  one retained guest item. The page object now waits using the existing UI timeout
  before checking locator drift; exact item, quantity and price assertions remain.
- **Harness:** Five information-page checks rejected `/#` before clicking. The
  observed About Us link uses client navigation and reaches `/aboutus`. Tests now
  verify the actual click/result and matching visible content outside the footer.

The corrected six-case run completed with **4 passed and 2 failed**. CART-05 passed
the full retained product, quantity, unit price, and subtotal assertions. Stores,
Privacy Policy, and Contact Us passed. About Us and Terms & Conditions required
inspection of their actual content headings. The six-case results and Allure report
are preserved in `artifacts/js-corrected-six/`; these are separate from the baseline.

The earlier Python guest-cart persistence defect did not reproduce in the current
full CART-05 verification. The About Us page contains a substantive company history
under the accessible heading `About us`, so its oracle now ignores heading case
and requires `Who we are` body content. The Terms page contains a `Terms and
Conditions` title and a `Seventh: Payment Methods and Conditions` section. Its
oracle now checks both actual text values outside the footer. Both corrected
information cases passed in **20.8 seconds**, with no healing or retries. Their
Allure report and summary are preserved in `artifacts/js-information-verification/`.
The first cloud run is recorded below when completed.

Earlier interrupted guard diagnostics are separate local evidence, not a completed
baseline: `artifacts/js-guard-diagnostic/` and `artifacts/js-telemetry-diagnostic/`.
The harness initially treated third-party tracking writes as customer failures.
Observed draft-cart operations are now allowed only in guest contexts. Third-party
writes remain blocked and audited as ancillary traffic; risky requests and unknown
business API operations still fail. No business assertion was changed by this fix.

## Reports and recurring execution

Allure, Playwright HTML, JSON and Markdown reports are generated in `artifacts/js/`.
Screenshots, videos, traces and automatic DOM snapshots are disabled; report events
redact secrets and omit authenticated diagnostics. Raw browser-output directories
are excluded from cloud publication.

Source was published at commit `8c11dde10f7087a13f2d997ce1aa37f699493a93`.
The [first cloud run](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839846812)
completed with **37 passed, 1 failed, 10 skipped, 0 flaky, and 0 healed** in
202.2 seconds. The sole failed case is Chocolates opening `/list/undefined`.
All eight guest-cart cases and all five company information cases passed.
The failed test exit remained 1 and the workflow remained failed.

Allure generated 48 results; report generation, summary, artifact upload, and
the configured notification step succeeded. The downloaded
[report artifact](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839846812/artifacts/11576543769)
contains both HTML reports and matching summary counts, with no raw browser output
directory. It expires on 22 October 2026. Optional SMTP/webhook destinations are
not configured; no email or webhook delivery is claimed.
The [cloud framework checks](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839847013)
also passed all 18 offline tests and discovered the 48 cases.

## Dependency and discovery correction

The initial cloud install reported a transitive Handlebars advisory through Allure.
The lockfile now resolves Handlebars 4.7.10, preserving every direct dependency pin.
A clean locked install, zero-finding npm audit, all 18 offline checks, and discovery
of 48 cases passed. Patched Allure regenerated the original two executed information
results successfully in a separate ignored report directory.

Discovery now explicitly uses the list reporter. The previous command activated
configured reporters and could mix synthetic discovery records into a local result
directory. Fingerprints confirm the corrected discovery command leaves executed
Allure results unchanged. Contaminated local discovery evidence is preserved in
`artifacts/js-discovery-contamination-proof/`; it was never a cloud test report.
The first cloud report was generated in its separate fresh regression job and was
verified independently.

The fix was merged through [PR #1](https://github.com/The-Whale-1/LaPoire-Website/pull/1)
at commit `5ee4ddb69c122529bd0629d59b290d91278ec27e` after cloud framework checks passed.
The [final patched cloud regression](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37841095390)
completed with **37 passed, 1 failed, 10 skipped, 0 flaky, and 0 healed** in
194.5 seconds. Its sole failure remains Chocolates navigation to `/list/undefined`.
The cloud install reported zero vulnerabilities. Allure generation, summary, and
upload succeeded; the downloaded [final report artifact](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37841095390/artifacts/11577338407)
contains both HTML reports, matching 48-result Allure/JSON summaries, and no raw
browser-output directory. The original failed report remains separately available.

The saved heartbeat recurrence was inspected directly and runs at 09:00 Cairo
daily. A signed-out browser session prevented independently dispatching a manual
run; the published manual workflow definition is accepted. No settings or credentials
were changed during this UI inspection.

The workflow is configured for daily 06:00 Africa/Cairo and manual runs. A Codex
follow-up is active at 09:00 for daily reporting, failure analysis and test improvement.
Desktop follow-ups require the computer and app running; GitHub tests run independently.

Unverified scope: authenticated/customer flows, submitted orders or payments, mobile
layouts, Firefox/WebKit, production availability, and application deployment. This
repository contains tests, not the deployed application source.


## Daily review — 9 October 2026

The first desktop heartbeat arrived at 08:52 UTC (11:52 Cairo); this confirms a
review wakeup, while on-time 09:00 delivery is not established. At 08:57 UTC,
GitHub reported the live workflow active and zero `schedule` events. The expected
06:00 Cairo event was absent. The default-branch workflow and supported Cairo time
zone were present; the repository was active, public, and neither forked nor
archived. No root cause was established. Public API access could not inspect
private Actions administration settings.

The latest completed cloud report remained the October 8 run linked above:
**37 passed, 1 failed, 10 skipped, 0 flaky, 0 healed**. Job logs and the matching
48-result Allure/JSON artifact were checked again; the artifact was unexpired.
Its age was about 12 hours, below the 30-hour freshness threshold. Missing today's
scheduled event is reported separately from a stale completed run.

Added **CART-12**, verifying an increased guest quantity survives reload with
exact product identity, one row, quantity two, unchanged unit price, and doubled
subtotal. A locked install reported zero vulnerabilities; all 18 helper checks
passed; discovery found **49 cases (39 public, 10 optional authenticated)**.
Focused CART-03, CART-05, and CART-12 passed **3/3 in 49.6 seconds**, with zero
retries, flaky results, or healing. Allure generated the three actual results and
the summary preserved exit zero. The focused pass does not clear the separate
Chocolates defect or establish that the entire expanded suite passed.

The maintenance change moves the planned daily trigger to **06:07 Cairo**, following
[GitHub's recommendation to avoid the hourly scheduling peak](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
This is preventive; it does not establish the cause of today's missing event or
prove that future scheduled runs will execute. Verify the next actual `schedule`
event independently of any maintenance push run. Authentication remains disabled.

The active daily-review prompt now checks expected `schedule` events separately
from overall report freshness. A recent push or manual run cannot suppress a
missing-schedule alert; actual trigger and completion timestamps must be reported.
The configured 09:00 Cairo desktop recurrence and existing scope were preserved.

### Expanded cloud verification after PR #3

[PR #3](https://github.com/The-Whale-1/LaPoire-Website/pull/3) was merged at
`bf5640f513567f6c5d8fd13076cfcb78113ce029` after GitHub framework checks passed.
The [October 9 expanded cloud run](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37909670366)
was triggered by that **push**, not by the missing daily schedule. It completed
with **38 passed, 1 failed, 10 skipped, 0 flaky, and 0 healed** in 189.6 seconds.
CART-12 passed in cloud Chromium. All nine guest-cart cases passed; the sole failure
remains Chocolates opening `/list/undefined`. The failed exit code stayed 1.

Allure generation, summary, and artifact upload succeeded. The downloaded
[cloud report artifact](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37909670366/artifacts/11605339082)
contains both HTML reports and matching 49-result Allure/JSON summaries, with no
raw browser-output directory. It expires on 23 October 2026. Local evidence is
preserved at `artifacts/js/daily-2026-10-09/cloud-regression.zip`; the earlier focused
and cloud evidence remains separate. The cloud install reported zero vulnerabilities.

The new 06:07 Cairo cron is verified on `main`. Its next actual scheduled event,
expected on 10 October, remains unverified. This fresh push run verifies expanded
coverage and reporting; it does not establish that scheduling works.


## Search no-result maintenance — 10 October 2026

A guarded anonymous staging probe confirmed that the safe query
`lapoire-qa-no-product-20261010-7e6c9b` navigates to its catalog search route,
shows exact visible `No Results Found`, and renders zero catalog cards. A second
search for Raspberry Gateau restored one matching catalog card and removed the
empty state. The probe had no blocked business requests; third-party telemetry
and unknown external writes remained suppressed and audited. Public observations
are preserved in `artifacts/js/daily-2026-10-10/search-empty-probe/`.

Added SEARCH-02 to normal public regression coverage, with the observed empty-state
locator in StorefrontPage and the business assertions in catalog.spec.js. It starts
with populated cards, verifies the exact search keyword and zero stale cards, then
recovers through known-product search and checks one exact product link, matching
detail name, positive catalog/detail price agreement, and default quantity one.
No known failure was disabled or healed; authentication remains disabled.

Two initial harness issues were retained separately. The standalone probe first
used Playwright's default five-second expect timeout outside the configured runner;
its readiness setup was corrected to use the existing 20-second UI budget. The
first focused validation produced **1 passed, 1 failed, 0 skipped, 0 flaky, and
0 healed** in 47.4 seconds, with exit one and both reports generated. The new URL
predicate matcher timed out even though its reported URL matched the expected
route and keyword. Inspection of the installed Playwright matcher showed that
predicate matching delegates to waitForURL and waits for page load. The test now
uses the existing catalog-route assertion and polls the same exact keyword, while
preserving every empty-state, product, quantity, and price assertion. The initial
failed run is preserved in
`artifacts/js/daily-2026-10-10/search-initial-validation/`.

Final verification completed `npm ci` with zero vulnerabilities, **18 passing
offline checks**, and discovery of **50 cases in seven files: 40 public and 10
optional authenticated cases**. Focused Chromium SEARCH-01 and SEARCH-02 passed
**2/2 in 32.9 seconds**, with **0 failed, 0 skipped, 0 flaky, and 0 healed**, zero
retries, and exit zero. Allure generated exactly two actual results; its statistic
and JSON summary agree, and both HTML reports exist. Final evidence is preserved
in `artifacts/js/daily-2026-10-10/search-regression/`. This focused result does not
establish a full 50-case cloud pass or repair the deployed Chocolates category.
The website source is absent from this repository.

## Daily cloud and schedule review — 10 October 2026

The heartbeat arrived at 08:40:47 UTC (11:40:47 Cairo). The saved automation is
ACTIVE with a 09:00 Cairo daily recurrence; observed delivery is separate from
that configuration. The desktop host and Codex app must be available for review,
while GitHub execution is independent of them.

Current main configures cron `7 6 * * *` with `Africa/Cairo`. The workflow is active,
but the event=schedule query returned zero runs: today's expected 06:07 Cairo
scheduled event was absent about 5 hours 34 minutes later. Its cause remains
unconfirmed. At review start, October 9 attempt 2 was about 20 hours 33 minutes old,
within the 30-hour freshness limit. That recent rerun did not clear the missing
scheduled-event alert.

Started a recovery rerun through the authorized GitHub connection. [Attempt 3](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37909670366/job/114175069516)
started at 08:44:10 UTC and completed at 08:47:55 UTC (11:47:55 Cairo). The original
workflow event remains push; this is a recovery rerun, not a schedule event.
The current main test source executed **49 cases: 38 passed, 1 failed, 10 skipped,
0 flaky, and 0 healed** in 176.620 seconds. Authentication remained disabled.
Chocolates again reached `/list/undefined`; the test exit code remained 1. There
were no runner infrastructure errors. The previous investigation identified a
menu category reference whose API response is null, followed by unguarded slug
routing; application source/catalog configuration is still required for repair.

Allure, summary and artifact upload succeeded. The [attempt-3 artifact](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37909670366/artifacts/11664657822)
expires on 24 October. Its downloaded ZIP SHA256 matches GitHub; summary,
flattened Playwright results, 49 raw Allure results and 49 generated Allure cases
agree. Both HTML reports are present; no raw browser-output files were uploaded.
Evidence is preserved in
`artifacts/js/daily-2026-10-10/cloud-recovery/cloud-attempt-3.zip`.

The recovery produces fresh cloud results while daily scheduling remains
unresolved. The new SEARCH-02 case is verified separately above; it is not part
of this 49-case cloud run. A complete 50-case cloud pass is not established.
