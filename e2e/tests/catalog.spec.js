const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');
const { ProductPage } = require('../pages/product.page');

test.describe('Products, search, sorting and filters', { tag: '@regression' }, () => {
  let shop;
  test.beforeEach(async ({ page, appConfig }, testInfo) => {
    shop = await new StorefrontPage(page, appConfig, testInfo).open();
  });

  test('PROD-01: Product details match catalog name, price, stock and default quantity', { tag: '@smoke' }, async () => {
    await shop.category('Gateaux');
    const product = await shop.product();
    await expect(shop.page.getByText(product.name, { exact: true }).filter({ visible: true }).last()).toBeVisible();
    await expect(product.quantity).toHaveValue('1');
    expect(await product.price()).toBe(product.catalogPrice);
    await expect(shop.page.getByText('In Stock', { exact: false }).filter({ visible: true }).first()).toBeVisible();
  });

  test('SEARCH-01: A known product is searchable and opens its matching details', { tag: '@smoke' }, async ({ appConfig }, testInfo) => {
    await shop.search(appConfig.product);
    const result = shop.page.getByRole('link', { name: appConfig.product, exact: true }).filter({ visible: true }).first();
    await expect(result).toBeVisible();
    await result.click();
    await expect(shop.page).toHaveURL(/\/product\//);
    const product = new ProductPage(shop.page, appConfig, testInfo, appConfig.product);
    expect(await product.price()).toBeGreaterThan(0);
    await expect(product.quantity).toHaveValue('1');
    await expect(shop.page.getByText(appConfig.product, { exact: true }).filter({ visible: true }).last()).toBeVisible();
  });

  for (const [label, descending] of [['Lowest Price', false], ['Highest Price', true]]) {
    test(`SORT-01: ${label} sorts every rendered product price`, async () => {
      await shop.category('Gateaux');
      await shop.page.getByRole('combobox').selectOption({ label });
      await expect.poll(async () => {
        const prices = await shop.prices();
        return prices.length > 1 && prices.every((value, index) => index === 0 ||
          (descending ? prices[index - 1] >= value : prices[index - 1] <= value));
      }, { message: `All displayed prices must obey ${label}` }).toBe(true);
      const prices = await shop.prices();
      expect(prices.length).toBeGreaterThan(1);
      expect(prices).toEqual([...prices].sort((a, b) => descending ? b - a : a - b));
    });
  }

  test('FILTER-01: Applying a populated price range constrains products and clear restores limits', async () => {
    await shop.category('Gateaux');
    const from = shop.page.locator('input[name="from"]');
    const to = shop.page.locator('input[name="to"]');
    const originalFrom = await from.inputValue();
    const originalTo = await to.inputValue();
    const prices = [...new Set(await shop.prices())].sort((a, b) => a - b);
    expect(prices.length, 'A filter test needs products with different prices').toBeGreaterThan(1);
    const low = prices[0];
    const high = prices[Math.max(0, Math.floor((prices.length - 1) / 2))];
    await from.fill(String(low / 100));
    await to.fill(String(high / 100));
    await shop.page.getByText('Apply All', { exact: true }).click();
    await expect.poll(async () => {
      const filtered = await shop.prices();
      return filtered.length > 0 && filtered.every(price => low <= price && price <= high);
    }, { message: 'Every returned price must fall inside the requested range' }).toBe(true);
    await shop.page.getByText('Clear All', { exact: true }).click();
    await expect(from).toHaveValue(originalFrom);
    await expect(to).toHaveValue(originalTo);
    await expect.poll(async () => (await shop.prices()).some(price => price > high),
      { message: 'Clearing the filter must restore products outside the restricted range' }).toBe(true);
  });
});
