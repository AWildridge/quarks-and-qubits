import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function prepareDeployment(root = '.') {
  const { mode } = JSON.parse(readFileSync(resolve(root, 'deployment/config.json'), 'utf8'));
  if (!['coming-soon', 'full'].includes(mode)) throw new Error('Unknown publication mode');
  const output = resolve(root, 'dist-deploy');
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output);
  if (mode === 'full') {
    cpSync(resolve(root, 'dist'), output, { recursive: true });
  } else {
    // An explicit allowlist keeps every unfinished page, data file, and download off production.
    for (const file of ['index.html', 'coming-soon.css']) {
      cpSync(resolve(root, 'deployment/coming-soon', file), resolve(output, file));
    }
    for (const file of ['.htaccess', '_headers']) {
      cpSync(resolve(root, 'dist', file), resolve(output, file));
    }
    writeFileSync(resolve(output, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  }
  writeFileSync(resolve(output, '.publication-mode'), mode + '\n');
  console.log(`Prepared ${mode} publication in dist-deploy/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  prepareDeployment();
}
