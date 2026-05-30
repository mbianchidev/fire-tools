import Database from 'better-sqlite3';
import { runMigrations } from '../src/migrate.js';
import { buildApp } from '../src/app.js';
import type { ServerEnv } from '../src/env.js';

export const testEnv = (): ServerEnv => ({
  port: 0,
  host: '127.0.0.1',
  databaseUrl: 'file::memory:',
  schemaPath: '../docs/database/schema.sql',
  migrationsPath: 'migrations',
  corsOrigins: ['http://localhost:5173'],
  corsAllowAll: true,
  rateLimit: { windowMs: 60_000, max: 10_000 },
  nodeEnv: 'test',
});

export const makeApp = () => {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  const env = testEnv();
  runMigrations(db, env.migrationsPath);
  const app = buildApp({ db, env, dbPath: ':memory:', disableRateLimit: true });
  return { app, db };
};
