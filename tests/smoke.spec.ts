import { test, expect } from '@playwright/test';

test('home page has an h1', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1.first()).toBeVisible();
});
