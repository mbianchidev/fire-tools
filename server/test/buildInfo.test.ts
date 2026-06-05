import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { computeBuildInfo } from '../src/buildInfo.js';

/** A directory that is guaranteed not to be a git checkout, so live git lookup fails. */
const makeNonRepoDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'fire-buildinfo-'));

describe('computeBuildInfo', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeNonRepoDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('prefers explicit env vars for commit and buildTime', () => {
    const info = computeBuildInfo({
      env: { GIT_COMMIT_HASH: 'abc1234', BUILD_TIME: '2024-05-01T00:00:00.000Z' },
      moduleDir: dir,
      gitCwd: dir,
    });
    expect(info.commit).toBe('abc1234');
    expect(info.buildTime).toBe('2024-05-01T00:00:00.000Z');
  });

  it('ignores empty env values and falls through to later sources', () => {
    fs.writeFileSync(
      path.join(dir, 'build-meta.json'),
      JSON.stringify({ commit: 'baked99', buildTime: '2023-01-02T03:04:05.000Z' }),
    );
    const info = computeBuildInfo({
      env: { GIT_COMMIT_HASH: '   ', BUILD_TIME: '' },
      moduleDir: dir,
      gitCwd: dir,
    });
    expect(info.commit).toBe('baked99');
    expect(info.buildTime).toBe('2023-01-02T03:04:05.000Z');
  });

  it('falls back to baked build-meta.json when env and live git are unavailable', () => {
    fs.writeFileSync(
      path.join(dir, 'build-meta.json'),
      JSON.stringify({ commit: 'packaged1', buildTime: '2022-06-07T08:09:10.000Z' }),
    );
    const info = computeBuildInfo({ env: {}, moduleDir: dir, gitCwd: dir });
    expect(info.commit).toBe('packaged1');
    expect(info.buildTime).toBe('2022-06-07T08:09:10.000Z');
  });

  it('resolves the live commit from the running checkout in development', () => {
    // Point the git lookup at the real checkout (the server package cwd).
    const info = computeBuildInfo({ env: {}, moduleDir: dir, gitCwd: process.cwd() });
    expect(info.commit).not.toBe('unknown');
    expect(info.commit).toMatch(/^[0-9a-f]{7,40}$/);
  });

  it('never returns a null buildTime and degrades commit to "unknown" with no sources', () => {
    const missingFile = path.join(dir, 'does-not-exist.js');
    const info = computeBuildInfo({
      env: {},
      moduleDir: dir,
      moduleFile: missingFile,
      gitCwd: dir,
    });
    expect(info.commit).toBe('unknown');
    expect(info.buildTime).not.toBeNull();
    expect(() => new Date(info.buildTime as string).toISOString()).not.toThrow();
  });
});
