import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { mkdir, writeFile } from 'node:fs/promises';
import { startPreview } from './serve-dist.js';

const preview = process.env.LIGHTHOUSE_BASE_URL ? null : await startPreview();
const base = process.env.LIGHTHOUSE_BASE_URL || preview.url;
const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
const paths = [
  '/',
  '/cv/',
  '/contact/',
  '/demos/spin-explorer/',
  '/demos/model-card/',
  '/demos/pegasus-embedder/',
  '/posts/',
  '/publications/',
  '/research/',
];
const failures = [];
await mkdir('.lighthouseci', { recursive: true });
try {
  for (const path of paths) {
    const reports = [];
    for (let run = 0; run < 3; run++) {
      const result = await lighthouse(
        new URL(path, base).href,
        {
          port: 9222,
          output: ['json', 'html'],
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        },
        {
          extends: 'lighthouse:default',
          settings: {
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
            blockedUrlPatterns: ['https://inspirehep.net/*'],
          },
        },
      );
      if (!result || result.lhr.runtimeError)
        throw new Error(`Lighthouse failed for ${path}: ${result?.lhr.runtimeError?.message}`);
      reports.push(result.lhr);
      const filename = path.replaceAll('/', '_') || 'home';
      await writeFile(`.lighthouseci/${filename}-${run}.json`, result.report[0]);
      await writeFile(`.lighthouseci/${filename}-${run}.html`, result.report[1]);
    }
    const median = reports.sort(
      (a, b) => a.categories.performance.score - b.categories.performance.score,
    )[1];
    const scores = Object.fromEntries(
      Object.entries(median.categories).map(([key, value]) => [key, value.score]),
    );
    console.log(path, scores);
    for (const [category, minimum] of Object.entries({
      performance: 0.95,
      accessibility: 1,
      'best-practices': 0.9,
      seo: 0.95,
    })) {
      if (scores[category] < minimum)
        failures.push(`${path}: ${category} ${scores[category]} < ${minimum}`);
    }
    for (const [audit, maximum] of Object.entries({
      'largest-contentful-paint': 2500,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 200,
    })) {
      if (median.audits[audit].numericValue > maximum)
        failures.push(`${path}: ${audit} exceeded ${maximum}`);
    }
  }
  if (failures.length) throw new Error(failures.join('\n'));
} finally {
  await browser.close();
  if (preview) await new Promise((ok) => preview.server.close(ok));
}
