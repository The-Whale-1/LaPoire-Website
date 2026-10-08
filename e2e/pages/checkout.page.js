const { expect } = require('@playwright/test');
const { BasePage, css, amount } = require('./base.page');

class CheckoutPage extends BasePage {
  constructor(page, config, testInfo) {
    super(page, config, testInfo);
    this.summary = page.locator(css('CheckoutSummary', 'CheckoutSummary'));
  }

  async assertSummary() {
    await expect(this.summary).toBeVisible();
    await expect(this.summary.getByText('Order Summary', { exact: true })).toBeVisible();
    const fields = this.summary.locator('[class$="__field"]');
    await expect.poll(() => fields.count()).toBeGreaterThan(0);
    const values = (await fields.allTextContents()).map(amount);
    const total = amount(await this.summary.locator(css('CheckoutSummary', 'Total')).innerText());
    expect(total, 'Checkout total must reconcile with every summary line').toBe(values.reduce((sum, value) => sum + value, 0));
  }

  async deliveryPaymentReview() {
    await expect(this.page.getByText('Select as default address', { exact: true }).first()).toBeVisible();
    const addresses = this.page.locator(css('checkout', 'AllAddresses')).locator('input[type="radio"]:not([disabled])');
    expect(await addresses.count(), 'No existing address is eligible for the configured CHECKOUT_CITY').toBeGreaterThan(0);
    await addresses.first().check();
    await this.page.getByText('Next', { exact: true }).filter({ visible: true }).first().click();
    await expect(this.page).toHaveURL(/\/checkout\/payment/);
    await expect(this.page.getByText('Cash On Delivery', { exact: true })).toBeVisible();
  }
}

module.exports = { CheckoutPage };
