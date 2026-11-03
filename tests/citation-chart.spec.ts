import { test, expect } from '@playwright/test';

test('first citation bar clears the y-axis and both themes use their intended palette', async ({
  page,
}) => {
  await page.route('https://inspirehep.net/api/literature*', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('q') || '';
    const hits = query.startsWith('refersto:')
      ? [2019, 2019, 2020, 2022, 2023].map((year) => ({
          metadata: { earliest_date: `${year}-01-01` },
        }))
      : [{ metadata: { control_number: 12345, citation_count: 5 } }];
    await route.fulfill({ json: { hits: { hits, total: hits.length } } });
  });
  await page.goto('/publications/');
  await page.getByRole('button', { name: 'Light theme', exact: true }).click();
  await expect(page.locator('#citation-chart-status')).toContainText('loaded for 9 of 9');
  const bar = page.locator('[data-citation-year="2019"]');
  const axis = page.locator('[data-chart-axis="y"]');
  const barBox = await bar.boundingBox(),
    axisBox = await axis.boundingBox();
  expect(barBox!.x).toBeGreaterThan(axisBox!.x + 8);
  await expect(bar).toHaveAttribute('fill', '#287985');
  await expect(page.locator('#citation-chart > rect').first()).toHaveAttribute('fill', '#f8f7f3');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(bar).toHaveAttribute('fill', '#60a5fa');
  await expect(page.locator('#citation-chart > rect').first()).toHaveAttribute('fill', '#111827');
  await page.getByRole('button', { name: 'Cumulative', exact: true }).click();
  const points = await page.locator('#citation-chart polyline').getAttribute('points');
  expect(Number(points!.split(',')[0])).toBeGreaterThan(Number(await axis.getAttribute('x1')));
});
