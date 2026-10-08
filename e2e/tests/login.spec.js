const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');

test.describe('Guest authentication entry', { tag: '@regression' }, () => {
  test('AUTH-02: Guest reaches the login form with a masked password field', async ({ page, appConfig }, testInfo) => {
    const shop = await new StorefrontPage(page, appConfig, testInfo).open();
    const login = await shop.loginPage();
    await expect(login.email).toBeVisible();
    await expect(login.email).toBeEditable();
    await expect(login.password).toBeVisible();
    await expect(login.password).toHaveAttribute('type', 'password');
    await expect(login.submit).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
