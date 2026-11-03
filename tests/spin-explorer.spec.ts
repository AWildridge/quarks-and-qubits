import { expect, test } from '@playwright/test';

test.describe('Spin Correlation Explorer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demos/spin-explorer');
    await page.waitForSelector('canvas', { timeout: 10000 });
    // The canvas exists in server-rendered HTML before React attaches input handlers.
    await expect(page.getByText(/Reference data loaded/)).toBeVisible({ timeout: 10000 });
  });

  test('page loads the integration controls', async ({ page }) => {
    await expect(page).toHaveTitle(/Spin Correlation Explorer/);
    await expect(
      page.getByRole('heading', { name: 'Interactive Spin Correlation Explorer' }),
    ).toBeVisible();
    await expect(page.locator('#sqrt-s')).toBeVisible();
    await expect(page.locator('#sqrt-s')).toHaveValue('13.6');
    await expect(page.locator('#integration-method')).toBeVisible();
    await expect(page.locator('#mtt-min')).toBeVisible();
    await expect(page.locator('#mtt-max')).toBeVisible();
    await expect(page.locator('#phase-observable')).toBeVisible();
    await expect(page.locator('#phase-observable option[value="A"]')).toHaveCount(0);
    await expect(page.locator('#phase-observable option[value="Delta"]')).toHaveText(
      'Δ entanglement witness',
    );
    await expect(page.locator('#wilson-coefficient-0')).toBeVisible();
    await expect(page.locator('#wilson-value-0')).toBeVisible();
    await expect(page.getByText(/Reference data loaded/)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('canvas')).toHaveCount(3);
  });

  test('changing integration settings updates the phase-space plot', async ({ page }) => {
    const phaseCanvas = page.locator('canvas').first();
    const initialImage = await phaseCanvas.screenshot();

    await page.locator('#mtt-min').fill('0.50');
    await page.locator('#z-max').fill('0.50');
    await page.waitForTimeout(300);

    const updatedImage = await phaseCanvas.screenshot();
    expect(initialImage).not.toEqual(updatedImage);
  });

  test('mtt upper limit follows center-of-mass energy', async ({ page }) => {
    await expect(page.locator('#mtt-max')).toHaveAttribute('max', '13.5864');
    await page.locator('#sqrt-s').fill('7');
    await expect(page.locator('#mtt-max')).toHaveAttribute('max', '6.993');
  });

  test('changing Wilson coefficient value updates the integrated result', async ({ page }) => {
    const deltaBefore = await page.getByTestId('metric-delta').textContent();

    await page.locator('#wilson-value-0').fill('0.000001');
    await page.waitForTimeout(300);

    const deltaAfter = await page.getByTestId('metric-delta').textContent();
    expect(deltaBefore).not.toEqual(deltaAfter);
  });

  test('default C_rk is in the expected range', async ({ page }) => {
    const text = await page.getByTestId('metric-crk').textContent();
    const value = Number(text?.replace('C_rk', ''));
    expect(value).toBeGreaterThan(0.09);
    expect(value).toBeLessThan(0.13);
  });

  test('off-diagonal C_rk and C_kr are symmetric', async ({ page }) => {
    const crkText = await page.getByTestId('metric-crk').textContent();
    const ckrText = await page.getByTestId('metric-ckr').textContent();
    const crk = Number(crkText?.replace('C_rk', ''));
    const ckr = Number(ckrText?.replace('C_kr', ''));
    expect(ckr).toBeCloseTo(crk, 4);
  });

  test('can add and remove a coefficient row', async ({ page }) => {
    await page.getByRole('button', { name: 'Add coefficient' }).click();
    await expect(page.locator('#wilson-coefficient-1')).toBeVisible();
    await page.getByRole('button', { name: /Remove cQq83/ }).click();
    await expect(page.locator('#wilson-coefficient-1')).toHaveCount(0);
  });

  test('steering ellipsoid rotates on drag', async ({ page }) => {
    const ellipsoid = page.locator('canvas').nth(2);
    const initialImage = await ellipsoid.screenshot();
    const box = await ellipsoid.boundingBox();
    expect(box).toBeTruthy();
    if (!box) return;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40);
    await page.mouse.up();
    await page.waitForTimeout(150);

    const updatedImage = await ellipsoid.screenshot();
    expect(initialImage).not.toEqual(updatedImage);
  });

  test('steering ellipsoid zoom changes the view', async ({ page }) => {
    const ellipsoid = page.locator('canvas').nth(2);
    const initialImage = await ellipsoid.screenshot();
    await page.locator('#ellipsoid-zoom').evaluate((input: HTMLInputElement) => {
      input.value = '1.80';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(150);
    const updatedImage = await ellipsoid.screenshot();
    expect(initialImage).not.toEqual(updatedImage);
  });

  test('export buttons trigger downloads', async ({ page }) => {
    for (const [name, extension] of [
      [/Export PNG/i, '.png'],
      [/Export SVG/i, '.svg'],
      [/Export JSON/i, '.json'],
    ] as const) {
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(extension);
    }
  });

  test('responsive: visualizations render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('canvas')).toHaveCount(3);
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.locator('canvas').nth(2)).toBeVisible();
  });

  test('live region announces integration changes', async ({ page }) => {
    await page.selectOption('#integration-method', 'rect');
    const liveRegion = page.locator('[aria-live="polite"]').last();
    await expect(liveRegion).toContainText('rect');
  });

  test('public page does not expose private code references', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Learn More/i })).toBeVisible();
    await expect(page.getByText(/Source code/i)).toHaveCount(0);
    await expect(page.locator('article').getByRole('link', { name: /GitHub/i })).toHaveCount(0);
    await expect(page.locator('article code').filter({ hasText: /src\//i })).toHaveCount(0);
  });
});
