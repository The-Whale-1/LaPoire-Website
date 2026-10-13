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

  test('CART-09: Two distinct products retain their unit prices, quantities and combined subtotal', async ({ appConfig }) => {
    const fixtures = [
      { name: appConfig.product, quantity: 1 },
      { name: appConfig.secondProduct, quantity: 2 },
    ];
    for (const fixture of fixtures) {
      expect(fixture.name, 'CART-09 requires two explicitly configured, nonempty Gateaux product names').not.toBe('');
    }
    expect(new Set(fixtures.map(fixture => fixture.name.toLowerCase())).size,
      'CART-09 requires distinct TEST_PRODUCT and TEST_SECOND_PRODUCT fixtures').toBe(2);

    const products = [];
    let cart;
    for (const fixture of fixtures) {
      if (cart) await cart.close();
      await shop.category('Gateaux');
      const product = await shop.product(fixture.name);
      await expect(shop.page.locator(css('product', 'ProducName'))).toHaveText(fixture.name);
      const stock = shop.page.getByText('In Stock', { exact: false }).filter({ visible: true }).first();
      await expect(stock).toHaveText(/^\d+\s+In Stock$/);
      const advertisedStock = Number((await stock.innerText()).trim().split(/\s+/)[0]);
      expect(advertisedStock, `Fixture shortage: ${fixture.name} must advertise stock for the requested ${fixture.quantity} unit(s)`).toBeGreaterThanOrEqual(fixture.quantity);
      await product.add(fixture.quantity);
      cart = await shop.cart();
      products.push({ ...fixture, unitPrice: product.catalogPrice });
    }

    await expect(cart.rows).toHaveCount(2);
    for (const product of products) {
      const row = cart.namedRow(product.name);
      await expect(row, 'Each configured product must have exactly one guest-cart row').toHaveCount(1);
      await expect(row.locator('input[name="quantity"]')).toHaveValue(String(product.quantity));
      expect(await cart.unitPrice(row), `Unit price must remain correct for ${product.name}`).toBe(product.unitPrice);
    }
    const actualNames = (await cart.productNames.allTextContents()).map(name => name.trim()).sort();
    expect(actualNames).toEqual(products.map(product => product.name).sort());
    const expectedSubtotal = products.reduce((total, product) => total + product.unitPrice * product.quantity, 0);
    await expect.poll(() => cart.total()).toBe(expectedSubtotal);
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
