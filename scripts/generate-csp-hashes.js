import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist';
const HEADERS_FILE = join(DIST_DIR, '_headers');

function walkHtml(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(path));
    if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function hashCsp(value) {
  return `'sha256-${createHash('sha256').update(value).digest('base64')}'`;
}

function addDirective(csp, directive, values) {
  const uniqueValues = Array.from(new Set(values)).sort();
  if (uniqueValues.length === 0) return csp;

  const pattern = new RegExp(`(^|;\\s*)${directive}\\s+([^;]*)`);
  if (pattern.test(csp)) {
    return csp.replace(pattern, (_, prefix, existing) => {
      const parts = Array.from(new Set([...existing.trim().split(/\s+/), ...uniqueValues]));
      return `${prefix}${directive} ${parts.join(' ')}`;
    });
  }
  return `${csp}; ${directive} ${uniqueValues.join(' ')}`;
}

if (!existsSync(HEADERS_FILE)) {
  throw new Error('Missing dist/_headers. Run astro build before generating CSP hashes.');
}

const scriptHashes = new Set();
const styleElementHashes = new Set();
const styleAttributeHashes = new Set();

for (const file of walkHtml(DIST_DIR)) {
  const html = readFileSync(file, 'utf8');

  for (const match of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (match[1].trim()) scriptHashes.add(hashCsp(match[1]));
  }

  for (const match of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (match[1].trim()) styleElementHashes.add(hashCsp(match[1]));
  }

  for (const match of html.matchAll(/\sstyle="([^"]+)"/gi)) {
    if (match[1].trim()) styleAttributeHashes.add(hashCsp(match[1]));
  }
}

let headers = readFileSync(HEADERS_FILE, 'utf8');
headers = headers.replace(/Content-Security-Policy:\s*(.+)/, (_, csp) => {
  let nextCsp = csp.trim();
  nextCsp = addDirective(nextCsp, 'script-src', scriptHashes);
  nextCsp = addDirective(nextCsp, 'style-src-elem', [
    "'self'",
    'https://fonts.googleapis.com',
    ...styleElementHashes,
  ]);
  nextCsp = addDirective(nextCsp, 'style-src-attr', ["'unsafe-hashes'", ...styleAttributeHashes]);
  return `Content-Security-Policy: ${nextCsp}`;
});

writeFileSync(HEADERS_FILE, headers);
console.log(
  `CSP hashes generated: ${scriptHashes.size} scripts, ${styleElementHashes.size} style blocks, ${styleAttributeHashes.size} style attributes.`,
);
