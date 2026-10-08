const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');
const { css, amount } = require('../pages/base.page');

test.describe('Home, delivery and language', { tag: '@regression' }, () => {
  let shop;
  test.beforeEach(async ({ page, appConfig }, testInfo) => {
    shop = await new StorefrontPage(page, appConfig, testInfo).open();
  });

  test('HOME-01: Homepage displays categories and populated best sellers', { tag: '@smoke' }, async () => {
    await expect(shop.page.getByRole('heading', { name: 'Enjoy Our Delicious Categories', exact: true })).toBeVisible();
    await expect(shop.page.getByText('Best Seller', { exact: true })).toBeVisible();
    await expect.poll(() => shop.cards.count()).toBeGreaterThanOrEqual(4);
    expect(amount(await shop.cards.first().locator(css('ProductsListItem', 'price')).innerText())).toBeGreaterThan(0);
  });

  test('DEL-01: Delivery area persists after reload', async () => {
    await shop.page.reload({ waitUntil: 'domcontentloaded' });
    await expect(shop.area).toHaveText(shop.selectedArea);
    await expect(shop.zonePopup).toBeHidden();
  });

  test('DEL-02: Browser receives configured location permission and coordinates', async ({ appConfig }) => {
    const location = await shop.page.evaluate(async () => {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
      return { permission: permission.state, latitude: position.coords.latitude, longitude: position.coords.longitude };
    });
    expect(location.permission).toBe('granted');
    expect(location.latitude).toBeCloseTo(appConfig.latitude, 5);
    expect(location.longitude).toBeCloseTo(appConfig.longitude, 5);
  });

  test('LANG-01: Arabic and English switch preserves delivery area', async () => {
    await shop.header.getByText('عربي', { exact: true }).click();
    await expect(shop.page.locator('html')).toHaveAttribute('lang', 'ar-EG');
    await shop.header.getByText('English', { exact: true }).click();
    await expect(shop.page.locator('html')).toHaveAttribute('lang', 'en-US');
    await expect(shop.page.getByRole('heading', { name: 'Enjoy Our Delicious Categories', exact: true })).toBeVisible();
    await expect(shop.area).toHaveText(shop.selectedArea);
  });
});
