const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');
const { CheckoutPage } = require('../pages/checkout.page');

test.describe('Existing account checkout review', { tag: ['@regression', '@auth', '@checkout'] }, () => {
  let shop;
  let checkout;
  test.beforeEach(async ({ page, appConfig }, testInfo) => {
    test.skip(!appConfig.authEnabled || !appConfig.email || !appConfig.password,
      'Enable authenticated tests and configure a dedicated staging test account');
    shop = await new StorefrontPage(page, appConfig, testInfo).open(appConfig.checkoutCity);
    await (await shop.loginPage()).login();
    await shop.dismissPromotion();
    const cart = await shop.cart();
    // No shared-account cart is populated or cleared by these read-only reviews.
    test.skip(await cart.rows.count() === 0, 'Checkout review needs a pre-seeded dedicated account cart');
    await cart.checkoutReview();
    checkout = new CheckoutPage(page, appConfig, testInfo);
  });

  test('CHECKOUT-01: Existing addresses and order summary reconcile', async () => {
    await expect(shop.page.getByText('Address', { exact: true }).filter({ visible: true }).first()).toBeVisible();
    await expect(shop.page.getByText('Select as default address', { exact: true }).first()).toBeVisible();
    await checkout.assertSummary();
  });

  test('CHECKOUT-02: An existing eligible address reaches payment review', async () => {
    await checkout.deliveryPaymentReview();
    // No payment method, confirmation, order, or payment submission is clicked.
  });
});
