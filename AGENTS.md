# La Poire quality ecosystem

This repository tests https://lapoire-stag.endlg.com/ using JavaScript, Playwright,
page objects, and Allure. The deployed website source is not in this repository.
Existing Python tests in the local workspace are legacy coverage; preserve them.

Use `npm ci`, `npm run test:unit`, `npm run test:list`, and `npm test` for verification.
Generate `npm run report:js` and `npm run report:summary` even after test failures.
Evidence and generated reports belong under the ignored `artifacts/js/` directory.
Never commit secrets, .env files, browser storage, downloaded reports, or customer data.

Keep page interactions in `e2e/pages/` and business assertions in `e2e/tests/`.
Prefer semantic locators; keep stable CSS module prefixes centralized when controls
have no accessible name. Never weaken assertions, silently skip a known defect, or
change expected totals simply to obtain a green run. Record test harness failures,
website defects, missing fixtures, and runner outages separately.

Self-healing may choose only an explicitly declared equivalent locator. Record every
fallback. Ambiguous matches fail. Preserve all business assertions. Never heal a
price, cart count, URL, payment state, or expected outcome.

Authorized recurring scope: public browsing, search, categories, delivery selection,
guest cart, and client-side validation. Authentication remains disabled by default.
No order, charge, account creation, password reset, profile/address save, complaint,
or custom cake request may be submitted by this suite. Do not inject shared-server
faults or load. No site code deployment is authorized by a test maintenance request.

Daily results must include passed, failed, skipped, flaky, and healed counts and a
link to the cloud run. Preserve a failed exit code. Investigate first, add a meaningful
regression test for confirmed defects, and verify harness changes before publishing.
For maintenance edits, use a codex/ branch and reviewable pull request. Attaching a
pull request to the current Codex chat is required after creating it.
