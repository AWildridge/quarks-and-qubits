import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { parse } from 'parse5';
import { parseHeaders, validateHeaders } from './security-policy.js';
import { inlineHashes, walkNodes } from './html-security.js';

const root = resolve('dist');
const errors = [];
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(resolve(dir, entry.name)) : [resolve(dir, entry.name)],
  );
}
const built = files(root);
const directives = validateHeaders(parseHeaders(readFileSync(resolve(root, '_headers'), 'utf8')));
const ids = new Map();
for (const file of built.filter((path) => path.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  const found = inlineHashes(html);
  for (const [key, directive] of [
    ['scripts', 'script-src'],
    ['styles', 'style-src-elem'],
    ['attributes', 'style-src-attr'],
  ]) {
    for (const hash of found[key])
      if (!directives.get(directive).includes(hash))
        errors.push(`${file}: unapproved inline ${key}`);
  }
  const anchors = new Set();
  walkNodes(parse(html), (node) => {
    const id = node.attrs?.find((attr) => attr.name === 'id')?.value;
    if (id) anchors.add(id);
  });
  ids.set(file, anchors);
}
for (const [file] of ids) {
  walkNodes(parse(readFileSync(file, 'utf8')), (node) => {
    for (const { name, value } of node.attrs || []) {
      if (/^on/i.test(name)) errors.push(`${file}: inline event handler ${name}`);
      if (!['href', 'src', 'poster', 'action', 'data', 'srcset'].includes(name)) continue;
      if (/^\s*(javascript|vbscript):/i.test(value)) errors.push(`${file}: unsafe URL`);
      if (/^\s*http:\/\//i.test(value) && !(node.tagName === 'a' && name === 'href'))
        errors.push(`${file}: mixed content ${value}`);
      if (!value || /^(?:[a-z][\w+.-]*:|\/\/)/i.test(value) || name === 'srcset') continue;
      const currentPath = file.slice(root.length).replace(/index\.html$/, '');
      const url = new URL(value, `https://site.invalid${currentPath}`);
      let target = resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!target.startsWith(root + '/') && target !== root) {
        errors.push(`${file}: path escape`);
        continue;
      }
      if (existsSync(target) && statSync(target).isDirectory())
        target = resolve(target, 'index.html');
      if (!existsSync(target)) {
        errors.push(`${file}: missing local target ${value}`);
        continue;
      }
      if (
        url.hash &&
        ids.has(target) &&
        !ids.get(target).has(decodeURIComponent(url.hash.slice(1)))
      )
        errors.push(`${file}: missing anchor ${value}`);
    }
  });
}
for (const file of built) {
  if (/\.(?:map|pem|key|env|docx)$/.test(file) || /(?:^|\/)\.env(?:\.|$)/.test(file))
    errors.push(`Private/development artifact in build: ${file}`);
  if (['.js', '.html', '.json', '.txt'].includes(extname(file))) {
    const text = readFileSync(file, 'utf8');
    if (
      /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|\b(?:ghp|github_pat)_[A-Za-z0-9_]{30,}/.test(
        text,
      )
    )
      errors.push(`Possible credential in build: ${file}`);
  }
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(
  `Validated ${ids.size} HTML pages: local links, anchors, CSP hashes, mixed content and private artifacts.`,
);
