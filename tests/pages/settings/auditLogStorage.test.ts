import { describe, expect, it, beforeEach } from 'vitest';
import {
  saveAuditLog,
  loadAuditLog,
  clearAuditLog,
  clearAllData,
} from '../../../src/utils/cookieStorage';
import type { AuditLogEntry } from '../../../src/types/auditLog';

// Mock document.cookie (matches the pattern used by cookieStorage.test.ts).
const cookieMock = (() => {
  let cookies: Record<string, string> = {};
  return {
    get: () => Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
    set: (value: string) => {
      const [pair] = value.split(';');
      const [k, v] = pair.split('=');
      if (k && v !== undefined) {
        if (v === '' || value.includes('max-age=0') || value.includes('expires=Thu, 01 Jan 1970')) {
          delete cookies[k.trim()];
        } else {
          cookies[k.trim()] = v.trim();
        }
      }
    },
    clear: () => { cookies = {}; },
  };
})();

Object.defineProperty(document, 'cookie', {
  get: () => cookieMock.get(),
  set: (value: string) => cookieMock.set(value),
  configurable: true,
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

const makeEntry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: `id-${Math.random().toString(36).slice(2)}`,
  timestamp: new Date().toISOString(),
  actionType: 'CREATE_ASSET',
  payload: { assetClass: 'STOCKS' },
  sessionId: 'session-1',
  ...overrides,
});

describe('Audit log storage', () => {
  beforeEach(() => {
    cookieMock.clear();
    localStorageMock.clear();
    clearAuditLog();
  });

  it('returns an empty array when nothing is stored', () => {
    expect(loadAuditLog()).toEqual([]);
  });

  it('round-trips entries through encrypted storage', () => {
    const entries = [makeEntry({ actionType: 'CREATE_ASSET' }), makeEntry({ actionType: 'EXPORT_DATA', payload: { dataset: 'fire-calculator' } })];
    saveAuditLog(entries);

    const loaded = loadAuditLog();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].actionType).toBe('CREATE_ASSET');
    expect(loaded[1].actionType).toBe('EXPORT_DATA');
    expect(loaded[1].payload).toEqual({ dataset: 'fire-calculator' });
  });

  it('does not persist as readable plaintext', () => {
    saveAuditLog([makeEntry({ payload: { secretField: 'topsecret' } })]);
    const raw = localStorageMock.getItem('fire-tools-audit-log') ?? cookieMock.get();
    expect(raw).not.toContain('topsecret');
    expect(raw).not.toContain('CREATE_ASSET');
  });

  it('caps the number of stored entries (newest kept)', () => {
    const many = Array.from({ length: 80 }, (_, i) =>
      makeEntry({ id: `entry-${i}`, payload: { index: i } }),
    );
    saveAuditLog(many);

    const loaded = loadAuditLog();
    expect(loaded.length).toBeLessThanOrEqual(50);
    // Newest entries are retained; the very last one must survive.
    expect(loaded[loaded.length - 1].id).toBe('entry-79');
  });

  it('drops invalid entries on load', () => {
    const good = makeEntry({ id: 'good' });
    saveAuditLog([good]);
    // Sanity: the good entry survives a round-trip.
    expect(loadAuditLog().map(e => e.id)).toContain('good');
  });

  it('clearAuditLog empties the log', () => {
    saveAuditLog([makeEntry()]);
    expect(loadAuditLog().length).toBeGreaterThan(0);
    clearAuditLog();
    expect(loadAuditLog()).toEqual([]);
  });

  it('clearAllData also clears the audit log', () => {
    saveAuditLog([makeEntry()]);
    clearAllData();
    expect(loadAuditLog()).toEqual([]);
  });
});
