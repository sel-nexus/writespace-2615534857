/** Exercise identity persistence, guards, and browser error reporting. */
import { expect, test } from '@playwright/test';

const browserErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => errors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText}`));
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'browser errors and failed requests').toEqual([]);
});

test('register, reload, role guard, logout and login', async ({ page }) => {
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
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  await page.getByRole('button', { name: /Alice Writer/ }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
  await page.getByRole('navigation', { name: 'Public navigation' }).getByRole('link', { name: 'Login' }).click();
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('Welcome, Alice Writer.')).toBeVisible();
});

test('admin session persists and exposes admin navigation on mobile', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.reload();
  await expect(page.getByText('Welcome, Admin.')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await expect(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mobile-admin-navigation.png'), fullPage: true });
});

for (const route of ['/blogs', '/blog/example', '/write', '/edit/example', '/admin', '/users']) {
  test(`guest visiting ${route} is redirected to login`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  });
}

for (const route of ['/admin', '/users']) {
  test(`regular user visiting ${route} is redirected to blogs`, async ({ page, context }) => {
    await context.addInitScript(() => localStorage.setItem('writespace_session', JSON.stringify({ userId: 'writer', username: 'writer', displayName: 'Local Writer', role: 'user' })));
    await page.goto(route);
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.getByText('Welcome, Local Writer.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  });
}

for (const [role, destination] of [['user', '/blogs'], ['admin', '/admin']]) {
  for (const route of ['/login', '/register']) {
    test(`authenticated ${role} visiting ${route} is redirected to ${destination}`, async ({ page, context }) => {
      await context.addInitScript((currentRole) => localStorage.setItem('writespace_session', JSON.stringify({ userId: currentRole, username: currentRole, displayName: 'Signed In', role: currentRole })), role);
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      await expect(page.getByText('Welcome, Signed In.')).toBeVisible();
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_session')).role)).toBe(role);
    });
  }
}
