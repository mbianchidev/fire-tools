#!/usr/bin/env node
/**
 * Bake build metadata (commit + build time) into `server/dist/build-meta.json`.
 *
 * The packaged Electron app ships the compiled backend inside an asar with no
 * `.git` directory and no build-time env vars, so the embedded server cannot
 * resolve its commit live. We write the values here at build time; the server's
 * buildInfo resolver reads this file as the packaged fallback.
 *
 * Resolution: env (GIT_COMMIT_HASH / GIT_COMMIT, BUILD_TIME) first, then live git.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const outDir = resolve(repoRoot, 'server', 'dist');
const outFile = resolve(outDir, 'build-meta.json');

const nonEmpty = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed ? trimmed : undefined;
};

const resolveCommit = () => {
  const fromEnv = nonEmpty(process.env.GIT_COMMIT_HASH) ?? nonEmpty(process.env.GIT_COMMIT);
  if (fromEnv) return fromEnv;
  try {
    return (
      execSync('git rev-parse --short HEAD', {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 1000,
      })
        .toString()
        .trim() || 'unknown'
    );
  } catch {
    return 'unknown';
  }
};

const meta = {
  commit: resolveCommit(),
  buildTime: nonEmpty(process.env.BUILD_TIME) ?? new Date().toISOString(),
};

try {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(meta, null, 2)}\n`, 'utf-8');
  console.log(`[gen-build-meta] wrote ${outFile} (commit=${meta.commit}, buildTime=${meta.buildTime})`);
} catch (err) {
  console.error(`[gen-build-meta] failed to write ${outFile}:`, err);
  process.exit(1);
}
