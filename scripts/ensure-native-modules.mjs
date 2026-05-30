#!/usr/bin/env node
/**
 * Ensures Electron-bound native modules are built.
 *
 * Native deps (currently `better-sqlite3`) must be rebuilt against the locally
 * installed Electron version. The `postinstall` script does this via
 * `electron-rebuild`, but it is skipped when npm runs with `--ignore-scripts`
 * (corporate CI policies, `npm ci --ignore-scripts`, sandboxed cloud agents).
 * The app then crashes at startup with:
 *   Could not locate the bindings file. Tried:
 *   → node_modules/better-sqlite3/build/better_sqlite3.node
 *
 * This script detects that state and runs `electron-rebuild` directly, which
 * works regardless of the `ignore-scripts` setting because we invoke it as a
 * normal Node process, not as a lifecycle script.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

/** Returns the Electron version we are bound to, or null if unknown. */
function readElectronVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'node_modules', 'electron', 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

/** Returns the Electron version a binding was last built against, or null. */
function readBindingBuildVersion() {
  const marker = join(repoRoot, 'node_modules', '.electron-rebuild-version');
  try {
    return readFileSync(marker, 'utf8').trim();
  } catch {
    return null;
  }
}

/** Returns the mtime of a file in ms, or 0 if not found. */
function fileMtime(p) {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return 0;
  }
}

/** Returns the path to the actual native binding file, or null if none exists. */
function bindingPath(moduleDir, bindingBaseName) {
  const releasePath = join(moduleDir, 'build', 'Release', `${bindingBaseName}.node`);
  if (existsSync(releasePath)) return releasePath;

  const binDir = join(moduleDir, 'bin');
  if (!existsSync(binDir)) return null;
  try {
    for (const entry of readdirSync(binDir)) {
      const full = join(binDir, entry);
      if (!statSync(full).isDirectory()) continue;
      const candidates = [
        join(full, `${bindingBaseName}.node`),
        join(full, `${bindingBaseName.replace(/_/g, '-')}.node`),
        join(full, `${bindingBaseName.replace(/-/g, '_')}.node`),
      ];
      for (const c of candidates) if (existsSync(c)) return c;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Returns true if a native binding for the given module appears to be built.
 *
 *  Newer `better-sqlite3` versions place the binding under
 *  `bin/<platform>-<arch>-<abi>/<name>.node`, while older versions used
 *  `build/Release/<name>.node`. Accept either layout. */
function hasNativeBinding(moduleDir, bindingBaseName) {
  return bindingPath(moduleDir, bindingBaseName) !== null;
}

/** Native modules that must be rebuilt against Electron.
 *
 * The Express backend is an npm workspace under `server/` and has its own
 * `node_modules/better-sqlite3` install — that is the copy the embedded
 * Electron backend loads at runtime, so it MUST be present (otherwise the
 * unpackaged dev launch fails). The root copy is what vitest tests against. */
const NATIVE_MODULES = [
  {
    name: 'better-sqlite3',
    moduleDir: join(repoRoot, 'node_modules', 'better-sqlite3'),
    bindingBaseName: 'better_sqlite3',
  },
  {
    name: 'better-sqlite3',
    moduleDir: join(repoRoot, 'server', 'node_modules', 'better-sqlite3'),
    bindingBaseName: 'better_sqlite3',
  },
].filter((m) => existsSync(m.moduleDir));

const missing = NATIVE_MODULES.filter(m => !hasNativeBinding(m.moduleDir, m.bindingBaseName));

// Even if bindings exist, they may have been built against a previous Electron
// version (different NODE_MODULE_VERSION / ABI). We track the version that was
// last built and force a rebuild when Electron has been upgraded.
const electronVersion = readElectronVersion();
const lastBuildVersion = readBindingBuildVersion();
const abiMismatch = electronVersion && lastBuildVersion && electronVersion !== lastBuildVersion;

// Even when the marker matches, a fresh `npm install` will run
// better-sqlite3's `prebuild-install` which downloads a binary for the *Node*
// ABI and overwrites the Electron-rebuilt one. Detect this by comparing the
// binding's mtime against the marker's mtime: if the binding was modified
// after we wrote the marker, the recorded build is stale and we must rebuild.
const markerPath = join(repoRoot, 'node_modules', '.electron-rebuild-version');
const markerMtime = fileMtime(markerPath);
const noMarker = markerMtime === 0;
// When a marker exists, detect prebuild-install clobbering by comparing the
// binding's mtime against the marker's mtime: if the binding was modified
// after we wrote the marker, the recorded build is stale and we must rebuild.
const bindingNewerThanMarker = !noMarker && NATIVE_MODULES.some(m => {
  const bp = bindingPath(m.moduleDir, m.bindingBaseName);
  if (!bp) return false;
  return fileMtime(bp) > markerMtime + 1000; // 1s grace for filesystem precision
});


const needsBuild =
  missing.length > 0 ||
  abiMismatch ||
  noMarker ||
  bindingNewerThanMarker;

if (!needsBuild) {
  process.exit(0);
}

const reason = missing.length > 0
  ? `Missing native bindings for: ${missing.map(m => m.name).join(', ')}`
  : abiMismatch
    ? `Electron upgraded ${lastBuildVersion} → ${electronVersion}, rebuilding`
    : noMarker
      ? 'No rebuild marker found (fresh install or marker missing); building against Electron ABI'
      : 'Native binding was rewritten after last electron-rebuild (likely by prebuild-install); rebuilding for Electron ABI';
console.log(`[ensure-native-modules] ${reason}. Rebuilding…`);

const targets = missing.length > 0 ? missing : NATIVE_MODULES;

const electronRebuildBin = join(
  repoRoot,
  'node_modules',
  '.bin',
  platform() === 'win32' ? 'electron-rebuild.cmd' : 'electron-rebuild'
);

if (!existsSync(electronRebuildBin)) {
  console.error(
    `[ensure-native-modules] Cannot find ${electronRebuildBin}. Run \`npm install\` first.`
  );
  process.exit(1);
}

for (const mod of targets) {
  const projectRoot = dirname(dirname(mod.moduleDir)); // parent of node_modules
  const r = spawnSync(electronRebuildBin, ['-m', projectRoot, '-w', mod.name], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
    shell: platform() === 'win32',
  });
  if (r.error) {
    console.error(`[ensure-native-modules] Failed to spawn electron-rebuild for ${mod.name} @ ${projectRoot}: ${r.error.message}`);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`[ensure-native-modules] electron-rebuild failed for ${mod.name} @ ${projectRoot} (exit ${r.status}).`);
    process.exit(r.status ?? 1);
  }
}

const stillMissing = NATIVE_MODULES.filter(m => !hasNativeBinding(m.moduleDir, m.bindingBaseName));
if (stillMissing.length > 0) {
  console.error(
    `[ensure-native-modules] Rebuild completed but bindings still missing: ${stillMissing.map(m => m.name).join(', ')}`
  );
  process.exit(1);
}

// Record the Electron version we just built against so subsequent runs can
// detect Electron upgrades and rebuild proactively.
if (electronVersion) {
  try {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(repoRoot, 'node_modules', '.electron-rebuild-version'), electronVersion);
  } catch {
    // best-effort
  }
}

console.log('[ensure-native-modules] Native modules ready.');
