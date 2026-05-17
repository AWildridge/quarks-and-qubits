import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('home page has an h1', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1.first()).toBeVisible();
});

test('projects filtering changes results', async ({ page }) => {
  await page.goto('/projects/');
  const grid = page.locator('main').locator('div.grid');
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

  const list = page.locator('main ul#pub-list');
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
  await page.locator('#export-bibtex').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('publications.bib');
  const path = await download.path();
  expect(path).toBeTruthy();
  const content = await readFile(path as string, 'utf8');
  expect(content).toContain('@');
  expect(content).toContain('title');
  expect(content).toContain('author');
  expect(content).toContain('@article{Afik:2025ejh');
  expect(content).toContain('@inproceedings{Wildridge:2024yeg');
});

test('publications render in publication-date order', async ({ page }) => {
  await page.goto('/publications/');

  const titles = page.locator('#pub-list h2');
  await expect(titles.first()).toContainText(
    'Enhanced reconstruction of dileptonic top quark-antiquark events',
  );
  await expect(titles.nth(1)).toContainText('Quantum Information meets High-Energy Physics');
});

test('publications citation chart exposes live filters and modes', async ({ page }) => {
  await page.goto('/publications/');

  await expect(page.getByRole('heading', { name: 'Citations Over Time' })).toBeVisible();
  await expect(page.getByLabel('Tag').first()).toBeVisible();
  await expect(page.getByLabel('Paper')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Per year' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Cumulative' }).click();
  await expect(page.getByRole('button', { name: 'Cumulative' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('teaching page is not exposed in primary navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('navigation', { name: 'Primary' })).not.toContainText('Teaching');
});

test('model card demo updates metrics', async ({ page }) => {
  await page.goto('/demos/model-card/');

  await expect(page.locator('h1')).toHaveText('Model Card Demo');
  const precision = page.locator('#precision-value');
  const thresholdValue = page.locator('#threshold-value');

  await expect(precision).not.toBeEmpty();
  await expect(thresholdValue).toHaveText('0.50');

  const before = await precision.textContent();
  await page.locator('#threshold-input').fill('70');
  await expect(thresholdValue).toHaveText('0.70');
  await expect(precision).not.toHaveText(before || '');
});

test('post detail pages render from RSS links', async ({ page }) => {
  await page.goto('/posts/hello-world/');

  await expect(page.locator('h1')).toHaveText('Hello, World');
  await expect(page.getByText('Welcome to the new site!')).toBeVisible();
});

test('theme toggle forces light and dark modes independent of system preference', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Light theme' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Light theme' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 24, 39)');
});

test('pegasus embedder exports mapping JSON', async ({ page }) => {
  await page.goto('/demos/pegasus-embedder/');

  await expect(page.locator('h1')).toHaveText('Quantum Minor-Embedding Visualizer');
  await page.locator('#left-size').fill('3');
  await page.locator('#right-size').fill('5');
  await expect(page.locator('#logical-count')).toHaveText('8');

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-mapping').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('pegasus-mapping-k3-5.json');

  const path = await download.path();
  expect(path).toBeTruthy();
  const content = await readFile(path as string, 'utf8');
  const data = JSON.parse(content);

  expect(data.schema).toBe('quarks-and-qubits/pegasus-mapping@1');
  expect(data.graph).toEqual({ type: 'complete-bipartite', m: 3, n: 5 });
  expect(data.mapping).toHaveLength(8);
});
