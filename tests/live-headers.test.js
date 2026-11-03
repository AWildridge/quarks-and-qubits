import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLiveHeaders } from '../scripts/check-live-headers.js';
import { baseHeaders, policyFor } from '../scripts/security-policy.js';

const expected = {
  ...baseHeaders,
  'Content-Security-Policy': policyFor({
    scripts: new Set(),
    styles: new Set(),
    attributes: new Set(),
  }),
};

test('a stale response is retried until every built header matches', async () => {
  let calls = 0;
  const delays = [];
  const responses = [];
  await checkLiveHeaders('https://test.web.cern.ch/', expected, {
    delayMs: 123,
    sleep: async (delay) => delays.push(delay),
    fetcher: async (url, options) => {
      assert.equal(options.cache, 'no-store');
      assert.equal(options.redirect, 'error');
      const response = new Response('body', { headers: calls++ ? expected : {} });
      responses.push(response);
      return response;
    },
  });
  assert.equal(calls, 2);
  assert.deepEqual(delays, [123]);
  assert.ok(responses.every((response) => response.bodyUsed));
});

test('persistent missing headers fail after the bounded attempts and identify the URL', async () => {
  let calls = 0;
  await assert.rejects(
    checkLiveHeaders('https://test.web.cern.ch/cv/', expected, {
      attempts: 2,
      sleep: async () => {},
      fetcher: async () => {
        calls++;
        return new Response('', { headers: { ...expected, 'X-Frame-Options': 'DENY, DENY' } });
      },
    }),
    /https:\/\/test\.web\.cern\.ch\/cv\/: Missing or unexpected X-Frame-Options/,
  );
  assert.equal(calls, 2);
});

test('a generally valid policy still fails if it differs from the verified build', async () => {
  await assert.rejects(
    checkLiveHeaders('https://test.web.cern.ch/', expected, {
      attempts: 1,
      fetcher: async () =>
        new Response('', {
          headers: { ...expected, 'Strict-Transport-Security': 'max-age=63072000' },
        }),
    }),
    /Strict-Transport-Security does not match the verified build/,
  );
});
