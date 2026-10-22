const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const users = require('../fixtures/users.json');

test.describe('Login tests', () => {
  test('valid login redirects to inventory', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.validUser.username, users.validUser.password);
    await expect(page).toHaveURL(/inventory.html/);
    await expect(page.locator('.title')).toHaveText('Products');
  });

  test('invalid login shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.invalidUser.username, users.invalidUser.password);
    await expect(loginPage.getError()).toContainText('Epic sadface');
  });

  test('locked out user sees locked message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.lockedUser.username, users.lockedUser.password);
    await expect(loginPage.getError()).toContainText('locked out');
  });
});