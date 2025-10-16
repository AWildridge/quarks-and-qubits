/**
 * Playwright tests for Spin Correlation Explorer
 */

import { test, expect } from '@playwright/test';

test.describe('Spin Correlation Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/spin-explorer');
  });

  test('page loads with title and introduction', async ({ page }) => {
    await expect(page).toHaveTitle(/Spin Correlation Explorer/);
    await expect(
      page.getByRole('heading', { name: 'Interactive Spin Correlation Explorer' }),
    ).toBeVisible();
    await expect(page.getByText(/What are Spin Correlations/)).toBeVisible();
  });

  test('all controls are present and interactive', async ({ page }) => {
    // Wait for React island to load
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Check dropdowns
    await expect(page.locator('#production-mode')).toBeVisible();
    await expect(page.locator('#basis')).toBeVisible();
    await expect(page.locator('#energy')).toBeVisible();

    // Check sliders
    await expect(page.locator('#theta')).toBeVisible();
    await expect(page.locator('#phi')).toBeVisible();

    // Check canvases
    const canvases = page.locator('canvas');
    await expect(canvases).toHaveCount(2); // Heatmap and vector plot
  });

  test('changing production mode updates visualization', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Get initial canvas data
    const heatmap = page.locator('canvas').first();
    const initialImage = await heatmap.screenshot();

    // Change production mode
    await page.selectOption('#production-mode', 'qqbar');

    // Wait for update (brief delay for rendering)
    await page.waitForTimeout(500);

    // Canvas should have changed
    const updatedImage = await heatmap.screenshot();
    expect(initialImage).not.toEqual(updatedImage);
  });

  test('changing basis updates visualization', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    const heatmap = page.locator('canvas').first();
    const initialImage = await heatmap.screenshot();

    // Change basis
    await page.selectOption('#basis', 'beam');
    await page.waitForTimeout(500);

    const updatedImage = await heatmap.screenshot();
    expect(initialImage).not.toEqual(updatedImage);
  });

  test('theta slider updates angle display', async ({ page }) => {
    await page.waitForSelector('#theta', { timeout: 10000 });

    // Get initial value
    const initialLabel = await page.locator('label[for="theta"]').textContent();
    expect(initialLabel).toContain('°');

    // Move slider
    const slider = page.locator('#theta');
    await slider.fill(String(Math.PI / 2)); // 90 degrees

    // Check updated label
    const updatedLabel = await page.locator('label[for="theta"]').textContent();
    expect(updatedLabel).toContain('90');
  });

  test('phi slider updates angle display', async ({ page }) => {
    await page.waitForSelector('#phi', { timeout: 10000 });

    const slider = page.locator('#phi');
    await slider.fill(String(Math.PI)); // 180 degrees

    const label = await page.locator('label[for="phi"]').textContent();
    expect(label).toContain('180');
  });

  test('keyboard navigation works on controls', async ({ page }) => {
    await page.waitForSelector('#production-mode', { timeout: 10000 });

    // Tab through controls
    await page.keyboard.press('Tab'); // Should focus first interactive element
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check that sliders can be controlled with keyboard
    const theta = page.locator('#theta');
    await theta.focus();
    await page.keyboard.press('ArrowRight');

    // Value should have changed
    const value = await theta.evaluate((el: HTMLInputElement) => parseFloat(el.value));
    expect(value).toBeGreaterThan(0);
  });

  test('heatmap canvas is keyboard accessible', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    const heatmap = page.locator('canvas').first();
    await heatmap.focus();

    // Should be focusable
    await expect(heatmap).toBeFocused();

    // Arrow keys should navigate (check aria-label updates)
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');

    // Check for screen reader announcement
    const srText = await page.locator('.sr-only[aria-live="polite"]').textContent();
    expect(srText).toBeTruthy();
    expect(srText).toContain('C_');
  });

  test('export PNG button triggers download', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.getByRole('button', { name: /Export PNG/i }).click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.png');
  });

  test('export SVG button triggers download', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export SVG/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.svg');
  });

  test('export JSON button triggers download', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export Parameters/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');

    // Verify JSON content structure
    const path = await download.path();
    if (path) {
      const fs = await import('fs/promises');
      const content = await fs.readFile(path, 'utf-8');
      const data = JSON.parse(content);

      expect(data).toHaveProperty('parameters');
      expect(data).toHaveProperty('correlationMatrix');
      expect(data).toHaveProperty('timestamp');
      expect(data.parameters).toHaveProperty('productionMode');
      expect(data.parameters).toHaveProperty('basis');
      expect(data.parameters).toHaveProperty('theta');
      expect(data.parameters).toHaveProperty('phi');
    }
  });

  test('responsive: visualizations render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForSelector('canvas', { timeout: 10000 });

    const canvases = page.locator('canvas');
    await expect(canvases).toHaveCount(2);

    // Both should be visible
    await expect(canvases.first()).toBeVisible();
    await expect(canvases.nth(1)).toBeVisible();
  });

  test('parameter live region announces changes', async ({ page }) => {
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Change production mode
    await page.selectOption('#production-mode', 'qqbar');

    // Check live region updates
    const liveRegion = page.locator('[aria-live="polite"]').last();
    const text = await liveRegion.textContent();

    expect(text).toContain('qqbar');
  });

  test('all reference links are present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Related Work/i })).toBeVisible();
    await expect(page.getByText(/Key Publications/i)).toBeVisible();
    await expect(page.getByText(/Code & Data/i)).toBeVisible();
  });

  test('accessibility footer notes are present', async ({ page }) => {
    await expect(page.getByText(/Keyboard Accessibility/i)).toBeVisible();
    await expect(page.getByText(/Citation/i)).toBeVisible();
  });
});
