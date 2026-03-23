import { describe, it, expect } from 'vitest';
import {
  YAHOO_DAILY_LIMIT,
} from '../../src/types/priceApi';
import type {
  MonthlyClosingPrice,
  PriceFetchResult,
  ExchangeRateData,
  ExchangeRateFetchResult,
  RateLimitInfo,
} from '../../src/types/priceApi';

describe('Price API Types', () => {
  describe('YAHOO_DAILY_LIMIT', () => {
    it('should have a positive daily limit', () => {
      expect(YAHOO_DAILY_LIMIT).toBeGreaterThan(0);
      expect(YAHOO_DAILY_LIMIT).toBe(500);
    });
  });

  describe('Type compatibility', () => {
    it('should allow creating MonthlyClosingPrice objects', () => {
      const price: MonthlyClosingPrice = {
        ticker: 'AAPL',
        date: '2024-01-31',
        open: 150,
        high: 155,
        low: 148,
        close: 152,
        volume: 1000000,
      };

      expect(price.ticker).toBe('AAPL');
      expect(price.close).toBe(152);
    });

    it('should allow MonthlyClosingPrice without volume', () => {
      const price: MonthlyClosingPrice = {
        ticker: 'BND',
        date: '2024-01-31',
        open: 80,
        high: 82,
        low: 79,
        close: 81,
      };

      expect(price.volume).toBeUndefined();
    });

    it('should allow creating PriceFetchResult objects', () => {
      const result: PriceFetchResult = {
        ticker: 'AAPL',
        prices: [],
        fetchedAt: new Date().toISOString(),
      };

      expect(result.error).toBeUndefined();
    });

    it('should allow creating PriceFetchResult with error', () => {
      const result: PriceFetchResult = {
        ticker: 'INVALID',
        prices: [],
        fetchedAt: new Date().toISOString(),
        error: 'Ticker not found',
      };

      expect(result.error).toBe('Ticker not found');
    });

    it('should allow creating ExchangeRateData objects', () => {
      const rate: ExchangeRateData = {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        date: '2024-01-15',
      };

      expect(rate.rate).toBe(0.85);
    });

    it('should allow creating ExchangeRateFetchResult objects', () => {
      const result: ExchangeRateFetchResult = {
        rates: [],
        fetchedAt: new Date().toISOString(),
      };

      expect(result.error).toBeUndefined();
    });

    it('should allow creating RateLimitInfo objects', () => {
      const info: RateLimitInfo = {
        requestsToday: 5,
        dailyLimit: 500,
        lastRequestAt: new Date().toISOString(),
        resetDate: '2024-01-15',
      };

      expect(info.requestsToday).toBe(5);
    });
  });
});
