import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const deploy = resolve('scripts/deploy-eos.sh');
const remote = 'cern:';

function simulate(scenario, extraEnv = {}) {
  const root = mkdtempSync(join(tmpdir(), 'eos-deploy-test-'));
  try {
    mkdirSync(join(root, 'bin'));
    mkdirSync(join(root, 'dist'));
    for (const file of ['index.html', '.htaccess', 'AJ_Wildridge_CV.pdf']) {
      writeFileSync(join(root, 'dist', file), 'fixture');
    }
    writeFileSync(
      join(root, 'bin/rclone'),
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
if (args.some((arg) => arg.includes('test-secret-never-in-commands') || arg.includes('test-obscured-password'))) process.exit(99);
if (args[0] === 'obscure') {
  if (args[1] !== '-' || fs.readFileSync(0, 'utf8') !== process.env.CERN_PASSWORD + '\\n') process.exit(96);
  process.stdout.write('test-obscured-password\\n');
  process.exit(0);
}
if (process.env.CERN_PASSWORD || process.env.RCLONE_CONFIG_CERN_PASS !== 'test-obscured-password') process.exit(95);
if (process.env.RCLONE_CONFIG_CERN_URL !== 'https://cernbox.cern.ch/cernbox/webdav/eos/user/t/tester/www/') process.exit(98);
if (process.env.RCLONE_CONFIG_CERN_TYPE !== 'webdav' || process.env.RCLONE_CONFIG_CERN_VENDOR !== 'other') process.exit(97);
fs.appendFileSync('transfers.jsonl', JSON.stringify(args) + '\\n');
if (process.env.SCENARIO === 'auth-failure' && args[0] === 'lsf') process.exit(1);
if (process.env.SCENARIO === 'upload-failure' && args[0] === 'sync' && args[1] === 'dist/') process.exit(1);
if (args[0] === 'copy' && args[1] === 'cern:') fs.writeFileSync(args[2] + 'index.html', 'previous site');
`,
      { mode: 0o700 },
    );
    writeFileSync(
      join(root, 'bin/node'),
      `#!/bin/sh
case "$*" in
  *--root-only*) [ "$SCENARIO" != probe-failure ] ;;
  *) [ "$SCENARIO" != live-failure ] ;;
esac
`,
      { mode: 0o700 },
    );
    const result = spawnSync('bash', [deploy], {
      cwd: root,
      env: {
        ...process.env,
        PATH: join(root, 'bin') + ':' + process.env.PATH,
        CERN_USER: 'tester',
        CERN_PASSWORD: 'test-secret-never-in-commands',
        EOS_PATH: '/eos/user/t/tester/www/',
        CERN_WEB_URL: 'https://test.web.cern.ch',
        RELEASE: '123-' + 'a'.repeat(40),
        SCENARIO: scenario,
        ...extraEnv,
      },
      encoding: 'utf8',
      timeout: 10000,
    });
    const log = join(root, 'transfers.jsonl');
    const commands = existsSync(log)
      ? readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse)
      : [];
    return {
      status: result.status,
      output: result.stdout + result.stderr,
      commands,
      backup: existsSync(join(root, 'cern-rollback.tar.gz')),
    };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('WebDAV publication uses the EOS website path and retains the staging directory', () => {
  const result = simulate('success');
  assert.equal(result.status, 0, result.output);
  assert.deepEqual(result.commands[0].slice(0, 4), ['lsf', remote, '--max-depth', '1']);
  assert.equal(result.commands.filter((command) => command.includes('dist/')).length, 1);
  assert.equal(result.commands.at(-1)[0], 'purge');
  assert.ok(result.commands.at(-1)[1].startsWith(`${remote}_deploy/`));
  const publication = result.commands.find((command) => command[0] === 'sync');
  assert.equal(publication[publication.indexOf('--exclude') + 1], '/_deploy/**');
  assert.ok(publication.includes('--ignore-times'));
  assert.equal(result.backup, false);
});

test('failed authentication or server policy never promotes files', () => {
  for (const scenario of ['auth-failure', 'probe-failure']) {
    const result = simulate(scenario);
    assert.notEqual(result.status, 0);
    assert.ok(result.commands.every((command) => !command.includes('dist/')));
    assert.equal(result.backup, false);
  }
});

test('a failed upload or live check restores the previous website and preserves a rollback archive', () => {
  for (const scenario of ['upload-failure', 'live-failure']) {
    const result = simulate(scenario);
    assert.notEqual(result.status, 0);
    const updates = result.commands.filter((command) => command[0] === 'sync');
    assert.equal(updates.length, 2);
    assert.equal(updates[0][1], 'dist/');
    assert.ok(updates[1][1].endsWith('/backup/'));
    assert.ok(
      updates.every(
        (command) =>
          command[2] === remote && command[command.indexOf('--exclude') + 1] === '/_deploy/**',
      ),
    );
    assert.equal(result.backup, true);
  }
});

test('paths outside a website directory are rejected before contacting CERN', () => {
  const result = simulate('success', { EOS_PATH: '/eos/user/t/tester' });
  assert.notEqual(result.status, 0);
  assert.equal(result.commands.length, 0);
});

test('invalid transfer inputs are rejected before contacting CERN', () => {
  for (const extraEnv of [
    { CERN_USER: 'invalid/user' },
    { RELEASE: 'invalid-release' },
    { CERN_WEB_URL: 'https://example.com' },
  ]) {
    const result = simulate('success', extraEnv);
    assert.notEqual(result.status, 0);
    assert.equal(result.commands.length, 0);
  }
});
