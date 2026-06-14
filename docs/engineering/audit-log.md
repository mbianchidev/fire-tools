# Audit log

Fire Tools keeps a **privacy-first, client-side audit log** of meaningful user
actions (creating/editing/deleting assets, running the FIRE calculation,
changing settings, importing/exporting data). It exists so a user can answer
*"what did I just change?"* — it is **never** transmitted off device in the
pure-web build.

## Design goals

- **Local only** — entries live in the same encrypted store as the rest of the
  app state. No network calls, no auto-export.
- **Non-sensitive payloads** — entries record *context*, not data. We log an
  asset's `assetClass`/`assetId` and which fields changed, never the ticker,
  amount, or any financial value.
- **Bounded** — capped to the newest 50 entries **and** trimmed to a byte
  budget so it can never blow the ~4 KB cookie limit.
- **Additive & surgical** — wiring a new action is one `logAuditEvent(...)`
  call; nothing else needs to know the log exists.

## Moving parts

| Layer | File | Responsibility |
| ----- | ---- | -------------- |
| Type contract | `src/types/auditLog.ts` | `AuditActionType` union, `AUDIT_ACTION_TYPES`, `AuditLogEntry`, `isAuditActionType` guard |
| Storage | `src/utils/cookieStorage.ts` | `saveAuditLog` / `loadAuditLog` / `clearAuditLog`, capping + byte-budget trim, AES via the existing cookie model |
| State | `src/contexts/AuditLogContext.tsx` | `AuditLogProvider` + `useAuditLog()` → `{ entries, logAuditEvent, clearLog }` |
| UI | `src/components/SettingsPage.tsx` | Collapsible **Audit log** panel: filter by action/date, expandable rows, clear |
| Contract (server) | `docs/api/openapi.yaml`, `docs/database/schema.sql`, `server/migrations/0003_audit_log.*` | `AuditLogEntry` schema, `audit_log` table mirroring the union |

## The hook

```tsx
import { useAuditLog } from '../contexts/AuditLogContext';

const { logAuditEvent } = useAuditLog();

// Record an action. Payload values must be primitive (string/number/boolean).
logAuditEvent('CREATE_ASSET', { assetClass: asset.assetClass, assetId: asset.id });
```

`logAuditEvent`:

- is a **no-op in demo mode** (so the public demo never persists anything),
- mints a unique `id` (UUID when `crypto.randomUUID` is available),
- stamps an ISO-8601 `timestamp` and a per-app-load `sessionId`,
- **sanitizes** the payload — drops non-primitives, caps to 12 keys, truncates
  long strings — before appending.

Entries are persisted with a `useEffect` on the entry list (the initial
hydration render is skipped) so the encrypted write happens once per change.

## Action types

`CREATE_ASSET`, `UPDATE_ASSET`, `DELETE_ASSET`, `RUN_CALCULATION`,
`UPDATE_SETTINGS`, `IMPORT_DATA`, `EXPORT_DATA`, `CLEAR_DATA`.

This union is the single source of truth. If you add a value, update **all
four** places to keep the contract in sync:

1. `src/types/auditLog.ts` (the union + `AUDIT_ACTION_TYPES`)
2. `docs/api/openapi.yaml` (`AuditActionType` enum)
3. `docs/database/schema.sql` (`audit_log.action_type` `CHECK (... IN ...)`)
4. `server/migrations/0003_audit_log.up.sql` (same `CHECK`)

…and add an i18n label under `auditLog.actions.*` in **all five** locales.

## Where actions are wired

- **Asset create/update/delete** — `src/components/AssetAllocationPage.tsx`.
  `UPDATE_ASSET` is debounced per-asset (~800 ms) so editing a field doesn't
  flood the log with one entry per keystroke.
- **Run calculation / export / import** — `src/App.tsx` (`FIRECalculatorPage`).
  `RUN_CALCULATION` is debounced (~1.5 s) and skips the first render, because
  the calculator recomputes automatically on every input change.
- **Withdrawal-rate run** — `src/components/WithdrawalRatePage.tsx` logs
  `RUN_CALCULATION` (`tool: 'withdrawal-rate'`), debounced + skip-first like the
  FIRE calculator since the sweep recomputes reactively.
- **Portfolio backtest** — `src/components/BacktestSection.tsx` logs
  `RUN_CALCULATION` (`tool: 'portfolio-backtest'`) on a successful run; this is
  an explicit button press, so it's logged directly (no debounce).
- **Settings change** — `src/components/SettingsPage.tsx` (`UPDATE_SETTINGS`,
  logging only the changed key name).

> The Net-worth **Sankey** view is a passive visualization, not a user action,
> so it is intentionally not audited.

> **Why not instrument everything?** The log is a UX affordance, not telemetry.
> We cover the main flows cleanly rather than emitting noise.

## Privacy & retention

- A full **Clear all data** wipes the audit log along with everything else, so
  we deliberately do **not** log `CLEAR_DATA` in that path (the entry would be
  erased in the same breath).
- The Settings panel has its own **Clear audit log** button that empties only
  the log.
- Nothing leaves the device. There is intentionally no "export audit log"
  action.

## Testing

- `tests/pages/settings/auditLogStorage.test.ts` — round-trip, encryption (no
  plaintext on disk), cap, clear, and `clearAllData` wiping the log.
- `tests/shared/AuditLogContext.test.tsx` — hook guard, append, persistence,
  representative action ordering, payload sanitization, `clearLog`.
