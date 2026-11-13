/** Exercise local discovery, guest guards, and role-aware entry points. */
import { expect, test } from '@playwright/test';

test('guest discovers local posts and is redirected to login when opening one', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
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
  await latest.getByRole('link', { name: /Newest browser post/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('authenticated landing routes each role to its dashboard and reading to blogs', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const [role, destination] of [['user', '/blogs'], ['admin', '/admin']]) {
    await page.evaluate((currentRole) => {
      localStorage.setItem('writespace_session', JSON.stringify({ userId: 'id', username: 'writer', displayName: 'Local Writer', role: currentRole }));
    }, role);
    await page.reload();
    await expect(page.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute('href', destination);
    await expect(page.getByRole('link', { name: 'Start Reading' })).toHaveAttribute('href', '/blogs');
    await page.getByRole('link', { name: 'Go to Dashboard' }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await page.goto('/');
  }
  expect(errors).toEqual([]);
});
