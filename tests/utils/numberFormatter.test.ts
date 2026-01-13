import { describe, expect, it, beforeEach, vi } from 'vitest';
import { formatDisplayNumber, formatDisplayPercent, formatDisplayCurrency } from '../../src/utils/numberFormatter';

// Mock loadSettings to return controlled settings
vi.mock('../../src/utils/cookieSettings', () => ({
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

// Import after mocking
import { loadSettings } from '../../src/utils/cookieSettings';
const mockedLoadSettings = vi.mocked(loadSettings);

describe('formatDisplayNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    mockedLoadSettings.mockReturnValue({
      accountName: 'My Portfolio',
      decimalSeparator: '.',
      decimalPlaces: 2,
      currencySettings: {
        defaultCurrency: 'EUR',
        fallbackRates: { EUR: 1, USD: 0.85 },
        useApiRates: true,
        lastApiUpdate: null,
      },
    });
  });

  describe('basic formatting with default settings (2 decimal places, period separator)', () => {
    it('formats small numbers with decimal places', () => {
      expect(formatDisplayNumber(123.456)).toBe('123.46');
    });

    it('formats numbers below 1000 with decimals', () => {
      expect(formatDisplayNumber(999.999)).toBe('1,000');
    });

    it('formats numbers at exactly 1000 without decimals', () => {
      expect(formatDisplayNumber(1000)).toBe('1,000');
    });

    it('formats numbers above 1000 without decimals', () => {
      expect(formatDisplayNumber(1234.56)).toBe('1,235');
    });

    it('formats large numbers without decimals', () => {
      expect(formatDisplayNumber(123456.789)).toBe('123,457');
    });

    it('handles zero', () => {
      expect(formatDisplayNumber(0)).toBe('0.00');
    });

    it('handles small decimals', () => {
      expect(formatDisplayNumber(0.123)).toBe('0.12');
    });
  });

  describe('rounding rules (.5 rounds up, .4 rounds down)', () => {
    it('rounds .5 up at third decimal', () => {
      expect(formatDisplayNumber(1.235)).toBe('1.24');
    });

    it('rounds .4 down at third decimal', () => {
      expect(formatDisplayNumber(1.234)).toBe('1.23');
    });

    it('rounds .5 up for larger numbers', () => {
      expect(formatDisplayNumber(999.995)).toBe('1,000');
    });

    it('rounds .4 down for larger numbers', () => {
      expect(formatDisplayNumber(999.994)).toBe('999.99');
    });

    it('rounds correctly for numbers just below 1000', () => {
      expect(formatDisplayNumber(999.5)).toBe('999.50');
    });
  });

  describe('with comma decimal separator', () => {
    beforeEach(() => {
      mockedLoadSettings.mockReturnValue({
        accountName: 'My Portfolio',
        decimalSeparator: ',',
        decimalPlaces: 2,
        currencySettings: {
          defaultCurrency: 'EUR',
          fallbackRates: { EUR: 1, USD: 0.85 },
          useApiRates: true,
          lastApiUpdate: null,
        },
      });
    });

    it('uses comma as decimal separator', () => {
      expect(formatDisplayNumber(123.45)).toBe('123,45');
    });

    it('uses period as thousands separator when comma is decimal', () => {
      expect(formatDisplayNumber(1234.56)).toBe('1.235');
    });

    it('formats large numbers correctly', () => {
      expect(formatDisplayNumber(123456)).toBe('123.456');
    });
  });

  describe('with different decimal places setting', () => {
    it('respects 0 decimal places setting', () => {
      mockedLoadSettings.mockReturnValue({
        accountName: 'My Portfolio',
        decimalSeparator: '.',
        decimalPlaces: 0,
        currencySettings: {
          defaultCurrency: 'EUR',
          fallbackRates: { EUR: 1, USD: 0.85 },
          useApiRates: true,
          lastApiUpdate: null,
        },
      });
      expect(formatDisplayNumber(123.456)).toBe('123');
    });

    it('respects 3 decimal places setting', () => {
      mockedLoadSettings.mockReturnValue({
        accountName: 'My Portfolio',
        decimalSeparator: '.',
        decimalPlaces: 3,
        currencySettings: {
          defaultCurrency: 'EUR',
          fallbackRates: { EUR: 1, USD: 0.85 },
          useApiRates: true,
          lastApiUpdate: null,
        },
      });
      expect(formatDisplayNumber(123.4567)).toBe('123.457');
    });

    it('still removes decimals for numbers >= 1000 regardless of setting', () => {
      mockedLoadSettings.mockReturnValue({
        accountName: 'My Portfolio',
        decimalSeparator: '.',
        decimalPlaces: 3,
        currencySettings: {
          defaultCurrency: 'EUR',
          fallbackRates: { EUR: 1, USD: 0.85 },
          useApiRates: true,
          lastApiUpdate: null,
        },
      });
      expect(formatDisplayNumber(1234.5678)).toBe('1,235');
    });
  });

  describe('negative numbers', () => {
    it('formats negative numbers below 1000 with decimals', () => {
      expect(formatDisplayNumber(-123.456)).toBe('-123.46');
    });

    it('formats negative numbers at or above 1000 without decimals', () => {
      expect(formatDisplayNumber(-1234.56)).toBe('-1,235');
    });
  });
});

