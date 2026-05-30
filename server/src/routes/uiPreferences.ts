import { Router } from 'express';
import type { Database } from 'better-sqlite3';
import { handler, resolveUserId, apiError, nowIso } from '../http.js';

interface PreferenceRow {
  key: string;
  value: string;
  updated_at: string;
}

const KEY_PATTERN = /^[a-z][a-z0-9_.-]{0,63}$/i;
const MAX_VALUE_LENGTH = 8 * 1024;

const validateKey = (key: string): void => {
  if (!KEY_PATTERN.test(key)) {
    throw apiError(
      400,
      'invalid_param',
      'Preference key must be 1–64 chars of [A-Za-z0-9_.-] and start with a letter',
    );
  }
};

const validateValue = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw apiError(400, 'invalid_body', 'Preference value must be a string');
  }
  if (value.length > MAX_VALUE_LENGTH) {
    throw apiError(400, 'invalid_body', `Preference value exceeds ${MAX_VALUE_LENGTH} bytes`);
  }
  return value;
};

export const buildUiPreferencesRouter = (db: Database): Router => {
  const router = Router();

  router.get(
    '/ui-preferences',
    handler((req, res) => {
      const userId = resolveUserId(req);
      const rows = db
        .prepare('SELECT key, value, updated_at FROM ui_preferences WHERE user_id = ?')
        .all(userId) as PreferenceRow[];
      const preferences = rows.reduce<Record<string, string>>((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      res.json({ preferences });
    }),
  );

  router.get(
    '/ui-preferences/:key',
    handler((req, res) => {
      const userId = resolveUserId(req);
      const { key } = req.params;
      validateKey(key);
      const row = db
        .prepare('SELECT key, value, updated_at FROM ui_preferences WHERE user_id = ? AND key = ?')
        .get(userId, key) as PreferenceRow | undefined;
      if (!row) {
        throw apiError(404, 'not_found', `Preference "${key}" not set`);
      }
      res.json({ key: row.key, value: row.value, updatedAt: row.updated_at });
    }),
  );

  router.put(
    '/ui-preferences/:key',
    handler((req, res) => {
      const userId = resolveUserId(req);
      const { key } = req.params;
      validateKey(key);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const value = validateValue(body.value);
      const updatedAt = nowIso();
      db.prepare(
        `INSERT INTO ui_preferences (user_id, key, value, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, key) DO UPDATE
           SET value = excluded.value,
               updated_at = excluded.updated_at`,
      ).run(userId, key, value, updatedAt);
      res.json({ key, value, updatedAt });
    }),
  );

  router.delete(
    '/ui-preferences/:key',
    handler((req, res) => {
      const userId = resolveUserId(req);
      const { key } = req.params;
      validateKey(key);
      const info = db
        .prepare('DELETE FROM ui_preferences WHERE user_id = ? AND key = ?')
        .run(userId, key);
      if (info.changes === 0) {
        throw apiError(404, 'not_found', `Preference "${key}" not set`);
      }
      res.status(204).end();
    }),
  );

  return router;
};
