/**
 * Price API Types
 * 
 * Types for the Yahoo Finance price API that fetches monthly closing prices
 * for assets and exchange rates.
 */

/**
 * Monthly closing price for a single asset on a specific date
 */
export interface MonthlyClosingPrice {
  ticker: string;
  date: string; // ISO date string (YYYY-MM-DD)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

/**
 * Result of a price fetch operation for a single ticker
 */
export interface PriceFetchResult {
  ticker: string;
  prices: MonthlyClosingPrice[];
  fetchedAt: string; // ISO timestamp
  error?: string;
}

/**
 * Exchange rate data point
 */
export interface ExchangeRateData {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string; // ISO date string
}

/**
 * Result of an exchange rate fetch operation
 */
export interface ExchangeRateFetchResult {
  rates: ExchangeRateData[];
  fetchedAt: string; // ISO timestamp
  error?: string;
}

/**
 * Cache entry for price data
 */
export interface PriceCacheEntry {
  result: PriceFetchResult;
  expiresAt: string; // ISO timestamp
}

/**
 * Cache entry for exchange rate data
 */
export interface ExchangeRateCacheEntry {
  result: ExchangeRateFetchResult;
  expiresAt: string; // ISO timestamp
}

/**
 * Rate limit tracking
 */
export interface RateLimitInfo {
  requestsToday: number;
  dailyLimit: number;
  lastRequestAt: string | null; // ISO timestamp
  resetDate: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Daily rate limit for Yahoo Finance
 */
export const YAHOO_DAILY_LIMIT = 500;
