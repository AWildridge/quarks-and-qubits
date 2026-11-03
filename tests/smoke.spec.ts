import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('home page has an h1', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1.first()).toBeVisible();
});

test('research replaces projects in navigation and old URLs still reach the work', async ({
  page,
}) => {
  await page.goto('/projects/');
  await page.waitForURL('**/research/');
  await expect(page.getByRole('navigation', { name: 'Primary' })).not.toContainText('Projects');
  await expect(page.getByRole('heading', { name: 'Studies & interactive tools' })).toBeVisible();
  await page.goto('/projects/example/');
  await page.waitForURL('**/research/spin-correlation-explorer/');
  await expect(page.locator('h1')).toHaveText('Spin Correlation Explorer');
});

test('every displayed abstract matches its official saved source including math', async ({
  page,
}) => {
  const sources = JSON.parse(await readFile('src/data/publication-sources.json', 'utf8')) as Record<
    string,
    { abstract: string }
  >;
  for (const [slug, source] of Object.entries(sources)) {
    await page.goto(`/publications/${slug}/`);
    const displayed = await page.locator('[data-official-abstract]').evaluate((node) => {
      const copy = node.cloneNode(true) as HTMLElement;
      for (const math of copy.querySelectorAll('.katex')) {
        const latex = math.querySelector('annotation[encoding="application/x-tex"]')?.textContent;
        math.replaceWith(document.createTextNode(`$${latex}$`));
      }
      return copy.textContent?.replace(/\s+/g, ' ').trim();
    });
    expect(displayed).toBe(
      source.abstract
        .replace(/\\([%&#_])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim(),
    );
  }
});

test('project filters work on a static site and preserve query links', async ({ page }) => {
  await page.goto('/research/?tag=quantum');
  const projects = page.locator('#project-list > a:visible');
  await expect(projects).toHaveCount(1);
  await expect(projects.first()).toContainText('Quantum Annealing');
  await page.getByRole('searchbox', { name: 'Search' }).fill('nothing matches this search');
  await expect(projects).toHaveCount(0);
  await expect(page.locator('[data-filter-empty]')).toBeVisible();
  await page.getByRole('link', { name: 'Clear filters' }).click();
  await expect(projects).toHaveCount(4);
});

test('publications year filter includes TOP-23-006 and the steering preprint', async ({ page }) => {
  await page.goto('/publications/');
  await page.locator('select[name="year"]').selectOption('2026');
  const papers = page.locator('#pub-list > li:visible');
  await expect(papers).toHaveCount(2);
  await expect(papers.first()).toContainText('CMS-PAS-TOP-23-006');
  await expect(papers.nth(1)).toContainText('Quantum Steering Geometry');
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
  await expect(titles.first()).toContainText('Measurement of the top quark polarization');
  await expect(titles.nth(1)).toContainText(
    'Quantum Steering Geometry at High Energy Particle Colliders',
  );
  await expect(titles.nth(2)).toContainText(
    'Enhanced reconstruction of dileptonic top quark-antiquark events',
  );
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
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 247, 243)');

  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(13, 22, 29)');
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

test('CV and talks include the verified 2026 work', async ({ page }) => {
  await page.goto('/cv/');
  await expect(
    page.getByText('Quantum Steering Geometry at High Energy Particle Colliders', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText('ML usage in statistical interpretation (ATLAS/CMS)', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Overview of recent ttbar spin and entanglement results from ATLAS and CMS', {
      exact: true,
    }),
  ).toBeVisible();
  const pdf = await page.request.get('/AJ_Wildridge_CV.pdf');
  expect(pdf.headers()['content-type']).toBe('application/pdf');
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  await page.goto('/talks/?year=2026');
  await expect(page.locator('#talk-list > li:visible')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Venue', exact: true }).selectOption('TOP2026');
  await expect(page.locator('#talk-list > li:visible')).toHaveCount(1);
  await expect(page.locator('#talk-list > li:visible')).toContainText('ML usage');
});

for (const path of [
  '/',
  '/research/',
  '/publications/',
  '/talks/',
  '/cv/',
  '/demos/spin-explorer/',
  '/demos/pegasus-embedder/',
  '/demos/model-card/',
]) {
  test(`production CSP permits page functionality: ${path}`, async ({ page }) => {
    const violations: string[] = [];
    const errors: string[] = [];
    await page.exposeFunction('reportCspViolation', (directive: string) =>
      violations.push(directive),
    );
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        (window as unknown as { reportCspViolation: (value: string) => void }).reportCspViolation(
          `${event.violatedDirective}: ${event.blockedURI}`,
        );
      });
    });
    await page.route('https://inspirehep.net/**', (route) => route.abort());
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(path);
    expect(response?.headers()['content-security-policy']).toContain("object-src 'none'");
    if (path.includes('spin-explorer')) await expect(page.locator('canvas')).toHaveCount(3);
    await page.getByRole('button', { name: 'Dark theme' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(errors).toEqual([]);
    expect(violations).toEqual([]);
  });
}

test('mobile layout has no horizontal overflow and navigation stays accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['/', '/research/', '/publications/', '/cv/', '/talks/']) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  }
});
