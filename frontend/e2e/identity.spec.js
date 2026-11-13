/** Exercise identity persistence, guards, and browser error reporting. */
import { expect, test } from '@playwright/test';

test('register, reload, role guard, logout and login', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/users');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByLabel('Display Name').fill('Alice Writer');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByText('Welcome, Alice Writer.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Welcome, Alice Writer.')).toBeVisible();
  await page.goto('/users');
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  await page.getByRole('button', { name: /Alice Writer/ }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
  await page.goto('/login');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome, Alice Writer.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('admin session persists and exposes admin navigation on mobile', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.reload();
  await expect(page.getByText('Welcome, Admin.')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  expect(errors).toEqual([]);
});
