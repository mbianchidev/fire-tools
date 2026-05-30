#!/usr/bin/env node
/**
 * Ensures the Electron binary is installed locally.
 *
 * When npm runs with `--ignore-scripts` (CI policies, some corporate
 * installs, or `npm ci --ignore-scripts`), the `electron` package's own
 * postinstall script that downloads the binary is skipped. The project
 * then fails at runtime with:
 *   "Electron failed to install correctly, please delete node_modules/electron..."
 *
 * This script detects that state and runs Electron's installer directly,
 * which works regardless of the `ignore-scripts` setting because we invoke
 * it as a normal Node process, not as a lifecycle script.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const electronDir = join(repoRoot, 'node_modules', 'electron');

if (!existsSync(electronDir)) {
  console.error('[ensure-electron] node_modules/electron is missing. Run `npm install` first.');
  process.exit(1);
}

const pathFile = join(electronDir, 'path.txt');
const distDir = join(electronDir, 'dist');
const installScript = join(electronDir, 'install.js');

if (existsSync(pathFile) && existsSync(distDir)) {
  process.exit(0);
}

console.log('[ensure-electron] Electron binary missing (likely installed with --ignore-scripts). Downloading…');

if (!existsSync(installScript)) {
  console.error(`[ensure-electron] Cannot find ${installScript}. Try \`npm rebuild electron\`.`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [installScript], {
  cwd: electronDir,
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  console.error('[ensure-electron] Electron install failed.');
  process.exit(result.status ?? 1);
}

if (!existsSync(pathFile) || !existsSync(distDir)) {
  console.error('[ensure-electron] Install completed but binary still missing.');
  process.exit(1);
}

// Sanity check via the package's own resolver.
try {
  const electronPath = require('electron');
  if (typeof electronPath !== 'string' || !existsSync(electronPath)) {
    throw new Error(`Resolved path is invalid: ${electronPath}`);
  }
} catch (err) {
  console.error('[ensure-electron] Verification failed:', err.message);
  process.exit(1);
}

console.log('[ensure-electron] Electron is ready.');
