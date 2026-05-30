#!/usr/bin/env node
// `npm run electron:dev` — orchestrates a vite dev server (in `--mode electron`
// so the base is '/' and the web-only `/demo` middleware is bypassed) and
// spawns Electron once the renderer URL is reachable. Both children share the
// terminal; SIGINT propagates to both so Ctrl+C tears the stack down cleanly.
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const RENDERER_URL = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
const VITE_PORT = (() => {
  try {
    return new URL(RENDERER_URL).port || '5173';
  } catch {
    return '5173';
  }
})();

async function waitForUrl(url, timeoutMs = 30_000, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.status < 500) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

function shutdown(children, code = 0) {
  for (const child of children) {
    if (!child.killed) {
      try { child.kill('SIGTERM'); } catch { /* noop */ }
    }
  }
  process.exit(code);
}

async function main() {
  console.log(`[electron:dev] starting vite (mode=electron) on port ${VITE_PORT}…`);
  const vite = spawn(
    'npx',
    ['vite', '--mode', 'electron', '--port', VITE_PORT, '--strictPort'],
    { cwd: repoRoot, env: process.env, stdio: 'inherit' }
  );

  const children = [vite];
  process.on('SIGINT', () => shutdown(children));
  process.on('SIGTERM', () => shutdown(children));
  vite.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[electron:dev] vite exited with code ${code}`);
      shutdown(children.filter((c) => c !== vite), code);
    }
  });

  const ready = await waitForUrl(RENDERER_URL);
  if (!ready) {
    console.error('[electron:dev] vite never became reachable at', RENDERER_URL);
    shutdown(children, 1);
    return;
  }

  console.log('[electron:dev] vite is up — launching Electron');
  const electron = spawn(
    'npx',
    ['electron', 'electron/main.cjs'],
    {
      cwd: repoRoot,
      env: { ...process.env, ELECTRON_RENDERER_URL: RENDERER_URL },
      stdio: 'inherit',
    }
  );
  children.push(electron);

  electron.on('exit', (code) => {
    console.log(`[electron:dev] electron exited (${code ?? 'signal'}) — stopping vite`);
    shutdown(children.filter((c) => c !== electron), code ?? 0);
  });
}

main().catch((err) => {
  console.error('[electron:dev] fatal:', err);
  process.exit(1);
});
