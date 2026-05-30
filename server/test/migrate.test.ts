import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import {
  listMigrations,
  runMigrations,
  rollbackMigrations,
  getMigrationStatus,
} from '../src/migrate.js';

const path = 'migrations';

const tableExists = (db: Database.Database, name: string): boolean => {
  const row = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
    .get(name) as { name: string } | undefined;
  return !!row;
};

describe('migration runner', () => {
  it('lists migrations with paired up/down files', () => {
    const migrations = listMigrations(path);
    expect(migrations.length).toBeGreaterThan(0);
    for (const m of migrations) {
      expect(m.upPath).toMatch(/\.up\.sql$/);
      expect(m.downPath).toMatch(/\.down\.sql$/);
    }
  });

  it('applies migrations and tracks them in schema_migrations', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const result = runMigrations(db, path);
    expect(result.migrationsApplied.length).toBe(result.totalMigrations);

    expect(tableExists(db, 'users')).toBe(true);
    expect(tableExists(db, 'schema_migrations')).toBe(true);

    const status = getMigrationStatus(db, path);
    expect(status.every((m) => m.applied)).toBe(true);

    db.close();
  });

  it('is idempotent: a second run applies nothing', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db, path);
    const second = runMigrations(db, path);
    expect(second.migrationsApplied).toEqual([]);
    db.close();
  });

  it('rolls back the last migration and re-applies cleanly', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db, path);
    expect(tableExists(db, 'users')).toBe(true);

    const rolled = rollbackMigrations(db, path, 1);
    expect(rolled.migrationsRolledBack.length).toBe(1);
    expect(tableExists(db, 'users')).toBe(false);
    expect(tableExists(db, 'banks')).toBe(false);
    expect(tableExists(db, 'schema_migrations')).toBe(true);

    const reapplied = runMigrations(db, path);
    expect(reapplied.migrationsApplied.length).toBe(1);
    expect(tableExists(db, 'users')).toBe(true);

    db.close();
  });

  it('rolls back everything with steps="all"', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db, path);
    const rolled = rollbackMigrations(db, path, 'all');
    expect(rolled.migrationsRolledBack.length).toBeGreaterThan(0);
    expect(tableExists(db, 'users')).toBe(false);
    db.close();
  });

  it('rolling back when nothing is applied is a no-op', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const rolled = rollbackMigrations(db, path, 1);
    expect(rolled.migrationsRolledBack).toEqual([]);
    db.close();
  });
});
