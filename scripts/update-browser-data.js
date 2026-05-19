import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function getStoreArgs() {
  const modulesYaml = 'node_modules/.modules.yaml';
  if (!existsSync(modulesYaml)) return [];

  const match = readFileSync(modulesYaml, 'utf8').match(/^storeDir:\s*(.+)$/m);
  if (!match) return [];

  return ['--store-dir', match[1].trim()];
}

function run(args) {
  const result = spawnSync('pnpm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const storeArgs = getStoreArgs();

run([
  ...storeArgs,
  'update',
  'baseline-browser-mapping@latest',
  'caniuse-lite@latest',
  'update-browserslist-db@latest',
]);
run(['exec', 'update-browserslist-db']);
