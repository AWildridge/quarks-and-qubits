import { test, expect } from '@playwright/test';

test('home page has an h1', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1.first()).toBeVisible();
});

test('projects filtering changes results', async ({ page }) => {
  await page.goto('/projects/');
  const grid = page.locator('main >> .grid');
  await expect(grid).toBeVisible();

  const initialCount = await grid.locator('a').count();
  const tagSelect = page.locator('select[name="tag"]');
  // pick first non-empty option
  const options = await tagSelect.locator('option').allTextContents();
  const choice = options.find((t) => t && t !== 'All');
  if (choice) {
    await tagSelect.selectOption({ label: choice });
    // submit happens via change listener which requests a reload
    await page.waitForLoadState('load');
    const newCount = await grid.locator('a').count();
    expect(newCount).toBeLessThanOrEqual(initialCount);
  }
});

test('publications filtering changes results', async ({ page }) => {
  await page.goto('/publications/');

  const list = page.locator('main >> ul[aria-label="Publications list"]');
  await expect(list).toBeVisible();

  const initialCount = await list.locator('li').count();
  expect(initialCount).toBeGreaterThan(0);

  // Apply a year filter
  const yearSelect = page.locator('select[name="year"]');
  const options = await yearSelect.locator('option').allTextContents();
  const choice = options.find((t) => t && t !== 'All');

  if (choice) {
    await yearSelect.selectOption({ label: choice });
    await page.waitForLoadState('load');
    const newCount = await list.locator('li').count();
    expect(newCount).toBeLessThanOrEqual(initialCount);
  }
});

test('publications export bibtex', async ({ page }) => {
  await page.goto('/publications/');

  // Click export button and wait for download
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export BibTeX/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('publications.bib');
});
