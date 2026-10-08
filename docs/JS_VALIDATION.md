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

Cloud publication and a first cloud report artifact are still being verified.
The workflow is configured for daily 06:00 Africa/Cairo and manual runs. A Codex
follow-up is active at 07:00 for daily reporting, failure analysis and test improvement.
Desktop follow-ups require the computer and app running; GitHub tests run independently.

Unverified scope: authenticated/customer flows, submitted orders or payments, mobile
layouts, Firefox/WebKit, production availability, and application deployment. This
repository contains tests, not the deployed application source.
