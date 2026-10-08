const { expect } = require('@playwright/test');
const { BasePage, css, amount } = require('./base.page');

class ProductPage extends BasePage {
  constructor(page, config, testInfo, name, catalogPrice = null) {
    super(page, config, testInfo);
    this.name = name;
    this.catalogPrice = catalogPrice;
    this.quantity = page.locator('input[name="quantity"]:visible').first();
    this.controls = page.locator(css('product', 'PriceSizeAndQuantity'));
  }

  async price() {
    const price = this.page.locator(css('product', 'ProductPrice'));
    await expect(price).toHaveText(/^[\d,]+(?:\.\d{1,2})?\s*EGP$/);
    const value = amount(await price.innerText());
    expect(value, 'An available product must have a positive price').toBeGreaterThan(0);
    return value;
  }

  async add(quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Quantity must be a positive integer');
    const current = Number(await this.quantity.inputValue());
    const direction = quantity > current ? 1 : -1;
    for (let expected = current + direction; direction > 0 ? expected <= quantity : expected >= quantity; expected += direction) {
      await this.controls.getByText(direction > 0 ? 'add' : 'remove', { exact: true }).click();
      await expect(this.quantity).toHaveValue(String(expected));
    }
    const add = await this.actionLocator('product.addToCart',
      () => this.page.getByText(/^Add to Cart$/i).filter({ visible: true }),
      [{ name: 'product.add.button.accessible', locator: () => this.page.getByRole('button', { name: /^Add to Cart$/i }) }]);
    await add.click();
    await expect(this.page.locator(css('MiniCart', 'MiniCartOpened'))).toBeVisible({ timeout: 60000 });
  }
}

module.exports = { ProductPage };
