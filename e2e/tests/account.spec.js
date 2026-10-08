const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');
const { AccountPage } = require('../pages/account.page');

test.describe('Existing customer read-only account', { tag: ['@regression', '@auth'] }, () => {
  let shop;
  test.beforeEach(async ({ page, appConfig }, testInfo) => {
    test.skip(!appConfig.authEnabled || !appConfig.email || !appConfig.password,
      'Enable authenticated tests and configure a dedicated staging test account');
    shop = await new StorefrontPage(page, appConfig, testInfo).open();
    await (await shop.loginPage()).login();
    await shop.dismissPromotion();
  });

  test('AUTH-01: Configured existing customer signs in successfully', async ({ appConfig }) => {
    await expect(shop.page).not.toHaveURL(/\/auth\/login/);
    await new AccountPage(shop).open();
    const identityMatches = await shop.page.locator('input[name="email"]')
      .evaluate((field, configuredEmail) => field.value === configuredEmail, appConfig.email);
    expect(identityMatches, 'The signed-in profile must belong to the configured account').toBe(true);
  });

  test('ACCOUNT-01: Existing profile loads and phone is protected', async ({ appConfig }) => {
    const account = await new AccountPage(shop).open();
    const identityMatches = await account.page.locator('input[name="email"]')
      .evaluate((field, configuredEmail) => field.value === configuredEmail, appConfig.email);
    expect(identityMatches).toBe(true);
    await expect(account.page.locator('input[name="firstName"]')).not.toHaveValue('');
    await expect(account.page.locator('input[name="phone"]')).toBeDisabled();
  });

  for (const tab of ['Address', 'My Orders', 'Custom Cake Requests', 'Complaints']) {
    test(`ACCOUNT-02: ${tab} displays existing account content`, async () => {
      const account = await new AccountPage(shop).open();
      await account.tab(tab);
      await expect(account.content).toBeVisible();
      await expect(account.content).not.toHaveText('');
      if (tab === 'Address') await expect(account.content.getByText('Add new address', { exact: false })).toBeVisible();
    });
  }

  test('AUTH-03: Logout requires customer sign-in on the next visit', async () => {
    const account = await new AccountPage(shop).open();
    await account.tab('Log Out');
    await shop.loginPage();
    await expect(shop.page).toHaveURL(/\/auth\/login/);
  });

  test('WISH-01: Existing wishlist is either explicitly empty or populated with valid products', async () => {
    await new AccountPage(shop).wishlist();
  });
});
