import { readFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';

const expected = readFileSync('dist/index.html', 'utf8').trim();
const base = new URL(process.argv[2]);
const retiredPaths = [
  'research/',
  'projects/',
  'publications/',
  'talks/',
  'cv/',
  'press/',
  'AJ_Wildridge_CV.pdf',
  'data/projects.json',
];

for (let attempt = 1; attempt <= 6; attempt++) {
  try {
    for (const path of ['', ...retiredPaths]) {
      const response = await fetch(new URL(path, base), {
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
      const body = await response.text();
      if (!path && (!response.ok || body.trim() !== expected)) {
        throw new Error('The public homepage does not yet match the coming-soon page');
      }
      if (path && ![404, 410].includes(response.status)) {
        throw new Error(`Unpublished path remains accessible: ${path} (${response.status})`);
      }
    }
    console.log('Coming-soon page verified; previous pages and downloads are unavailable.');
    break;
  } catch (error) {
    if (attempt === 6) throw error;
    console.warn(`Waiting for publication changes (${attempt}/6): ${error.message}`);
    await setTimeout(5000);
  }
}
