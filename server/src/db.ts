import Database, { type Database as DB } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ServerEnv } from './env.js';
import { runMigrations, type RunMigrationsResult } from './migrate.js';

const resolveSqlitePath = (databaseUrl: string): string => {
  if (!databaseUrl.startsWith('file:')) {
    throw new Error(
      `Only file:-style DATABASE_URL is supported by SQLite driver (got "${databaseUrl}"). ` +
        `Use the postgres compose profile to run against PostgreSQL.`,
    );
  }
  return databaseUrl.slice('file:'.length);
};

export interface InitDbResult {
  db: DB;
  migrationsResult: RunMigrationsResult;
  dbPath: string;
}

export interface InitDbOptions {
  /**
   * Skip auto-applying pending migrations on boot. Used by the migrate CLI
   * for `down` and `status` so it can manage migrations explicitly without
   * `initDb` racing ahead.
   */
  skipMigrations?: boolean;
}

export const initDb = (env: ServerEnv, opts: InitDbOptions = {}): InitDbResult => {
  if (env.databaseUrl.startsWith('postgres://') || env.databaseUrl.startsWith('postgresql://')) {
    throw new Error(
      'PostgreSQL driver not yet implemented in this scaffold. ' +
        'Track this in docs/deployment/README.md (Postgres profile is contract-only for now).',
    );
  }

  const dbPath = resolve(resolveSqlitePath(env.databaseUrl));
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const migrationsResult: RunMigrationsResult = opts.skipMigrations
    ? { migrationsApplied: [], totalMigrations: 0, migrationsDir: env.migrationsPath }
    : runMigrations(db, env.migrationsPath);
  return { db, migrationsResult, dbPath };
};
