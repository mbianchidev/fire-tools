-- =============================================================================
-- 0002_ui_preferences — generic per-user UI preferences KV store
-- =============================================================================
-- Replaces the encrypted-cookie store used by the pure-web build for:
--   * tour completion / skip
--   * questionnaire prompt dismissal
--   * security disclaimer banner dismissal
--   * any future on/off UI prefs we don't want to model as columns
--
-- Values are stored as TEXT (JSON-encoded by the caller). Keep keys short
-- and stable — they are part of the public API contract.

CREATE TABLE IF NOT EXISTS ui_preferences (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key        TEXT    NOT NULL,
    value      TEXT    NOT NULL,
    updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_ui_preferences_user
    ON ui_preferences(user_id);
