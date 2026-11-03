import { readFileSync } from 'node:fs';
import { parseHeaders, validateHeaders } from './security-policy.js';
import { checkLiveHeaders } from './check-live-headers.js';

const target = process.argv[2] || process.env.HEADER_CHECK_URL;
if (target) {
  const expected = parseHeaders(readFileSync('dist/_headers', 'utf8'));
  const base = new URL(target);
  if (base.protocol !== 'https:') throw new Error('Production header checks require HTTPS');
  const paths = process.argv.includes('--root-only')
    ? ['']
    : ['', 'cv/', 'publications/', 'talks/', 'AJ_Wildridge_CV.pdf'];
  for (const path of paths) {
    const url = new URL(path, base.href.endsWith('/') ? base : new URL(base.href + '/'));
    await checkLiveHeaders(url, expected);
    console.log(`Verified security headers: ${url}`);
  }
} else {
  const headers = parseHeaders(readFileSync('dist/_headers', 'utf8'));
  validateHeaders(headers);
  const apache = readFileSync('dist/.htaccess', 'utf8');
  for (const [name, value] of Object.entries(headers)) {
    if (!apache.includes(`Header always set ${name} "${value}"`))
      throw new Error(`Apache header mismatch: ${name}`);
  }
}
console.log('Security header validation passed.');
