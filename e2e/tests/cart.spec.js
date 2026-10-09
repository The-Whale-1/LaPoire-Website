const { test, expect } = require('../fixtures/test');
const { StorefrontPage } = require('../pages/storefront.page');
const { css, amount } = require('../pages/base.page');

test.describe('Guest shopping bag', { tag: ['@regression', '@cart'] }, () => {
  let shop;
  test.beforeEach(async ({ page, appConfig }, testInfo) => {
    shop = await new StorefrontPage(page, appConfig, testInfo).open();
  });

  async function populatedCart(quantity = 1) {
    await shop.category('Gateaux');
    const product = await shop.product();
    await product.add(quantity);
    const cart = await shop.cart();
    await expect(cart.rows).toHaveCount(1);
    await expect(cart.rows.first().locator('input[name="quantity"]')).toHaveValue(String(quantity));
    await expect(cart.rows.first().locator(css('MiniCart', 'name'))).toHaveText(product.name);
    expect(amount(await cart.rows.first().locator(css('MiniCart', 'price')).innerText())).toBe(product.catalogPrice);
    await expect.poll(() => cart.total()).toBe(product.catalogPrice * quantity);
    return { cart, product };
  }

  test('CART-01: A new guest has an empty bag', async () => {
    const cart = await shop.cart();
    await expect(cart.panel.getByText('Your Cart is Empty!', { exact: true })).toBeVisible();
    await expect(cart.rows).toHaveCount(0);
  });

  test('CART-02: Add an item with consistent name, quantity, price and subtotal', { tag: '@smoke' }, async () => {
    const { cart, product } = await populatedCart();
    expect(await cart.total()).toBe(product.catalogPrice);
  });

  test('CART-03: Increase and decrease quantity recalculates the total', async () => {
    const { cart, product } = await populatedCart();
    const row = cart.rows.first();
    await cart.incrementQuantity(row);
    await expect(row.locator('input[name="quantity"]')).toHaveValue('2');
    await expect.poll(() => cart.total()).toBe(product.catalogPrice * 2);
    await cart.decrementQuantity(row);
    await expect(row.locator('input[name="quantity"]')).toHaveValue('1');
    await expect.poll(() => cart.total()).toBe(product.catalogPrice);
  });

  test('CART-04: Removing the guest item returns the bag to empty', async () => {
    const { cart } = await populatedCart();
    await cart.rows.first().locator(css('MiniCart', 'remove')).click();
    await shop.page.getByText('Ok', { exact: true }).click();
    await expect(cart.rows).toHaveCount(0);
    const empty = await shop.cart();
    await expect(empty.panel.getByText('Your Cart is Empty!', { exact: true })).toBeVisible();
  });

  test('CART-05: Guest item, quantity and subtotal persist after reload', async () => {
    const { cart, product } = await populatedCart();
    await cart.close();
    await shop.reload();
    const restored = await shop.cart();
    await expect(restored.rows).toHaveCount(1);
    await expect(restored.rows.first().locator(css('MiniCart', 'name'))).toHaveText(product.name);
    await expect(restored.rows.first().locator('input[name="quantity"]')).toHaveValue('1');
    expect(await restored.total()).toBe(product.catalogPrice);
  });

  test('CART-06: Full cart retains the guest product with its unit price', async () => {
    const { cart, product } = await populatedCart();
    await cart.viewCart();
    await expect(shop.page.getByText(product.name, { exact: true }).filter({ visible: true }).first()).toBeVisible();
    const rows = shop.page.locator(css('cart', 'Items')).locator('[class$="__item"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first().locator('input[name="quantity"]')).toHaveValue('1');
    expect(amount(await rows.first().locator(css('cart', 'price')).innerText())).toBe(product.catalogPrice);
  });

  test('CART-07: Product quantity controls add two units with the correct subtotal', async () => {
    const { cart, product } = await populatedCart(2);
    expect(await cart.total()).toBe(product.catalogPrice * 2);
  });

  test('CART-08: Guest checkout requires customer sign-in', async () => {
    const { cart } = await populatedCart();
    await cart.guestCheckout();
  });

  test('CART-12: Changed guest quantity, unit price and subtotal survive reload', async () => {
    const { cart, product } = await populatedCart();
    await cart.incrementQuantity();
    await expect(cart.rows).toHaveCount(1);
    await expect(cart.rows.first().locator(css('MiniCart', 'name'))).toHaveText(product.name);
    await expect(cart.rows.first().locator('input[name="quantity"]')).toHaveValue('2');
    expect(amount(await cart.rows.first().locator(css('MiniCart', 'price')).innerText())).toBe(product.catalogPrice);
    await expect.poll(() => cart.total()).toBe(product.catalogPrice * 2);

    await cart.close();
    await shop.reload();
    const restored = await shop.cart();
    await expect(restored.rows).toHaveCount(1);
    await expect(restored.rows.first().locator(css('MiniCart', 'name'))).toHaveText(product.name);
    await expect(restored.rows.first().locator('input[name="quantity"]')).toHaveValue('2');
    expect(amount(await restored.rows.first().locator(css('MiniCart', 'price')).innerText())).toBe(product.catalogPrice);
    await expect.poll(() => restored.total()).toBe(product.catalogPrice * 2);
  });
});
