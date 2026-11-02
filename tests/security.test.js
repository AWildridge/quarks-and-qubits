import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseHeaders, hashCsp, policyFor, validateHeaders } from '../scripts/security-policy.js';
import { inlineHashes } from '../scripts/html-security.js';

test('CSP uses the decoded DOM attribute but the original script bytes', () => {
  const found = inlineHashes(
    '<script>const x = "<tag>";</script><p style="font-family: &quot;serif&quot;">Text</p>',
  );
  assert.ok(found.scripts.has(hashCsp('const x = "<tag>";')));
  assert.ok(found.attributes.has(hashCsp('font-family: "serif"')));
});

test('weak or missing headers fail closed', () => {
  const headers = {
    ...baseHeaders,
    'Content-Security-Policy': policyFor(inlineHashes('<p>Safe</p>')),
  };
  assert.doesNotThrow(() => validateHeaders(headers));
  for (const key of Object.keys(headers)) {
    const missing = { ...headers };
    delete missing[key];
    assert.throws(() => validateHeaders(missing));
  }
  for (const directive of [
    "script-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-eval'",
    "script-src 'self' https://unapproved.example",
    'connect-src *',
  ]) {
    assert.throws(() =>
      validateHeaders({
        ...headers,
        'Content-Security-Policy': headers['Content-Security-Policy'].replace(
          new RegExp(directive.split(' ')[0] + '[^;]*'),
          directive,
        ),
      }),
    );
  }
});
