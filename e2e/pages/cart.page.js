const { expect } = require('@playwright/test');
const { BasePage, css, amount } = require('./base.page');

class CartPage extends BasePage {
  constructor(page, config, testInfo) {
    super(page, config, testInfo);
    this.panel = page.locator(css('MiniCart', 'mainContainer'));
    this.rows = this.panel.locator('[class$="__item"]');
    this.totalPrice = this.panel.locator(css('MiniCart', 'totalPrice'));
  }

  async total() {
    return amount(await this.totalPrice.innerText());
  }

  async incrementQuantity(row = this.rows.first()) {
    await row.getByText('add', { exact: true }).click();
  }

  async decrementQuantity(row = this.rows.first()) {
    await row.getByText('remove', { exact: true }).click();
  }

  async close() {
    await this.panel.locator(css('MiniCart', 'close')).click();
    await expect(this.page.locator(css('MiniCart', 'MiniCartOpened'))).toBeHidden();
  }

  async viewCart() {
    await this.panel.getByText('View Your Cart', { exact: true }).click();
    await expect(this.page).toHaveURL(/\/cart(?:[/?#]|$)/);
  }

  async guestCheckout() {
    await this.panel.getByText('Checkout', { exact: true }).click();
    await expect(this.page).toHaveURL(/\/auth\/login/);
    await expect(this.page.locator('input[name="email"]')).toBeVisible();
    await expect(this.page.locator('input[name="password"]')).toBeVisible();
  }

  async checkoutReview() {
    await this.panel.getByText('Checkout', { exact: true }).click();
    await expect(this.page).toHaveURL(/\/checkout(?:[/?#]|$)/);
    await expect(this.page.getByRole('heading', { name: 'Home Delivery', exact: true })).toBeVisible();
  }
}

module.exports = { CartPage };
