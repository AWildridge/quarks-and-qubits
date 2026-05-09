#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer';

const env = { ...process.env };
const configuredTempDir = env.TMPDIR || env.TEMP || env.TMP || tmpdir();
const tempDir = existsSync(configuredTempDir) ? configuredTempDir : '/tmp';
const chromePort = env.LIGHTHOUSE_CHROME_PORT || '9222';
const lighthouseArgs = ['autorun', `--collect.settings.port=${chromePort}`];

env.TMPDIR = tempDir;
env.TEMP = tempDir;
env.TMP = tempDir;
env[`LOCAL${'APPDATA'}`] = tempDir;

const appDataMatch = /\/([a-z])\/Users\/([^/:]+)\/AppData\//i.exec(env.PATH ?? '');

if (appDataMatch) {
  const [, driveLetter, username] = appDataMatch;
  const localAppData = `/mnt/${driveLetter.toLowerCase()}/Users/${username}/AppData/Local`;

  mkdirSync(localAppData, { recursive: true });
}

const browser = await puppeteer.launch({
  headless: 'new',
  userDataDir: `${tempDir}/lighthouse-profile-${process.pid}`,
  args: [
    `--remote-debugging-port=${chromePort}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-crash-reporter',
    '--disable-crashpad',
  ],
});

if (env.LIGHTHOUSE_BASE_URL) {
  const config = JSON.parse(readFileSync('lighthouserc.json', 'utf8'));
  const baseUrl = new URL(env.LIGHTHOUSE_BASE_URL);

  config.ci.collect.url = config.ci.collect.url.map((url) => {
    const nextUrl = new URL(url);
    nextUrl.protocol = baseUrl.protocol;
    nextUrl.host = baseUrl.host;
    return nextUrl.toString();
  });

  const configPath = resolve(tempDir, `lighthouserc-${process.pid}.json`);
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  lighthouseArgs.push(`--config=${configPath}`);
}

const child = spawn('lhci', lighthouseArgs, {
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

child.on('exit', async (code, signal) => {
  await browser.close();

  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 1);
});
