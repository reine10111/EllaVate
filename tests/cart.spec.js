const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { CartPage } = require('../pages/CartPage');
const users = require('../fixtures/users.json');

test('add item to cart', async ({ page }) => {
  const login = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await login.goto();
  await login.login(users.validUser.username, users.validUser.password);
  await inventory.addToCart('sauce-labs-backpack');
  await expect(inventory.cartBadge).toHaveText('1');
  await inventory.openCart();
  await expect(cart.items).toHaveCount(1);
});