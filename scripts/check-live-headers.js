import { setTimeout } from 'node:timers/promises';
import { validateHeaders } from './security-policy.js';

export async function checkLiveHeaders(
  url,
  expected,
  { attempts = 6, delayMs = 5000, fetcher = fetch, sleep = setTimeout } = {},
) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response;
    try {
      response = await fetcher(url, {
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      validateHeaders(response.headers);
      for (const [name, value] of Object.entries(expected)) {
        if (response.headers.get(name) !== value)
          throw new Error(`${name} does not match the verified build`);
      }
      return;
    } catch (error) {
      if (attempt === attempts) throw new Error(`${url}: ${error.message}`, { cause: error });
      console.warn(
        `${url}: header check ${attempt}/${attempts} failed; retrying: ${error.message}`,
      );
    } finally {
      await response?.body?.cancel();
    }
    await sleep(delayMs);
  }
}
