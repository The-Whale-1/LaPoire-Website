const { expect } = require('@playwright/test');
const { resolveLocator } = require('../support/healing');

// Ignore CSS-module hash suffixes; the module and semantic part must both match.
function css(moduleName, part) {
  return `[class*="${moduleName}-module"][class*="__${part}"]`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Compare currency as integer piastres to avoid floating-point arithmetic errors.
function amount(text) {
  const match = text.match(/(-?[\d,]+(?:\.\d{1,2})?)\s*EGP/);
  if (!match) throw new Error(`Expected a numeric EGP amount, received: ${text}`);
  const sign = match[1].startsWith('-') ? -1 : 1;
  const [whole, fraction = ''] = match[1].replace(/[-,]/g, '').split('.');
  return sign * (Number(whole) * 100 + Number(fraction.padEnd(2, '0')));
}

class BasePage {
  constructor(page, config, testInfo) {
    this.page = page;
    this.config = config;
    this.testInfo = testInfo;
  }

  async actionLocator(key, primary, fallbacks = []) {
    return resolveLocator(this.page, { key, primary, fallbacks }, this.testInfo, this.config);
  }

  async waitReady() {
    await expect(this.page.locator(css('PageLoading', 'loading'))).toBeHidden({ timeout: 60000 });
  }
}

module.exports = { BasePage, css, amount, escapeRegExp };
