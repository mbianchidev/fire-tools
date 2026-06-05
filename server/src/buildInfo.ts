import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.js';

export interface BuildInfo {
  version: string;
  commit: string;
  buildTime: string | null;
  dependencies: Record<string, string>;
}

const FALLBACK_VERSION = '0.0.0';
const FALLBACK_COMMIT = 'unknown';

/** Treat empty / whitespace-only env values as absent so they don't block fallbacks. */
const nonEmpty = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

interface PackageJson {
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const loadPackageJson = (moduleDir: string): PackageJson => {
  try {
    // From src/ (dev) or dist/ (runtime) walk up to the directory containing package.json.
    const candidates = [
      resolve(moduleDir, '..', 'package.json'),
      resolve(moduleDir, '..', '..', 'package.json'),
    ];
    for (const candidate of candidates) {
      try {
        const raw = readFileSync(candidate, 'utf-8');
        return JSON.parse(raw) as PackageJson;
      } catch {
        // try next candidate
      }
    }
  } catch (err) {
    logger.error('build-info', 'read-package-json-failed', `failed to read package.json: ${(err as Error).message}`);
  }
  return {};
};

const pickDependencies = (pkg: PackageJson): Record<string, string> => {
  const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const wanted = ['better-sqlite3', 'express', 'cors', 'express-rate-limit', 'zod', 'typescript'];
  const out: Record<string, string> = {};
  for (const name of wanted) {
    if (all[name]) out[name] = all[name];
  }
  return out;
};

interface BuildMeta {
  commit?: string;
  buildTime?: string;
}

/** Read the build metadata baked next to the compiled bundle (packaged Electron app). */
const readBakedMeta = (moduleDir: string): BuildMeta => {
  try {
    const raw = readFileSync(resolve(moduleDir, 'build-meta.json'), 'utf-8');
    const parsed = JSON.parse(raw) as BuildMeta;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/** Resolve the short commit hash of the checkout the process is running from. */
const liveGitCommit = (cwd: string): string | undefined => {
  try {
    const out = execSync('git rev-parse --short HEAD', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1000,
    })
      .toString()
      .trim();
    return out || undefined;
  } catch {
    return undefined;
  }
};

/** Best-effort build time from the compiled module's mtime (compiled runs without baked meta). */
const moduleMtime = (moduleFile: string): string | undefined => {
  try {
    return statSync(moduleFile).mtime.toISOString();
  } catch {
    return undefined;
  }
};

export interface ComputeOptions {
  env?: NodeJS.ProcessEnv;
  /** Directory the compiled module lives in (build-meta.json / package.json resolve from here). */
  moduleDir?: string;
  /** File whose mtime is used as the build-time fallback. */
  moduleFile?: string;
  /** Working directory used for the live `git` lookup. */
  gitCwd?: string;
}

/**
 * Compute build metadata with graceful fallbacks. Uncached and dependency-injectable
 * so the resolution order can be unit-tested deterministically.
 *
 * commit:    env -> live git (current checkout) -> baked meta (packaged) -> 'unknown'
 * buildTime: env -> baked meta -> module mtime -> now (never null once resolvable)
 */
export const computeBuildInfo = (opts: ComputeOptions = {}): BuildInfo => {
  const moduleFile = opts.moduleFile ?? fileURLToPath(import.meta.url);
  const moduleDir = opts.moduleDir ?? dirname(moduleFile);
  const env = opts.env ?? process.env;
  const gitCwd = opts.gitCwd ?? moduleDir;

  const pkg = loadPackageJson(moduleDir);
  const meta = readBakedMeta(moduleDir);

  const commit =
    nonEmpty(env.GIT_COMMIT_HASH) ??
    nonEmpty(env.GIT_COMMIT) ??
    liveGitCommit(gitCwd) ??
    nonEmpty(meta.commit) ??
    FALLBACK_COMMIT;

  const buildTime =
    nonEmpty(env.BUILD_TIME) ??
    nonEmpty(meta.buildTime) ??
    moduleMtime(moduleFile) ??
    new Date().toISOString();

  return {
    version: pkg.version ?? nonEmpty(env.npm_package_version) ?? FALLBACK_VERSION,
    commit,
    buildTime,
    dependencies: pickDependencies(pkg),
  };
};

let cached: BuildInfo | null = null;

export const getBuildInfo = (): BuildInfo => {
  if (cached) return cached;
  cached = computeBuildInfo();
  return cached;
};
