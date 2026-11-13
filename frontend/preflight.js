/** Capture representative rendered views for human review. */
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
const output = [];
await mkdir('test-results/preflight', { recursive: true });
for (const [name, viewport, route] of [
  ['desktop-home', { width: 1440, height: 900 }, '/'],
  ['mobile-login', { width: 375, height: 812 }, '/login'],
]) {
  const page = await browser.newPage({ viewport });
  await page.goto(`http://127.0.0.1:4173${route}`);
  await page.screenshot({ path: `test-results/preflight/${name}.png`, fullPage: true });
  const accessibility = await page.locator('body').ariaSnapshot();
  const styles = await page.evaluate(() => ({ font: getComputedStyle(document.body).fontFamily, background: getComputedStyle(document.body).backgroundColor }));
  output.push(`${name}\n${accessibility}\n${JSON.stringify(styles)}\n${await page.content()}`);
  await page.close();
}
await writeFile('test-results/preflight/report.txt', output.join('\n\n'));
await browser.close();
