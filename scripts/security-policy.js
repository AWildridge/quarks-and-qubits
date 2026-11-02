import { createHash } from 'node:crypto';

export const baseHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000',
};

export function hashCsp(value) {
  return `'sha256-${createHash('sha256').update(value).digest('base64')}'`;
}

export function policyFor({ scripts, styles, attributes }) {
  const sorted = (values) => [...values].sort().join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' ${sorted(scripts)}`.trim(),
    "script-src-attr 'none'",
    "style-src 'self'",
    `style-src-elem 'self' ${sorted(styles)}`.trim(),
    attributes.size
      ? `style-src-attr 'unsafe-hashes' ${sorted(attributes)}`
      : "style-src-attr 'none'",
    "font-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self' https://inspirehep.net",
    "media-src 'self' https://indico.cern.ch",
    'frame-src https://www.youtube-nocookie.com',
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join('; ');
}

export function parseHeaders(text) {
  return Object.fromEntries(
    text
      .split('\n')
      .map((line) => /^\s+([\w-]+):\s*(.+)$/.exec(line))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

export function validateHeaders(headers) {
  const get = (name) =>
    headers.get
      ? headers.get(name)
      : Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  for (const [key, value] of Object.entries(baseHeaders)) {
    if (key === 'Strict-Transport-Security') {
      if (
        !/max-age=(\d+)/i.test(get(key) || '') ||
        Number(/max-age=(\d+)/i.exec(get(key))[1]) < 31536000
      )
        throw new Error('Missing or weak HSTS');
    } else if (get(key) !== value) throw new Error(`Missing or unexpected ${key}`);
  }
  const csp = get('Content-Security-Policy') || '';
  const directives = new Map(
    csp.split(';').map((part) => {
      const [name, ...values] = part.trim().split(/\s+/);
      return [name, values];
    }),
  );
  for (const [name, expected] of [
    ['default-src', "'self'"],
    ['object-src', "'none'"],
    ['base-uri', "'none'"],
    ['frame-ancestors', "'none'"],
    ['script-src-attr', "'none'"],
    ['form-action', "'self'"],
  ]) {
    if (directives.get(name)?.join(' ') !== expected)
      throw new Error(`Missing or unsafe CSP directive: ${name}`);
  }
  for (const name of [
    'script-src',
    'style-src',
    'style-src-elem',
    'style-src-attr',
    'connect-src',
  ]) {
    if (!directives.has(name)) throw new Error(`Missing CSP directive: ${name}`);
  }
  for (const source of directives.get('script-src')) {
    if (source !== "'self'" && !/^'sha256-[A-Za-z0-9+/]{43}='$/.test(source)) {
      throw new Error('Scripts must be same-origin or explicitly hashed');
    }
  }
  if (/unsafe-inline|unsafe-eval|\*(?:\s|;|$)|http:/i.test(csp))
    throw new Error('Unsafe content security policy');
  return directives;
}
