import { expect, test } from '@playwright/test';

test('navigate to scores', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.getByRole('heading', { name: /live now/i })).toBeVisible();
  await page.getByRole('link', { name: /scores/i }).click();
  await expect(page.getByRole('heading', { name: /scores/i })).toBeVisible();
});
