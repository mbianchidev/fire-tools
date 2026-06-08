/**
 * Audit log types.
 *
 * The audit log records meaningful, user-initiated actions (asset CRUD,
 * running a calculation, settings changes, data import/export). It is a
 * privacy-first, client-side-only feature: entries are persisted encrypted in
 * local storage and are never transmitted off device.
 */

/** Discrete, user-meaningful actions worth recording. */
export type AuditActionType =
  | 'CREATE_ASSET'
  | 'UPDATE_ASSET'
  | 'DELETE_ASSET'
  | 'RUN_CALCULATION'
  | 'UPDATE_SETTINGS'
  | 'IMPORT_DATA'
  | 'EXPORT_DATA'
  | 'CLEAR_DATA';

/** Ordered list of every action type — keep in sync with the union above. */
export const AUDIT_ACTION_TYPES: readonly AuditActionType[] = [
  'CREATE_ASSET',
  'UPDATE_ASSET',
  'DELETE_ASSET',
  'RUN_CALCULATION',
  'UPDATE_SETTINGS',
  'IMPORT_DATA',
  'EXPORT_DATA',
  'CLEAR_DATA',
] as const;

/**
 * Typed context attached to an audit entry. Values are intentionally limited
 * to primitives so payloads stay small and serialise cleanly. Keep payloads
 * non-sensitive (ids, counts, field names) — never store full financial data.
 */
export type AuditLogPayload = Record<string, string | number | boolean | null>;

export interface AuditLogEntry {
  /** Stable unique id (UUID when available). */
  id: string;
  /** ISO-8601 UTC timestamp of when the action happened. */
  timestamp: string;
  /** What happened. */
  actionType: AuditActionType;
  /** Non-sensitive context for the action. */
  payload: AuditLogPayload;
  /** Optional owning user id (reserved for the multi-tenant backend). */
  userId?: string;
  /** Optional per-app-load session id, to group related actions. */
  sessionId?: string;
}

/** Runtime guard for an {@link AuditActionType}. */
export function isAuditActionType(value: unknown): value is AuditActionType {
  return typeof value === 'string' && (AUDIT_ACTION_TYPES as readonly string[]).includes(value);
}
