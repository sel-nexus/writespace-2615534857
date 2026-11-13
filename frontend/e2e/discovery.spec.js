/** Exercise local discovery, guest guards, and role-aware entry points. */
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

test('signed-in mobile landing keeps a long display name and dashboard link visible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/register');
  const displayName = 'A Very Long Display Name For A Mobile Writer';
  await page.getByLabel('Display Name').fill(displayName);
  await page.getByLabel('Username').fill('mobile-writer');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('navigation', { name: 'Account navigation' }).getByRole('link', { name: 'WriteSpace.' }).click();
  const navigation = page.getByRole('navigation', { name: 'Public navigation' });
  const name = navigation.getByText(displayName, { exact: true });
  const dashboard = navigation.getByRole('link', { name: 'Go to Dashboard' });
  await expect(name).toBeVisible();
  await expect(name).toHaveAttribute('title', displayName);
  await expect(dashboard).toBeVisible();
  await expect(dashboard).toHaveAttribute('href', '/blogs');
  const nameBox = await name.boundingBox();
  const dashboardBox = await dashboard.boundingBox();
  expect(nameBox.x).toBeGreaterThanOrEqual(0);
  expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(dashboardBox.x);
  expect(dashboardBox.x + dashboardBox.width).toBeLessThanOrEqual(375);
  await dashboard.click();
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByText(`Welcome, ${displayName}.`)).toBeVisible();
});

test('guest discovers local posts and is redirected to login when opening one', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByText('No posts yet — check back soon!')).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'old', title: 'Old browser post', content: 'An older story', createdAt: '2023-01-01T00:00:00Z', authorName: 'Writer', authorId: 'writer' },
      { id: 'latest', title: 'Newest browser post', content: 'The latest story', createdAt: '2025-01-01T00:00:00Z', authorName: 'Writer', authorId: 'writer' },
      { id: 'middle', title: 'Middle browser post', content: 'Another story', createdAt: '2024-01-01T00:00:00Z', authorName: 'Writer', authorId: 'writer' },
      { id: 'extra', title: 'Fourth browser post', content: 'Not in the preview', createdAt: '2022-01-01T00:00:00Z', authorName: 'Writer', authorId: 'writer' },
    ]));
  });
  await page.reload();
  const latest = page.getByRole('region', { name: 'Latest from the Blog' });
  await expect(latest.getByRole('heading', { level: 3 })).toHaveText(['Newest browser post', 'Middle browser post', 'Old browser post']);
  await expect(latest.getByText('The latest story')).toBeVisible();
  await expect(latest.getByText('Fourth browser post')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  await page.screenshot({ path: testInfo.outputPath('mobile-discovery.png'), fullPage: true });
  await latest.getByRole('link', { name: /Newest browser post/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
});

test('authenticated landing routes each role to its dashboard and reading to blogs', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const [role, destination] of [['user', '/blogs'], ['admin', '/admin']]) {
    await page.evaluate((currentRole) => {
      localStorage.setItem('writespace_session', JSON.stringify({ userId: 'id', username: 'writer', displayName: 'Local Writer', role: currentRole }));
    }, role);
    await page.reload();
    await expect(page.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute('href', destination);
    await expect(page.getByRole('link', { name: 'Start Reading' })).toHaveAttribute('href', '/blogs');
    await page.screenshot({ path: testInfo.outputPath(`desktop-landing-${role}.png`), fullPage: true });
    await page.getByRole('link', { name: 'Go to Dashboard' }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await page.getByRole('navigation', { name: 'Account navigation' }).getByRole('link', { name: 'WriteSpace.' }).click();
    await expect(page).toHaveURL(/\/$/);
  }
});
