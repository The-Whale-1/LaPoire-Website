# La Poire happy-path regression

Latest headless rerun and harness enhancements: [execution results](docs/TEST_ENHANCEMENTS.md). The suite now includes 45 offline client-validation tests (119 cases total); two reproducible website failures remain.

New feature plans: [144-case catalog](docs/NEW_FEATURE_CASES.md), [setup and fixture requirements](docs/NEW_FEATURE_SETUP.md), and [execution evidence](docs/NEW_FEATURE_VALIDATION.md). The new filter module adds 22 API checks; the catalog distinguishes specifications from automated coverage.

Python Playwright + pytest tests for https://lapoire-stag.endlg.com/, with Allure 3 HTML reports and VS Code test discovery/debugging. Tests exercise the real staging UI. There are no mocked catalog, login, or cart responses.

The virtual environment, Chromium, and report generator have already been installed in this workspace. The supplied credentials are configured in the ignored local `.env`; the example file and test code contain no password. Do not commit `.env`, authentication state, discovery snapshots, or reports.

## Run now

Open this folder in VS Code. In its PowerShell terminal:

```powershell
.\.venv\Scripts\python.exe -m pytest --headed
npm.cmd run report
npm.cmd run report:open
```

The pytest exit code stays nonzero if staging has a defect. Generate the report even after a failed run. Allure results appear in `allure-results/`; the HTML report is in `allure-report/`. The generator uses Node.js and does not require Java.

The report command replaces this project's generated report directory and verifies its counts against current pytest results. Baseline evidence is kept separately in `artifacts/website-baseline/`. The latest monitored headed run had **50 passed, 2 failed, 0 skipped/errors** out of 52 cases; see [docs/VALIDATION.md](docs/VALIDATION.md) for the remaining website defects and verified improvements.

```powershell
# Quick core journeys
.\.venv\Scripts\python.exe -m pytest -m smoke

# Watch browser interactions
.\.venv\Scripts\python.exe -m pytest --headed

# One area or test
.\.venv\Scripts\python.exe -m pytest tests/test_cart.py
.\.venv\Scripts\python.exe -m pytest -k test_login --headed

# Validate code without contacting staging
.\.venv\Scripts\python.exe -m ruff check config.py conftest.py pages tests
.\.venv\Scripts\python.exe -m pytest --collect-only -q

# Offline API-client regression checks (no browser required)
.\.venv\Scripts\python.exe -m pytest -m unit --alluredir=artifacts/unit-results
```

Each command starts a fresh report result set. To preserve a separate run, pass `--alluredir=artifacts/my-run`. Run authenticated tests serially with this shared account; browser contexts isolate cookies but the server still shares the account's cart.

## VS Code

Accept the recommended Python, Python Debugger, and Ruff extensions. Select `.venv\Scripts\python.exe` with **Python: Select Interpreter** if an interpreter was previously selected for this folder. The Testing panel discovers pytest cases and supports running/debugging individual cases. F5 starts **Debug pytest (visible browser)**. **Terminal → Run Task** provides regression, smoke, generate-report, and open-report tasks.

## Fresh checkout setup

Use Python 3.13 or 3.14 and Node.js 22 or newer, with npm available. In a new checkout:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
npm.cmd ci
Copy-Item .env.example .env
```

Fill `TEST_EMAIL` and `TEST_PASSWORD` in `.env`. `scripts/setup.ps1` performs the same setup if local PowerShell policy already allows scripts. Environment variables override `.env`. The suite restricts its destination to the named staging host.

At startup, every browser context grants location access to the staging website automatically. Playwright supplies repeatable Cairo coordinates (`TEST_LATITUDE=30.0444`, `TEST_LONGITUDE=31.2357`); these are simulated test coordinates, not your computer's actual location. No manual click on the browser's **Allow** prompt is needed. The website popup is handled separately: the suite opens its dropdown, chooses the first available area, and clicks **Select**. Set `TEST_CITY` to an exact displayed area, such as `El Haram`, to choose a specific area; leave it blank to choose any available area. Delivery persistence checks use the area actually selected. Checkout continues to use existing saved profile addresses.

`TEST_PRODUCT` must be an in-stock product in Gateaux; the verified default is `La Poire Deluxe Gateaux`. A catalog change can require updating it. See [Playwright geolocation and permissions](https://playwright.dev/python/docs/emulation#geolocation) for the browser setup.

Checkout cases select `CHECKOUT_CITY` (default `El Haram`) so the existing saved addresses are eligible. Other cases keep `TEST_CITY`/first-available behavior. If no saved address is eligible, delivery checkout fails with a fixture diagnostic instead of silently skipping. The wishlist test accepts the account's valid empty state and checks product links/prices when populated; it does not modify the wishlist.

The suite explicitly waits for catalog range metadata and loaded detail prices, checks catalog/detail/cart price consistency, validates full-cart quantity/price, adds two units from product details, and checks guest checkout requires login. In headed mode, let one run finish before starting another browser inspection or manually moving the browser pointer, because menu and product controls react to hover.

## Structure

| File/folder | Purpose |
| --- | --- |
| `pages/storefront.py` | Page objects; centralized selectors and price parsing |
| `config.py` | Environment configuration and staging restriction |
| `pages/cake_api.py` | Read-only GraphQL client and strict response validation |
| `tests/test_cake_api_helpers.py` | Offline response, query, and authorization-header regression checks |
| `conftest.py` | Isolated browsers, authentication, timeouts, report evidence |
| `tests/test_storefront.py` | Home, categories, information, search, login, language |
| `tests/test_catalog.py` | Price sorting and filtering |
| `tests/test_cart.py` | Guest add/remove, quantities, totals, persistence, full cart |
| `tests/test_account.py` | Profile, address/order/request/complaint tabs, logout, saved wishlist |
| `tests/test_checkout.py` | Saved addresses, summary arithmetic, delivery/pickup payment review |
| `tests/test_custom_cake.py` | Customisation, preview, valid pickup date |
| `docs/COVERAGE.md` | Coverage map and remaining happy paths |
| `docs/VALIDATION.md` | Execution results and observed staging defects |

Many website icons and custom buttons lack accessible names. The page objects use semantic locators when available and CSS-module name prefixes otherwise, excluding generated hash suffixes. Locator changes belong in the page objects. Tests wait for observable UI outcomes; no fixed sleeps or automatic reruns mask failures.

Guest carts use fresh contexts. Account pages are read without saving profile changes. Checkout uses existing saved addresses. If the account cart is empty, its fixture adds one item and removes that item afterwards. It preserves a nonempty account cart. Payment tests stop before **Confirm**. No order, payment, registration, password reset, complaint, or custom cake request is submitted.

Failures in public flows attach masked screenshots. Authenticated flows omit screenshots to avoid exposing profile/address information. Credentials are never passed as Allure step arguments. Failure messages redact credentials, email/phone values, and full accessibility snapshots. Trace/video capture is off by default because it can record secrets. Treat all reports as local test evidence and review them before sharing.

This is broad happy-path regression coverage, not a claim of 100% website coverage. Successful order submission and other remaining flows need additional fixtures and explicit scope; see the coverage map. A known site failure is intentionally left as a failure rather than silently skipped.

Implementation references: [Playwright Python pytest](https://playwright.dev/python/docs/intro), [Allure pytest configuration](https://allurereport.org/docs/pytest-configuration/), [Allure 3 installation](https://allurereport.org/docs/v3/install/), [Allure 3 report generation](https://allurereport.org/docs/v3/generate-report/).
