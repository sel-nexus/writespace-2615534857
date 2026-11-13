/** Exercise identity, writing, discovery and ownership across real browser routes. */
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

test('Home header Write a post opens the editor', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Display Name').fill('Header Writer');
  await page.getByLabel('Username').fill('header-writer');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  const homeHeader = page.getByRole('heading', { name: 'All Blogs' }).locator('..').locator('..');
  const writeLink = homeHeader.getByRole('link', { name: 'Write a post' });
  await expect(writeLink).toBeVisible();
  await expect(writeLink).toHaveAttribute('href', '/write');
  await writeLink.click();
  await expect(page).toHaveURL(/\/write$/);
  await expect(page.getByRole('heading', { name: 'Write a post' })).toBeVisible();
});

test('registered writer publishes, discovers, edits and deletes a local post', async ({ page }, testInfo) => {
  await page.goto('/register');
  await page.getByLabel('Display Name').fill('Alice Writer');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  await page.getByText('No blogs yet. Be the first to write one!').locator('..').getByRole('link', { name: 'Write a post' }).click();
  await expect(page).toHaveURL(/\/write$/);
  await page.screenshot({ path: testInfo.outputPath('desktop-editor.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Title is required.')).toBeVisible();
  await page.getByLabel('Title').fill('A browser-local story');
  await page.getByLabel('Content').fill('First line\nSecond line');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('First line Second line')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('desktop-reader.png'), fullPage: true });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A browser-local story' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Account navigation' }).getByRole('link', { name: 'WriteSpace.' }).click();
  const preview = page.getByRole('region', { name: 'Latest from the Blog' });
  await expect(preview.getByRole('heading', { name: 'A browser-local story' })).toBeVisible();
  await preview.getByRole('link', { name: /A browser-local story/ }).click();
  await page.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Title').fill('A revised story');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'A revised story' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('heading', { name: 'A revised story' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByText('No blogs yet. Be the first to write one!')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Post not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to All Posts' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
});

test('another registered writer can read but not manage a post', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Display Name').fill('Alice');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('navigation', { name: 'Account navigation' }).getByRole('link', { name: 'Write', exact: true }).click();
  await expect(page).toHaveURL(/\/write$/);
  await page.getByLabel('Title').fill('Alice only');
  await page.getByLabel('Content').fill('Private ownership');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: /Alice/ }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('navigation', { name: 'Public navigation' }).getByRole('link', { name: 'Get Started' }).click();
  await page.getByLabel('Display Name').fill('Bob');
  await page.getByLabel('Username').fill('bob');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('link', { name: /Alice only/ }).click();
  await expect(page.getByText('Private ownership')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to All Posts' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
});

test('canceling create and edit leaves local posts unchanged', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Display Name').fill('Alice');
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByLabel('Confirm Password').fill('demo');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  const beforeCreate = await page.evaluate(() => localStorage.getItem('writespace_posts'));
  await page.getByRole('navigation', { name: 'Account navigation' }).getByRole('link', { name: 'Write', exact: true }).click();
  await page.getByLabel('Title').fill('Unsaved post');
  await page.getByLabel('Content').fill('Unsaved words');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  expect(await page.evaluate(() => localStorage.getItem('writespace_posts'))).toBe(beforeCreate);
  await expect(page.getByText('No blogs yet. Be the first to write one!')).toBeVisible();

  await page.getByText('No blogs yet. Be the first to write one!').locator('..').getByRole('link', { name: 'Write a post' }).click();
  await page.getByLabel('Title').fill('Original');
  await page.getByLabel('Content').fill('Original words');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Original' })).toBeVisible();
  const beforeEdit = await page.evaluate(() => localStorage.getItem('writespace_posts'));
  await page.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Title').fill('Unsaved revision');
  await page.getByLabel('Content').fill('Changed words');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Original' })).toBeVisible();
  await expect(page.getByText('Original words')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('writespace_posts'))).toBe(beforeEdit);
});

test('another writer is redirected when directly editing an owned post', async ({ page, context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'bob', username: 'bob', displayName: 'Bob', role: 'user' }));
    localStorage.setItem('writespace_posts', JSON.stringify([{ id: 'alice-post', title: 'Alice only', content: 'Private ownership', createdAt: '2025-01-01T00:00:00Z', authorId: 'alice', authorName: 'Alice' }]));
  });
  await page.goto('/edit/alice-post');
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByText('Alice only')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit Alice only' })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts'))[0].content)).toBe('Private ownership');
});

test('missing reader ID shows not found and a working back link', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('writespace_session', JSON.stringify({ userId: 'alice', username: 'alice', displayName: 'Alice', role: 'user' })));
  await page.goto('/blog/missing');
  await expect(page.getByRole('heading', { name: 'Post not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to All Posts' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByText('No blogs yet. Be the first to write one!')).toBeVisible();
});
