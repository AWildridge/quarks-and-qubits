import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareDeployment } from '../scripts/prepare-deployment.js';

test('coming-soon publication excludes full-site pages, downloads, and stale artifacts', () => {
  const root = mkdtempSync(join(tmpdir(), 'publication-mode-'));
  try {
    for (const directory of ['dist', 'dist-deploy', 'deployment/coming-soon']) {
      mkdirSync(join(root, directory), { recursive: true });
    }
    for (const file of ['index.html', '.htaccess', '_headers', 'AJ_Wildridge_CV.pdf']) {
      writeFileSync(join(root, 'dist', file), 'full site');
    }
    writeFileSync(join(root, 'dist-deploy', 'stale.html'), 'old content');
    for (const file of ['index.html', 'coming-soon.css']) {
      writeFileSync(join(root, 'deployment/coming-soon', file), 'coming soon');
    }
    const config = join(root, 'deployment/config.json');
    writeFileSync(config, JSON.stringify({ mode: 'coming-soon' }));
    prepareDeployment(root);
    assert.deepEqual(readdirSync(join(root, 'dist-deploy')).sort(), [
      '.htaccess',
      '.publication-mode',
      '_headers',
      'coming-soon.css',
      'index.html',
      'robots.txt',
    ]);
    writeFileSync(config, JSON.stringify({ mode: 'full' }));
    prepareDeployment(root);
    assert.ok(readdirSync(join(root, 'dist-deploy')).includes('AJ_Wildridge_CV.pdf'));
    writeFileSync(config, JSON.stringify({ mode: 'typo' }));
    assert.throws(() => prepareDeployment(root), /Unknown publication mode/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
