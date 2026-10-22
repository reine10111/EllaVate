const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const users = require('../fixtures/users.json');

test('complete checkout flow', async ({ page }) => {
  const login = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  await login.goto();
  await login.login(users.validUser.username, users.validUser.password);
  await inventory.addToCart('sauce-labs-backpack');
  await inventory.openCart();
  await cart.checkout();
  await checkout.fillInfo('Ella', 'Vate', '1100');
  await checkout.finish();
  await expect(checkout.completeHeader).toHaveText('Thank you for your order!');
});