import Database, { type Database as DB } from 'better-sqlite3';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATION_UP_FILENAME_RE = /^(\d+)_([a-zA-Z0-9_-]+)\.up\.sql$/;

export interface Migration {
  id: string;
  name: string;
  upPath: string;
  downPath: string;
}

export interface MigrationStatus {
  id: string;
  name: string;
  applied: boolean;
  appliedAt: string | null;
}

export interface RunMigrationsResult {
  migrationsApplied: string[];
  totalMigrations: number;
  migrationsDir: string;
}

export interface RollbackMigrationsResult {
  migrationsRolledBack: string[];
  migrationsDir: string;
}

const resolveMigrationsDir = (migrationsPath: string): string => {
  if (migrationsPath.startsWith('/')) return migrationsPath;
  return resolve(__dirname, '..', migrationsPath);
};

export const listMigrations = (migrationsPath: string): Migration[] => {
  const dir = resolveMigrationsDir(migrationsPath);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new Error(
      `Migrations directory not found at ${dir}. Set MIGRATIONS_PATH env to override.`,
    );
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.up.sql'))
    .sort();
  return files.map((file) => {
    const match = MIGRATION_UP_FILENAME_RE.exec(file);
    if (!match) {
      throw new Error(
        `Invalid migration filename: "${file}". Expected: NNNN_name.up.sql (e.g. 0001_initial.up.sql).`,
      );
    }
    const upPath = join(dir, file);
    const downPath = join(dir, `${match[1]}_${match[2]}.down.sql`);
    if (!existsSync(downPath)) {
      throw new Error(
        `Missing rollback file for migration ${file}. Expected: ${match[1]}_${match[2]}.down.sql in ${dir}.`,
      );
    }
    return { id: match[1]!, name: match[2]!, upPath, downPath };
  });
};

const ensureMigrationsTable = (db: DB): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      applied_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

const fetchAppliedIds = (db: DB): Set<string> => {
  const rows = db
    .prepare('SELECT id FROM schema_migrations ORDER BY id')
    .all() as Array<{ id: string }>;
  return new Set(rows.map((r) => r.id));
};

export const runMigrations = (db: DB, migrationsPath: string): RunMigrationsResult => {
  ensureMigrationsTable(db);
  const migrations = listMigrations(migrationsPath);
  const applied = fetchAppliedIds(db);
  const toApply = migrations.filter((m) => !applied.has(m.id));

  const insertStmt = db.prepare(
    'INSERT INTO schema_migrations (id, name) VALUES (?, ?)',
  );

  for (const migration of toApply) {
    const sql = readFileSync(migration.upPath, 'utf8');
    const tx = db.transaction(() => {
      db.exec(sql);
      insertStmt.run(migration.id, migration.name);
    });
    try {
      tx();
    } catch (err) {
      throw new Error(
        `Migration ${migration.id}_${migration.name} (up) failed: ${(err as Error).message}`,
      );
    }
  }

  return {
    migrationsApplied: toApply.map((m) => `${m.id}_${m.name}`),
    totalMigrations: migrations.length,
    migrationsDir: resolveMigrationsDir(migrationsPath),
  };
};

/**
 * Roll back the most recently applied migrations.
 *
 * `steps` controls how many migrations to revert (default 1). Pass `'all'`
 * to roll back every applied migration. Each rollback runs in its own
 * transaction so a failure leaves earlier rollbacks intact and the
 * offending migration still marked as applied.
 */
export const rollbackMigrations = (
  db: DB,
  migrationsPath: string,
  steps: number | 'all' = 1,
): RollbackMigrationsResult => {
  ensureMigrationsTable(db);
  const migrations = listMigrations(migrationsPath);
  const migrationsById = new Map(migrations.map((m) => [m.id, m]));

  const appliedRows = db
    .prepare('SELECT id FROM schema_migrations ORDER BY id DESC')
    .all() as Array<{ id: string }>;

  const limit = steps === 'all' ? appliedRows.length : Math.max(0, steps);
  const targets = appliedRows.slice(0, limit);

  const deleteStmt = db.prepare('DELETE FROM schema_migrations WHERE id = ?');
  const rolledBack: string[] = [];

  for (const { id } of targets) {
    const migration = migrationsById.get(id);
    if (!migration) {
      throw new Error(
        `Cannot roll back ${id}: migration files not present on disk. Restore the matching .up.sql / .down.sql before rolling back.`,
      );
    }
    const sql = readFileSync(migration.downPath, 'utf8');
    const tx = db.transaction(() => {
      db.exec(sql);
      deleteStmt.run(migration.id);
    });
    try {
      tx();
    } catch (err) {
      throw new Error(
        `Migration ${migration.id}_${migration.name} (down) failed: ${(err as Error).message}`,
      );
    }
    rolledBack.push(`${migration.id}_${migration.name}`);
  }

  return {
    migrationsRolledBack: rolledBack,
    migrationsDir: resolveMigrationsDir(migrationsPath),
  };
};

export const getMigrationStatus = (db: DB, migrationsPath: string): MigrationStatus[] => {
  ensureMigrationsTable(db);
  const migrations = listMigrations(migrationsPath);
  const appliedRows = db
    .prepare('SELECT id, applied_at FROM schema_migrations')
    .all() as Array<{ id: string; applied_at: string }>;
  const appliedById = new Map(appliedRows.map((r) => [r.id, r.applied_at]));
  return migrations.map((m) => ({
    id: m.id,
    name: m.name,
    applied: appliedById.has(m.id),
    appliedAt: appliedById.get(m.id) ?? null,
  }));
};

/**
 * Helper exposed so the CLI / tests can open a DB without going through
 * the full server boot (which loads env from process.env).
 */
export const openSqlite = (sqlitePath: string): DB => {
  const db = new Database(sqlitePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
};
