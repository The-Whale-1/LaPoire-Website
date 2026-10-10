# JavaScript coverage inventory

Inventory date: 10 October 2026. Target: `https://lapoire-stag.endlg.com/`.

The Playwright JavaScript suite implements **50 cases in seven spec files**: **40 public browsing/cart cases** and **10 optional authenticated cases**. The [first full cloud regression](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37839846812), before CART-12 was added, executed 48 cases with **37 passed, 1 failed, and 10 skipped**. That run recorded the Chocolates navigation website failure; all eight guest-cart cases and all five company-information cases passed after the documented harness corrections. This inventory describes the assertions in the code; skipped account checks are not verified coverage.

Maintenance verification on 9 October 2026 completed a locked dependency install, **18 passing offline helper checks**, and discovery of **49 cases**. Focused desktop Chromium execution of **CART-03, CART-05, and CART-12** produced **3 passed, 0 failed, 0 skipped, 0 flaky, and 0 healed** in 49.6 seconds with authentication disabled and zero retries. Allure and the run summary were generated; preserved local evidence is under `artifacts/js/daily-2026-10-09/quantity-regression/`. Full cloud verification on 9 October completed after [PR #3](https://github.com/The-Whale-1/LaPoire-Website/pull/3): the [push-triggered expanded run](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37909670366) produced **38 passed, 1 failed, 10 skipped, 0 flaky, and 0 healed** in 189.6 seconds. All nine guest-cart cases passed. The sole failure remains Chocolates navigation to `/list/undefined`. Both HTML reports and matching 49-result Allure/JSON summaries were verified in the [report artifact](https://github.com/The-Whale-1/LaPoire-Website/actions/runs/37909670366/artifacts/11605339082). This push run does not verify the separately missing daily scheduled event.

Maintenance verification on 10 October added **SEARCH-02** after observing the actual empty-state DOM and successful recovery with the known product. A locked install reported zero vulnerabilities, **18 helper checks passed**, and discovery found **50 cases**. Focused desktop Chromium SEARCH-01/SEARCH-02 produced **2 passed, 0 failed, 0 skipped, 0 flaky, and 0 healed** in 32.9 seconds with authentication disabled and zero retries. Both HTML reports and matching two-result Allure/JSON summaries were verified; evidence is preserved under `artifacts/js/daily-2026-10-10/search-regression/`. This focused result does not clear the independent Chocolates defect or establish a complete expanded-suite pass.

The default scope is desktop Chromium, English with an Arabic round trip, real staging products, fresh browser contexts, and guest carts. `RUN_AUTH_TESTS=false` keeps the 10 authenticated cases skipped. The current JavaScript fixture product defaults to **Raspberry Gateau**; `TEST_PRODUCT` can select an explicitly verified available product. The earlier Python product fixture and reports remain separate.

Priority reflects customer risk: **P0** protects core product discovery or basket arithmetic, **P1** covers important journey/state behavior, and **P2** covers supporting information or browser setup. Priority is an inventory classification; all enabled public cases belong to the regression suite.

## Implemented public cases

| ID | Cases | Priority | Customer scenario | Actual assertions |
| --- | ---: | --- | --- | --- |
| HOME-01 | 1 | P0 | Open homepage after selecting a delivery area | Exact categories heading and Best Seller label are visible; at least four product cards exist; first displayed EGP price is positive. |
| DEL-01 | 1 | P1 | Reload after choosing a delivery area | Header retains the actual selected area; initial selection popup stays hidden. |
| DEL-02 | 1 | P2 | Use configured browser geolocation | Browser permission is granted; returned latitude/longitude match configured coordinates. This verifies the browser fixture, not the site's geographic eligibility rules. |
| LANG-01 | 1 | P1 | Switch English → Arabic → English | HTML language changes to `ar-EG` and back to `en-US`; English categories heading reappears; selected delivery area remains. |
| CAT-01 | 10 | P1 | Open each main-menu category | Route contains `/list/` and rejects `/undefined`; first card is visible; both price-range inputs finish initialization; first price is positive; product link points to `/product/`. |
| INFO-01 | 5 | P2 | Open company information from footer | Clicking the selected footer link leaves the home URL; named page content outside the footer becomes visible. About Us checks its observed `About us` accessible heading and `Who we are` body heading. Terms checks its observed exact `Terms and Conditions` title and `Seventh: Payment Methods and Conditions` body section. The other pages use exact named content. Client navigation is accepted even when the anchor's `href` is `/#`. |
| FOOT-01 | 5 | P2 | Inspect social/app-store footer links | Link is visible; destination hostname exactly matches the expected service; `target` is `_blank`. External pages are not opened. |
| PROD-01 | 1 | P0 | Open configured Gateaux product | Detail route is `/product/`; displayed product name and In Stock text are visible; quantity starts at one; numeric positive detail price exactly equals captured catalog price. |
| SEARCH-01 | 1 | P0 | Search for and open the configured product | Exact matching product link appears; opening it reaches `/product/`; matching name, positive price, and default quantity of one appear. |
| SEARCH-02 | 1 | P1 | Search a nonexistent product, then search the configured product | Starting from a populated homepage, the safe unique query reaches a catalog route with its exact keyword; visible `No Results Found` appears and catalog card count becomes zero. Searching the known product removes the empty state and exposes one exact matching product link; opening it reaches matching details with positive price, catalog/detail price agreement, and quantity one. |
| SORT-01 | 2 | P1 | Select Lowest Price and Highest Price | More than one displayed price exists; every rendered price obeys the selected numeric ascending/descending order. |
| FILTER-01 | 1 | P1 | Apply and clear a populated price range | Range is derived from observed distinct product prices; at least one returned product exists; every returned price lies within the selected bounds; clearing restores original limits and products above the restricted upper bound. |
| CART-01 | 1 | P1 | Open a new guest bag | Explicit empty-bag message is visible and cart row count is zero. |
| CART-02 | 1 | P0 | Add one configured product | Exactly one row exists; exact product name, quantity one, unit price, and subtotal match the captured catalog/detail price. |
| CART-03 | 1 | P0 | Increase quantity and decrease it again | Quantity changes one → two → one; bag subtotal becomes unit price × two, then the original unit price. |
| CART-04 | 1 | P1 | Remove the created guest item | After the removal confirmation, row count is zero and the explicit empty-bag state appears. |
| CART-05 | 1 | P1 | Reload a populated guest bag | After reload, exactly one row retains the created product, quantity one, and original subtotal. This asserts guest persistence as the expected behavior; requirement changes should be reviewed explicitly. |
| CART-06 | 1 | P0 | Open full cart from the mini bag | Full-cart route is `/cart`; exact product is visible; there is one row with quantity one and matching unit price. |
| CART-07 | 1 | P0 | Select two units on product details, then add | Product controls update quantity; bag contains one row with quantity two, matching product/unit price, and subtotal equal to unit price × two. |
| CART-08 | 1 | P1 | Continue guest bag to checkout | Guest reaches `/auth/login` with visible email/password inputs. No login or order is submitted. |
| CART-12 | 1 | P1 | Increase guest quantity to two and reload | Before and after reload there is exactly one row with the same exact product name, quantity two, unchanged captured unit price, and subtotal equal to unit price × two. This checks persistence of a changed quantity rather than the default one. |
| AUTH-02 | 1 | P2 | Open guest login entry | Email input is visible/editable; password input is visible and uses `type=password`; Login control and login route are present. No credentials are entered or submitted. |
| **Public total** | **40** | | | |

CAT-01 covers **Tortes, Gateaux, Chocolates, Shareable boxes, Oriental, Bakery, Cakes, Ice Cream Tortes, Bowls, and Jam & Honey**. INFO-01 covers **About Us, Stores, Terms & Conditions, Privacy Policy, and Contact Us**. FOOT-01 checks **Facebook, Instagram, YouTube, Google Play, and App Store**.

The five `@smoke` cases are **HOME-01, CAT-01/Gateaux, PROD-01, SEARCH-01, and CART-02**. The Chocolates category and guest reload case remain in ordinary regression coverage. They are not excluded, marked expected failures, or made passing through locator fallback.

## Optional authenticated cases

These **10 implemented cases are not currently executed in the default browsing/cart scope**. They require `RUN_AUTH_TESTS=true`, a dedicated staging account, and separately reviewed authentication requests. In particular, inspect the website's actual **GraphQL login root operation** and verify it against the guard allowlist before enabling these cases. The presence of login page-object code does not establish that the guarded authenticated flow has been verified.

| ID | Cases | Priority | Scenario | Actual assertions and fixture requirement |
| --- | ---: | --- | --- | --- |
| AUTH-01 | 1 | P0 | Sign in as configured existing customer | Leaves login; homepage and authenticated notification icon appear; profile identity matches the configured account. |
| ACCOUNT-01 | 1 | P1 | Read existing profile | Email identity matches; first name is populated; phone input is disabled. No profile changes are saved. |
| ACCOUNT-02 | 4 | P1 | Open Address, My Orders, Custom Cake Requests, Complaints | Selected tab is active; content is visible/nonempty; Address also exposes Add new address. No record is added or submitted. |
| AUTH-03 | 1 | P1 | Log out | Subsequent account entry requires the login route. |
| WISH-01 | 1 | P2 | Read existing wishlist | Either explicit empty state with zero rows, or existing rows with valid product links and positive EGP prices. No wishlist item changes. |
| CHECKOUT-01 | 1 | P0 | Review existing addresses and checkout summary | Address controls are visible; summary exists; every displayed summary line reconciles to the total. Requires a pre-seeded dedicated-account cart; an empty cart skips this unexecuted scope. |
| CHECKOUT-02 | 1 | P0 | Select existing eligible delivery address | At least one enabled saved-address radio exists; selecting it and Next reaches `/checkout/payment` with Cash On Delivery visible. Missing eligible addresses fail with a fixture diagnostic. No payment or order confirmation is clicked. |
| **Optional total** | **10** | | | |

## Limits and result interpretation

- There are **no implemented backend negative tests** in this JavaScript suite. AUTH-02 checks login entry and password masking; it does not test rejection of empty fields, malformed email, incorrect credentials, lockout, or server errors. SEARCH-02 verifies one unique no-result query and recovery; whitespace normalization and Arabic searches remain unverified. Valid price filtering does not establish invalid-boundary handling.
- Product, sorting, price-range, and cart assertions operate on rendered UI state. They do not independently verify stock reservation, backend order totals, tax rules, discounts, payment-provider outcomes, or push/email delivery.
- Authenticated cases, mobile layouts, Firefox, WebKit, production availability, accessibility compliance, performance/load, and visual regression must not be counted as currently verified default coverage.
- Registration, reset-password requests, profile/address saves, complaints, cake requests, order creation, and payment capture are outside the current execution scope. The request guard must preserve that boundary.
- Page objects support only declared equivalent locator fallbacks for search input, cart icon, and add-to-cart control. Each fallback must identify one visible control and produces report metadata. Business assertions and numeric expectations are never healed. `SELF_HEALING_STRICT=true` rejects fallback use.
- Prior Python validation documented Chocolates navigating to `/list/undefined` and a guest cart losing its item after reload in the preserved local Python validation document. The JavaScript reload diagnostic on 8 October found that the header was not yet rendered at DOMContentLoaded, the Cart icon appeared approximately 1.4 seconds later, and the restored bag contained one row. With control readiness fixed, focused CART-05 passed the complete product-name, quantity, and subtotal assertions. The historical missing-item behavior did not reproduce in this current verification; the initial JavaScript CART-05 failure was a header-readiness failure. Current complete-run evidence determines overall suite status.
- A passing daily run is evidence for the listed sampled staging journeys. It cannot establish that every feature works continuously. Report failed, skipped, and unexecuted scope alongside passes.

## Next risk coverage backlog

The following are **proposed scenarios, not implemented or passed tests**. Add them after reviewing current baseline evidence and agreeing the relevant observable behavior. Each case should retain a specific assertion and any required fixture ownership.

| Proposed ID | Priority | Scenario | Meaningful expected outcome | Requirement or fixture to resolve |
| --- | --- | --- | --- | --- |
| SEARCH-03 | P1 | Search with surrounding whitespace and supported Arabic text | Documented normalization finds the intended product; a matching result opens the correct identity. | Confirm normalization rules and an existing Arabic/English product fixture. |
| CART-09 | P0 | Add two distinct available products | Exactly two unique product rows appear; each unit price/quantity is correct; subtotal equals the sum of both lines. | Two stable in-stock products in the same delivery area. |
| CART-10 | P1 | Add the same product twice | Documented row consolidation/increment behavior occurs; no unexpected duplicate row or lost unit; subtotal reflects the final quantity. | Confirm the site's intended duplicate-add rule. |
| CART-11 | P1 | Decrease a one-unit guest item at the lower quantity boundary | Quantity never becomes zero/negative; documented disabled-control or removal-confirmation behavior occurs; total and empty state remain consistent. | Confirm the supported lower-bound interaction. |
| FILTER-02 | P1 | Enter reversed, empty, or nonnumeric price bounds | UI displays the documented validation or normalization; no invalid/stale result set is presented as matching. | Inspect supported field constraints and business validation rules; observe requests before extending the guard. |
| CAT-02 | P1 | Traverse catalog pagination or Load More | Additional products are reachable; displayed identities do not unexpectedly repeat; selected sort/filter state remains consistent. | An actually paginated category and documented page/load-more behavior. |
| LANG-02 | P1 | Switch languages with a populated guest cart | Product identity, quantity, and monetary subtotal remain unchanged; translated controls remain usable. | Confirm currency/number formatting and current localized cart selectors. |
| DEL-03 | P0 | Change delivery area with a populated guest cart | Documented availability and repricing rules appear explicitly; unavailable items cannot silently proceed; subtotal reflects any accepted change. | Two known areas with representative availability differences and an agreed cart-retention rule. |
| MOBILE-01 | P1 | Browse/search/add on a mobile viewport | Mobile menu and delivery selection work; product controls are reachable; one added item has correct quantity/subtotal without horizontal clipping. | Inspect mobile DOM and implement mobile page objects before advertising a mobile project. |

Cloud execution, reporting, and the maintenance loop are described in [ECOSYSTEM.md](ECOSYSTEM.md) and [CLOUD_SETUP.md](CLOUD_SETUP.md). The legacy Python inventory in the preserved local Python coverage document describes a separate suite and must not be added to these JavaScript totals.
