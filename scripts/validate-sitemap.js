import { existsSync, readFileSync } from 'node:fs';

const path = 'dist/sitemap.xml';
if (!existsSync(path)) {
  throw new Error('Missing dist/sitemap.xml. Run the build before sitemap validation.');
}

const sitemap = readFileSync(path, 'utf8').trim();
if (!sitemap.startsWith('<?xml')) {
  throw new Error('Sitemap is missing XML declaration.');
}
if (!/<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(sitemap)) {
  throw new Error('Sitemap is missing a valid urlset namespace.');
}
const locs = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => match[1]);
if (locs.length === 0) {
  throw new Error('Sitemap contains no loc entries.');
}
for (const loc of locs) {
  if (!loc.startsWith('https://aj-wildridge.web.cern.ch/')) {
    throw new Error(`Unexpected sitemap URL: ${loc}`);
  }
}

console.log(`Sitemap validation passed: ${locs.length} URLs.`);
