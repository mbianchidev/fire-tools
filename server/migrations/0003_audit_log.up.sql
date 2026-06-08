-- =============================================================================
-- 0003_audit_log — privacy-first record of user-meaningful actions
-- =============================================================================
-- Mirrors the encrypted client-side audit log. Payloads carry only
-- non-sensitive context (ids, counts, field names) — never raw financial data.
-- action_type is constrained to the AuditActionType union shared with the
-- frontend (src/types/auditLog.ts) and the OpenAPI contract.

CREATE TABLE IF NOT EXISTS audit_log (
    id           TEXT    PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type  TEXT    NOT NULL
        CHECK (action_type IN
            ('CREATE_ASSET','UPDATE_ASSET','DELETE_ASSET','RUN_CALCULATION',
             'UPDATE_SETTINGS','IMPORT_DATA','EXPORT_DATA','CLEAR_DATA')),
    payload_json TEXT,
    session_id   TEXT,
    created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user
    ON audit_log(user_id, created_at);
