#!/usr/bin/env node
// Keep the legacy command aligned with the verified publication source snapshots.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const script = fileURLToPath(new URL('./check-publications.js', import.meta.url));
const result = spawnSync(process.execPath, [script, '--apply'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
