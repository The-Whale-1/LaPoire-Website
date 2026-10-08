const { expect } = require('@playwright/test');
const { BasePage, css } = require('./base.page');

class LoginPage extends BasePage {
  constructor(page, config, testInfo) {
    super(page, config, testInfo);
    this.email = page.locator('input[name="email"]');
    this.password = page.locator('input[name="password"]');
    this.submit = page.getByText('Login', { exact: true });
  }

  async login() {
    if (!this.config.authEnabled || !this.config.email || !this.config.password) {
      throw new Error('Authenticated tests require RUN_AUTH_TESTS and a dedicated test account');
    }
    // Credentials stay out of named steps/attachments and never enter arguments.
    await this.email.fill(this.config.email);
    await this.password.fill(this.config.password);
    await this.submit.click();
    await expect(this.page).not.toHaveURL(/\/auth\/login/);
    await expect(this.page.getByRole('heading', { name: 'Enjoy Our Delicious Categories', exact: true })).toBeVisible();
    await expect(this.page.locator(css('NotificationBell', 'Icon'))).toBeVisible();
    await this.waitReady();
  }
}

module.exports = { LoginPage };
