import { describe, expect, it, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuditLogProvider, useAuditLog } from '../../src/contexts/AuditLogContext';
import { loadAuditLog, clearAuditLog } from '../../src/utils/cookieStorage';

// Cookie + localStorage mocks so the encrypted store works under jsdom.
const cookieMock = (() => {
  let cookies: Record<string, string> = {};
  return {
    get: () => Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
    set: (value: string) => {
      const [pair] = value.split(';');
      const [k, v] = pair.split('=');
      if (k && v !== undefined) {
        if (v === '' || value.includes('max-age=0') || value.includes('expires=Thu, 01 Jan 1970')) delete cookies[k.trim()];
        else cookies[k.trim()] = v.trim();
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

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuditLogProvider>{children}</AuditLogProvider>
);

describe('AuditLogContext', () => {
  beforeEach(() => {
    cookieMock.clear();
    localStorageMock.clear();
    clearAuditLog();
  });

  it('throws when useAuditLog is used outside a provider', () => {
    expect(() => renderHook(() => useAuditLog())).toThrow(/AuditLogProvider/);
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper });
    expect(result.current.entries).toEqual([]);
  });

  it('logAuditEvent appends an entry with id, timestamp and sessionId', () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper });

    act(() => {
      result.current.logAuditEvent('CREATE_ASSET', { assetClass: 'STOCKS' });
    });

    expect(result.current.entries).toHaveLength(1);
    const [entry] = result.current.entries;
    expect(entry.actionType).toBe('CREATE_ASSET');
    expect(entry.payload).toEqual({ assetClass: 'STOCKS' });
    expect(typeof entry.id).toBe('string');
    expect(entry.id.length).toBeGreaterThan(0);
    expect(typeof entry.timestamp).toBe('string');
    expect(typeof entry.sessionId).toBe('string');
  });

  it('persists entries to encrypted storage', () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper });

    act(() => {
      result.current.logAuditEvent('EXPORT_DATA', { dataset: 'fire-calculator' });
    });

    const stored = loadAuditLog();
    expect(stored).toHaveLength(1);
    expect(stored[0].actionType).toBe('EXPORT_DATA');
  });

  it('records representative actions in order', () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper });

    act(() => {
      result.current.logAuditEvent('CREATE_ASSET', { assetClass: 'STOCKS' });
      result.current.logAuditEvent('UPDATE_ASSET', { assetId: 'a1', fields: 'currentValue' });
      result.current.logAuditEvent('DELETE_ASSET', { assetId: 'a1' });
      result.current.logAuditEvent('RUN_CALCULATION', { yearsToFIRE: 12 });
      result.current.logAuditEvent('UPDATE_SETTINGS', { setting: 'decimalPlaces' });
    });

    expect(result.current.entries.map(e => e.actionType)).toEqual([
      'CREATE_ASSET',
      'UPDATE_ASSET',
      'DELETE_ASSET',
      'RUN_CALCULATION',
      'UPDATE_SETTINGS',
    ]);
  });

  it('sanitizes non-primitive and oversized payload values', () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper });

    act(() => {
      result.current.logAuditEvent('UPDATE_SETTINGS', {
        ok: 'value',
        // @ts-expect-error intentionally invalid to verify sanitisation
        nested: { a: 1 },
        long: 'x'.repeat(500),
      });
    });

    const [entry] = result.current.entries;
    expect(entry.payload.ok).toBe('value');
    expect('nested' in entry.payload).toBe(false);
    expect((entry.payload.long as string).length).toBe(120);
  });

  it('clearLog empties entries and storage', () => {
    const { result } = renderHook(() => useAuditLog(), { wrapper });

    act(() => {
      result.current.logAuditEvent('IMPORT_DATA', { dataset: 'asset-allocation' });
    });
    expect(result.current.entries).toHaveLength(1);

    act(() => {
      result.current.clearLog();
    });
    expect(result.current.entries).toEqual([]);
    expect(loadAuditLog()).toEqual([]);
  });
});
