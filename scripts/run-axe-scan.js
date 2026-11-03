import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startPreview } from './serve-dist.js';

const preview = process.env.AXE_BASE_URL ? null : await startPreview();
const base = process.env.AXE_BASE_URL || preview.url;
const pages = [
  '/',
  '/research/',
  '/publications/',
  '/cv/',
  '/contact/',
  '/press/',
  '/talks/',
  '/posts/',
  '/posts/hello-world/',
  '/demos/spin-explorer/',
  '/demos/model-card/',
  '/demos/cpcg-embedding/',
  '/privacy/',
  '/accessibility/',
];
const browser = await chromium.launch();
let violations = 0;
try {
  for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({
      colorScheme,
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    // Citation counts are an optional third-party enhancement; the scan must work offline.
    await page.route('https://inspirehep.net/**', (route) => route.abort());
    for (const path of pages) {
      const response = await page.goto(new URL(path, base).href);
      if (!response?.ok()) throw new Error(`${path}: HTTP ${response?.status()}`);
      if (path.includes('spin-explorer')) await page.locator('canvas').first().waitFor();
      if (path.includes('model-card') && path.startsWith('/demos/'))
        await page.locator('#precision-value:not(:empty)').waitFor();
      if (path.includes('cpcg-embedding'))
        await page.locator('[data-testid="embedding-status"][data-busy="false"]').waitFor();
      const results = await new AxeBuilder({ page }).analyze();
      violations += results.violations.length;
      console.log(`${colorScheme} ${path}: ${results.violations.length} accessibility violations`);
      for (const violation of results.violations)
        console.error(
          JSON.stringify({
            rule: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.map((node) => ({ html: node.html, issue: node.failureSummary })),
          }),
        );
    }
    await context.close();
  }
  if (violations) throw new Error(`${violations} accessibility violations`);
} finally {
  await browser.close();
  if (preview) await new Promise((ok) => preview.server.close(ok));
}