describe('formatDisplayPercent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLoadSettings.mockReturnValue({
      accountName: 'My Portfolio',
      decimalSeparator: '.',
      decimalPlaces: 2,
      currencySettings: {
        defaultCurrency: 'EUR',
        fallbackRates: { EUR: 1, USD: 0.85 },
        useApiRates: true,
        lastApiUpdate: null,
      },
    });
  });

  it('formats percentage with decimals and % symbol', () => {
    expect(formatDisplayPercent(45.678)).toBe('45.68%');
  });

  it('formats small percentages', () => {
    expect(formatDisplayPercent(0.123)).toBe('0.12%');
  });

  it('formats 100%', () => {
    expect(formatDisplayPercent(100)).toBe('100.00%');
  });

  it('respects decimal separator setting', () => {
    mockedLoadSettings.mockReturnValue({
      accountName: 'My Portfolio',
      decimalSeparator: ',',
      decimalPlaces: 2,
      currencySettings: {
        defaultCurrency: 'EUR',
        fallbackRates: { EUR: 1, USD: 0.85 },
        useApiRates: true,
        lastApiUpdate: null,
      },
    });
    expect(formatDisplayPercent(45.678)).toBe('45,68%');
  });

  describe('with showSign option', () => {
    it('shows + sign for positive values when showSign is true', () => {
      expect(formatDisplayPercent(45.678, true)).toBe('+45.68%');
    });

    it('shows - sign for negative values when showSign is true', () => {
      expect(formatDisplayPercent(-45.678, true)).toBe('-45.68%');
    });

    it('shows + sign for zero when showSign is true', () => {
      expect(formatDisplayPercent(0, true)).toBe('+0.00%');
    });

    it('does not show + sign for positive values when showSign is false', () => {
      expect(formatDisplayPercent(45.678, false)).toBe('45.68%');
    });

    it('handles negative values without showSign', () => {
      expect(formatDisplayPercent(-45.678)).toBe('-45.68%');
    });
  });
});

describe('formatDisplayCurrency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLoadSettings.mockReturnValue({
      accountName: 'My Portfolio',
      decimalSeparator: '.',
      decimalPlaces: 2,
      currencySettings: {
        defaultCurrency: 'EUR',
        fallbackRates: { EUR: 1, USD: 0.85 },
        useApiRates: true,
        lastApiUpdate: null,
      },
    });
  });

  it('formats currency with symbol and no decimals for values >= 1000', () => {
    expect(formatDisplayCurrency(1234.56)).toBe('€1,235');
  });

  it('formats currency with decimals for values < 1000', () => {
    expect(formatDisplayCurrency(123.456)).toBe('€123.46');
  });

  it('uses specified currency symbol', () => {
    expect(formatDisplayCurrency(123.45, 'USD')).toBe('$123.45');
  });

  it('uses specified currency symbol for GBP', () => {
    expect(formatDisplayCurrency(123.45, 'GBP')).toBe('£123.45');
  });

  it('respects decimal separator setting', () => {
    mockedLoadSettings.mockReturnValue({
      accountName: 'My Portfolio',
      decimalSeparator: ',',
      decimalPlaces: 2,
      currencySettings: {
        defaultCurrency: 'EUR',
        fallbackRates: { EUR: 1, USD: 0.85 },
        useApiRates: true,
        lastApiUpdate: null,
      },
    });
    expect(formatDisplayCurrency(123.45)).toBe('€123,45');
  });

  it('formats negative currency values', () => {
    expect(formatDisplayCurrency(-123.45)).toBe('€-123.45');
  });

  it('formats zero', () => {
    expect(formatDisplayCurrency(0)).toBe('€0.00');
  });
});
