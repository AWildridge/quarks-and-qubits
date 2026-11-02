import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { baseHeaders, policyFor } from './security-policy.js';
import { inlineHashes } from './html-security.js';

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}
const hashes = { scripts: new Set(), styles: new Set(), attributes: new Set() };
for (const path of htmlFiles('dist')) {
  const found = inlineHashes(readFileSync(path, 'utf8'));
  for (const key of Object.keys(hashes)) for (const hash of found[key]) hashes[key].add(hash);
}
const csp = policyFor(hashes);
// A shared policy works for Apache and static hosts, including client-rendered islands.
if (Buffer.byteLength(csp) > 14000)
  throw new Error('CSP is too large for the hosting header budget');
const headers = { 'Content-Security-Policy': csp, ...baseHeaders };
writeFileSync(
  'dist/_headers',
  '/*\n' +
    Object.entries(headers)
      .map(([name, value]) => `  ${name}: ${value}\n`)
      .join(''),
);
writeFileSync(
  'dist/.htaccess',
  [
    '# Generated from the exact built HTML. Apache must allow FileInfo overrides.',
    'Options -Indexes',
    'DirectoryIndex index.html',
    '<IfModule mod_headers.c>',
    ...Object.entries(headers).flatMap(([name, value]) => [
      `  Header onsuccess unset ${name}`,
      `  Header always set ${name} "${value}"`,
    ]),
    '</IfModule>',
    '<FilesMatch "^\\.">',
    '  Require all denied',
    '</FilesMatch>',
    '',
  ].join('\n'),
);
console.log(
  `Generated security headers and Apache configuration (${Buffer.byteLength(csp)} byte CSP).`,
);
