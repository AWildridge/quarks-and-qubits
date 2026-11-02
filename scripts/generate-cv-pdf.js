import { chromium } from '@playwright/test';
import { startPreview } from './serve-dist.js';

const { server, url } = await startPreview();
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage({ colorScheme: 'light' });
  const failures = [];
  page.on('requestfailed', (request) => failures.push(request.url()));
  const response = await page.goto(`${url}/cv/`, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error('CV page failed to load');
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print', colorScheme: 'light' });
  if (failures.length) throw new Error(`CV resources failed to load: ${failures.join(', ')}`);
  await page.pdf({
    path: 'dist/AJ_Wildridge_CV.pdf',
    format: 'Letter',
    printBackground: false,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
  });
  console.log('Generated dist/AJ_Wildridge_CV.pdf with local styles and fonts.');
} finally {
  await browser?.close();
  await new Promise((ok) => server.close(ok));
}
