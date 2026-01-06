import { describe, expect, it, vi, beforeEach } from 'vitest';
import { formatCurrency } from './allocationCalculator';

// Mock loadSettings to return controlled settings
vi.mock('./cookieSettings', () => ({
  loadSettings: vi.fn(() => ({
    accountName: 'My Portfolio',
    decimalSeparator: '.',
    decimalPlaces: 2,
    currencySettings: {
      defaultCurrency: 'EUR',
      fallbackRates: { EUR: 1, USD: 0.85 },
      useApiRates: true,
      lastApiUpdate: null,
    },
  })),
}));

describe('formatCurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses euro symbol by default', () => {
    // Values >= 1000 have no decimals
    expect(formatCurrency(1234)).toBe('€1,234');
  });

  it('uses euro symbol when currency is explicitly EUR', () => {
    expect(formatCurrency(987.65, 'EUR').startsWith('€')).toBe(true);
  });

  it('formats values below 1000 with decimals', () => {
    expect(formatCurrency(987.65, 'EUR')).toBe('€987.65');
  });

  it('formats values at or above 1000 without decimals', () => {
    expect(formatCurrency(1000, 'EUR')).toBe('€1,000');
  });
});
