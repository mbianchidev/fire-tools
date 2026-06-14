import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuditLogProvider, useAuditLog } from '../../../src/contexts/AuditLogContext';
import { clearAuditLog } from '../../../src/utils/cookieStorage';
import type { Asset } from '../../../src/types/assetAllocation';
import type { PortfolioBacktestSuccess } from '../../../src/types/backtest';

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

const backtestSuccess: PortfolioBacktestSuccess = {
  ok: true,
  years: [
    { year: 2022, annualReturn: 0.1, portfolioValue: 11000, drawdown: 0, marketWeight: 1, assumptionWeight: 0 },
    { year: 2023, annualReturn: 0.05, portfolioValue: 11550, drawdown: 0, marketWeight: 1, assumptionWeight: 0 },
  ],
  metrics: {
    cagr: 0.075,
    totalReturn: 0.155,
    annualizedVolatility: 0.1,
    maxDrawdown: 0,
    bestYear: { year: 2022, return: 0.1 },
    worstYear: { year: 2023, return: 0.05 },
    finalValue: 11550,
  },
  coverage: [],
  assumptionsUsed: false,
  assumptionSource: 'market',
};

vi.mock('../../../src/utils/priceApi', () => ({
  fetchMultipleMonthlyPrices: vi.fn(async () => ({})),
}));
vi.mock('../../../src/utils/backtestCalculator', () => ({
  deriveAnnualReturnsFromMonthlyPrices: vi.fn(() => ({})),
  runPortfolioBacktest: vi.fn(() => backtestSuccess),
}));

import { BacktestSection } from '../../../src/components/BacktestSection';

const eligibleAsset: Asset = {
  id: 'a1',
  name: 'Global Stocks',
  ticker: 'VWCE',
  assetClass: 'STOCKS',
  subAssetType: 'ETF',
  currentValue: 10000,
  targetMode: 'PERCENTAGE',
  targetPercent: 100,
};

let lastEntries: ReturnType<typeof useAuditLog>['entries'] = [];
function EntryProbe() {
  const { entries } = useAuditLog();
  lastEntries = entries;
  return <span data-testid="entry-count">{entries.length}</span>;
}

const renderWithProvider = (ui: ReactNode) =>
  render(
    <AuditLogProvider>
      {ui}
      <EntryProbe />
    </AuditLogProvider>,
  );

describe('BacktestSection audit logging', () => {
  beforeEach(() => {
    cookieMock.clear();
    localStorageMock.clear();
    clearAuditLog();
    lastEntries = [];
  });

  it('records a RUN_CALCULATION audit entry on a successful backtest', async () => {
    renderWithProvider(
      <BacktestSection assets={[eligibleAsset]} currency="EUR" isPrivacyMode={false} />,
    );

    const runButton = screen.getByRole('button', { name: /run/i });
    await act(async () => {
      runButton.click();
    });

    await waitFor(() => {
      expect(lastEntries.some((e) => e.actionType === 'RUN_CALCULATION')).toBe(true);
    });

    const entry = lastEntries.find((e) => e.actionType === 'RUN_CALCULATION');
    expect(entry?.payload.tool).toBe('portfolio-backtest');
    expect(entry?.payload.assetCount).toBe(1);
  });
});
