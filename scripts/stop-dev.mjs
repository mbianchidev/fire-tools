#!/usr/bin/env node
// Stop dev processes started by `npm start` / `npm run dev`:
// - Vite dev server (port 5173)
// - Electron main process running this project's src/main/main.ts
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

function killPids(pids, label) {
  const unique = [...new Set(pids.filter(Boolean))];
  if (!unique.length) {
    console.log(`[stop] no ${label} process found`);
    return;
  }
  for (const pid of unique) {
    try {
      process.kill(Number(pid), 'SIGTERM');
      console.log(`[stop] sent SIGTERM to ${label} pid ${pid}`);
    } catch (err) {
      console.warn(`[stop] failed to kill ${label} pid ${pid}: ${err.message}`);
    }
  }
}

// 1) Vite dev server on port 5173
if (process.platform === 'win32') {
  const out = sh('netstat -ano -p tcp');
  const pids = out
    .split(/\r?\n/)
    .filter((l) => l.includes(':5173') && l.includes('LISTENING'))
    .map((l) => l.trim().split(/\s+/).pop());
  killPids(pids, 'vite (port 5173)');
} else {
  const pids = sh('lsof -ti tcp:5173').split(/\s+/);
  killPids(pids, 'vite (port 5173)');
}

// 2) Electron processes launched from this project root
if (process.platform !== 'win32') {
  const out = sh('ps -ax -o pid=,command=');
  const pids = out
    .split('\n')
    .filter((l) => l.includes(projectRoot) && /electron/i.test(l) && !l.includes('stop-dev'))
    .map((l) => l.trim().split(/\s+/)[0]);
  killPids(pids, 'electron');
} else {
  const out = sh('wmic process get ProcessId,CommandLine /format:csv');
  const pids = out
    .split(/\r?\n/)
    .filter((l) => l.toLowerCase().includes('electron') && l.toLowerCase().includes(projectRoot.toLowerCase()))
    .map((l) => l.split(',').pop());
  killPids(pids, 'electron');
}
