/**
 * Ticker Lookup Service
 * 
 * Fetches detailed quote data from Yahoo Finance for a given ticker symbol.
 * Returns price, name, currency, and quote type information.
 */

import { yahooFetch } from './yahooProxy';

export interface TickerLookupResult {
  ticker: string;
  price: number;
  name?: string;
  currency?: string;
  quoteType?: string; // EQUITY, ETF, MUTUALFUND, CRYPTOCURRENCY, etc.
  exchange?: string;
  error?: string;
}

/**
 * Look up a ticker symbol via Yahoo Finance and return detailed quote data.
 * 
 * @param ticker - Stock/ETF/crypto ticker symbol (e.g., "MSFT", "VTI", "BTC-USD")
 * @returns Detailed quote result including price, name, currency, and type
 */
export async function lookupTicker(ticker: string): Promise<TickerLookupResult> {
  const cleanTicker = ticker.trim().toUpperCase();

  if (!cleanTicker) {
    return { ticker: cleanTicker, price: 0, error: 'Empty ticker' };
  }

  try {
    const data = await yahooFetch<any>(
      `/v8/finance/chart/${encodeURIComponent(cleanTicker)}?interval=1d&range=1d`,
    );
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) {
      return { ticker: cleanTicker, price: 0, error: 'Ticker not found' };
    }

    const price = meta.regularMarketPrice;

    if (typeof price !== 'number' || price <= 0) {
      return { ticker: cleanTicker, price: 0, error: 'No price available' };
    }

    return {
      ticker: meta.symbol || cleanTicker,
      price,
      name: meta.longName || meta.shortName || undefined,
      currency: meta.currency || undefined,
      quoteType: meta.instrumentType || undefined,
      exchange: meta.fullExchangeName || meta.exchangeName || undefined,
    };
  } catch (err) {
    return {
      ticker: cleanTicker,
      price: 0,
      error: err instanceof Error ? err.message : 'Fetch failed',
    };
  }
}
