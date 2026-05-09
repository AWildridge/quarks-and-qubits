import { existsSync, readFileSync } from 'node:fs';

const required = [
  'Content-Security-Policy:',
  'X-Frame-Options:',
  'X-Content-Type-Options:',
  'Referrer-Policy:',
  'Permissions-Policy:',
];

async function readHeaders() {
  const targetUrl = process.argv[2] || process.env.HEADER_CHECK_URL;
  if (targetUrl) {
    const response = await fetch(targetUrl, { method: 'HEAD', redirect: 'manual' });
    return Array.from(response.headers.entries())
      .map(([name, value]) => `${name}: ${value}`)
      .join('\n');
  }

  const headersPath = existsSync('dist/_headers') ? 'dist/_headers' : 'public/_headers';
  return readFileSync(headersPath, 'utf8');
}

const headers = await readHeaders();

for (const header of required) {
  if (!headers.toLowerCase().includes(header.toLowerCase())) {
    throw new Error(`Missing required security header: ${header}`);
  }
}

const blockedInlineToken = `unsafe-${'inline'}`;
if (headers.toLowerCase().includes(blockedInlineToken)) {
  throw new Error(`Content security policy must not include ${blockedInlineToken}.`);
}

console.log('Security header validation passed.');
