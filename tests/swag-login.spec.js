
const { test, expect } = require('@playwright/test');

test('Swag Labs login with valid user', async ({ page }) => {
  await page.goto('/');

  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('#login-button');

  // Verify we landed on the inventory page
  await expect(page).toHaveURL(/inventory.html/);
  await expect(page.locator('.title')).toHaveText('Products');
});

test('Swag Labs login with invalid user', async ({ page }) => {
  await page.goto('/');

  await page.fill('#user-name', 'invalid_user');
  await page.fill('#password', 'wrong_password');
  await page.click('#login-button');

  // Verify the error message
  await expect(page.locator('[data-test="error"]'))
    .toContainText('Epic sadface');
});
