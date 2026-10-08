const { expect } = require('@playwright/test');
const { BasePage, css, amount, escapeRegExp } = require('./base.page');
const { ProductPage } = require('./product.page');
const { CartPage } = require('./cart.page');
const { LoginPage } = require('./login.page');

class StorefrontPage extends BasePage {
  constructor(page, config, testInfo) {
    super(page, config, testInfo);
    this.header = page.locator(css('HeaderDesktop', 'HeaderDesktop'));
    this.icons = this.header.locator(css('TopHeader', 'Icon'));
    this.footer = page.locator(css('FooterDesktop', 'FooterDesktop'));
    this.zonePopup = page.locator(css('ZonePopup', 'popup'));
    this.cards = page.locator(css('ProductsListItem', 'ProductsListItem'));
    this.area = this.header.locator(css('TopHeader', 'CurrentZoneText'));
  }

  async open(city = this.config.city) {
    await this.page.goto(this.config.baseURL, { waitUntil: 'domcontentloaded' });
    await expect(this.page.getByRole('heading', { name: 'Enjoy Our Delicious Categories', exact: true })).toBeVisible();
    await expect(this.zonePopup).toBeVisible();
    await this.selectDeliveryArea(city);
    await this.dismissPromotion();
    await expect(this.cards.first()).toBeVisible();
    return this;
  }

  async selectDeliveryArea(city) {
    const selected = this.zonePopup.locator(css('Select', 'selectedValue'));
    await selected.click();
    const options = this.zonePopup.locator(css('Select', 'optionBlue'));
    await expect(options.first()).toBeVisible();
    const option = city ? options.filter({ hasText: new RegExp(`^${escapeRegExp(city)}$`) }) : options.first();
    await expect(option).toBeVisible();
    this.selectedArea = (await option.innerText()).trim();
    await option.click();
    await expect(selected).toHaveText(this.selectedArea);
    await this.zonePopup.getByText('Select', { exact: true }).click();
    await expect(this.zonePopup).toBeHidden();
    await expect(this.area).toHaveText(this.selectedArea);
  }

  async dismissPromotion() {
    const close = this.page.getByRole('button', { name: 'Close popup', exact: true });
    if (await close.count()) {
      await close.click();
      await expect(close).toBeHidden();
    }
  }

  async category(name) {
    await this.header.getByRole('button', { name: 'Menu', exact: true }).hover();
    await this.header.locator(css('BottomHeader', 'DropdownItem'))
      .filter({ hasText: new RegExp(`^${escapeRegExp(name)}$`) }).click();
    await expect(this.page).toHaveURL(/\/list\//);
    expect(this.page.url(), `${name} must open a valid catalog route`).not.toContain('/undefined');
    await this.page.mouse.move(0, 0);
    await this.waitReady();
    await expect(this.cards.first()).toBeVisible();
    await expect(this.page.locator('input[name="from"]')).not.toHaveValue('');
    await expect(this.page.locator('input[name="to"]')).not.toHaveValue('');
  }

  async search(query) {
    // This legacy header icon has no accessible name in the inspected DOM.
    await this.icons.nth(0).click();
    const field = await this.actionLocator('search.query',
      () => this.page.locator('input[name="search"]'),
      [{ name: 'search.textbox.accessible', locator: () => this.page.getByRole('textbox', { name: /^search$/i }) }]);
    await field.fill(query);
    await field.press('Enter');
  }

  async product(name = this.config.product) {
    const card = this.cards.filter({ has: this.page.getByRole('link', { name, exact: true }) }).first();
    await expect(card).toBeVisible();
    const catalogPrice = amount(await card.locator(css('ProductsListItem', 'price')).innerText());
    await this.waitReady();
    const link = card.getByRole('link', { name, exact: true });
    await link.scrollIntoViewIfNeeded();
    // The center has hover action buttons; a visible corner belongs to the link.
    await link.click({ position: { x: 12, y: 12 } });
    await expect(this.page).toHaveURL(/\/product\//);
    const product = new ProductPage(this.page, this.config, this.testInfo, name, catalogPrice);
    await expect(product.quantity).toHaveValue('1');
    expect(await product.price(), 'Catalog and product-detail prices must agree').toBe(catalogPrice);
    return product;
  }

  async cart() {
    const opened = this.page.locator(css('MiniCart', 'MiniCartOpened'));
    if (!(await opened.count())) {
      const primary = this.header.getByRole('img', { name: 'Cart', exact: true });
      const alternate = this.header.getByAltText('Cart', { exact: true });
      // Reload DOMContentLoaded precedes client-rendered header readiness.
      // Use the normal UI budget before deciding whether a locator has drifted.
      await expect(primary.or(alternate)).toBeVisible();
      const icon = await this.actionLocator('header.cart',
        () => primary,
        [{ name: 'cart.image.alt', locator: () => alternate }]);
      await icon.click();
    }
    await expect(opened).toBeVisible();
    return new CartPage(this.page, this.config, this.testInfo);
  }

  async loginPage() {
    await this.icons.nth(2).click();
    await expect(this.page).toHaveURL(/\/auth\/login/);
    return new LoginPage(this.page, this.config, this.testInfo);
  }

  async openInformation(name) {
    // These links use client navigation; href may legitimately remain /#.
    await this.footer.getByRole('link', { name, exact: true }).click();
  }

  outsideFooter(locator) {
    const footer = css('FooterDesktop', 'FooterDesktop');
    const outsideFooter = this.page.locator(`:not(${footer}, ${footer} *)`);
    return locator.filter({ visible: true }).and(outsideFooter).first();
  }

  informationContent(name) {
    // The verified page heading is "About us"; the footer label uses "About Us".
    const content = name === 'About Us'
      ? this.page.getByRole('heading', { name: /^About us$/i })
      : this.page.getByText(name === 'Terms & Conditions' ? 'Terms and Conditions' : name, { exact: true });
    return this.outsideFooter(content);
  }

  async assertInformationContent(name) {
    await expect(this.informationContent(name)).toBeVisible();
    // These observed body sections establish populated CMS content, beyond a breadcrumb.
    if (name === 'About Us') {
      await expect(this.outsideFooter(this.page.getByRole('heading', { name: 'Who we are', exact: true }))).toBeVisible();
    }
    if (name === 'Terms & Conditions') {
      await expect(this.outsideFooter(this.page.getByText('Seventh: Payment Methods and Conditions', { exact: true }))).toBeVisible();
    }
  }

  async prices() {
    return (await this.cards.locator(css('ProductsListItem', 'price')).allTextContents()).map(amount);
  }
}

module.exports = { StorefrontPage };
