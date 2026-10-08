const { expect } = require('@playwright/test');
const { BasePage, css, amount } = require('./base.page');

class AccountPage extends BasePage {
  constructor(shop) {
    super(shop.page, shop.config, shop.testInfo);
    this.shop = shop;
    this.content = this.page.locator(css('account', 'Right'));
  }

  async open() {
    await this.shop.icons.filter({ has: this.page.locator('path[data-name="Path 18785"]') }).click();
    await expect(this.page).toHaveURL(/\/account/);
    return this;
  }

  async tab(name) {
    await this.page.locator(css('account', 'tabs')).getByText(name, { exact: true }).click();
    if (name !== 'Log Out') {
      await expect(this.page.locator(css('account', 'activeTab'))).toHaveText(name);
    }
  }

  async wishlist() {
    await this.shop.icons.filter({ has: this.page.locator('path[data-name="Icon awesome-heart"]') }).click();
    await expect(this.page).toHaveURL(/\/wishlist/);
    await this.waitReady();
    const rows = this.page.locator(css('wishlist', 'items')).locator('[class$="__item"]');
    const empty = this.page.getByText('Your wishlist is empty', { exact: true });
    await expect(empty.or(rows.first()).first()).toBeVisible();
    if (await empty.isVisible()) {
      await expect(rows).toHaveCount(0);
    } else {
      expect(await rows.count()).toBeGreaterThan(0);
      for (const row of await rows.all()) {
        await expect(row.getByRole('link').first()).toHaveAttribute('href', /\/product\//);
        expect(amount(await row.innerText())).toBeGreaterThan(0);
      }
    }
  }
}

module.exports = { AccountPage };
