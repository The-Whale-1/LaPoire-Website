const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');
const { css, amount } = require('../pages/base.page');

test.describe('Catalog and company navigation', { tag: '@regression' }, () => {
  let shop;
  test.beforeEach(async ({ page, appConfig }, testInfo) => {
    shop = await new StorefrontPage(page, appConfig, testInfo).open();
  });

  const categories = ['Tortes', 'Gateaux', 'Chocolates', 'Shareable boxes', 'Oriental', 'Bakery', 'Cakes', 'Ice Cream Tortes', 'Bowls', 'Jam & Honey'];
  for (const category of categories) {
    test(`CAT-01: ${category} opens a valid populated category`, { tag: category === 'Gateaux' ? '@smoke' : '@catalog' }, async () => {
      await shop.category(category);
      expect(amount(await shop.cards.first().locator(css('ProductsListItem', 'price')).innerText())).toBeGreaterThan(0);
      await expect(shop.cards.first().getByRole('link')).toHaveAttribute('href', /\/product\//);
    });
  }

  for (const name of ['About Us', 'Stores', 'Terms & Conditions', 'Privacy Policy', 'Contact Us']) {
    test(`INFO-01: Footer ${name} opens company information`, async () => {
      await shop.openInformation(name);
      await expect(shop.page).not.toHaveURL(/\/$|\/#$/);
      await shop.assertInformationContent(name);
    });
  }

  const destinations = [
    ['Facebook', 'www.facebook.com'], ['Instagram', 'www.instagram.com'], ['YouTube', 'www.youtube.com'],
    ['Google Play', 'play.google.com'], ['App Store', 'apps.apple.com'],
  ];
  for (const [name, host] of destinations) {
    test(`FOOT-01: ${name} link uses the expected external host`, async () => {
      const link = shop.footer.locator(`a[title="${name}"]`);
      await expect(link).toBeVisible();
      expect(new URL(await link.getAttribute('href')).hostname).toBe(host);
      await expect(link).toHaveAttribute('target', '_blank');
    });
  }
});
