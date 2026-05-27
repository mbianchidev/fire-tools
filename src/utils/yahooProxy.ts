/**
 * Yahoo Finance API proxy and rate limiter
 * 
 * Centralizes all Yahoo Finance API access through a single gateway that:
 * - Routes through a proxy to avoid CORS restrictions
 * - Enforces per-request throttling (minimum delay between requests)
 * - Tracks daily request budget
 * - Returns a clear error when limits are hit
 * 
 * Every Yahoo Finance call in the app MUST use `yahooFetch()` instead of
 * raw `fetch()` to respect these limits.
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com';

// --- Rate Limit Configuration ---

/** Minimum milliseconds between consecutive requests */
const MIN_REQUEST_INTERVAL_MS = 1000;

/** Maximum requests per day (Yahoo's unofficial limit is ~2 000; stay well under) */
const DAILY_LIMIT = 500;

// --- State ---

let requestsToday = 0;
let lastRequestAt = 0; // epoch ms
let currentDay = '';    // YYYY-MM-DD

/**
 * Reset the daily counter if the calendar day has rolled over.
 */
function ensureDayReset(): void {
  const today = new Date().toISOString().split('T')[0];
  if (today !== currentDay) {
    currentDay = today;
    requestsToday = 0;
  }
}

// --- Public helpers ---

/** True when the daily budget still has room. */
export function hasRateLimitCapacity(): boolean {
  ensureDayReset();
  return requestsToday < DAILY_LIMIT;
}

/** Snapshot of the current rate-limit state (for UI display). */
export function getRateLimitStatus() {
  ensureDayReset();
  return {
    requestsToday,
    dailyLimit: DAILY_LIMIT,
    lastRequestAt: lastRequestAt ? new Date(lastRequestAt).toISOString() : null,
    resetDate: currentDay,
  };
}

// --- Core fetch wrapper ---

/**
 * Build the proxied URL for a Yahoo Finance API path.
 */
function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (import.meta.env.DEV) {
    return `/api/yahoo${cleanPath}`;
  }

  return `https://corsproxy.io/?url=${encodeURIComponent(`${YAHOO_BASE}${cleanPath}`)}`;
}

/**
 * Fetch from Yahoo Finance with automatic CORS proxying and rate limiting.
 *
 * @param path  API path, e.g. "/v8/finance/chart/SPY?interval=1d&range=1d"
 * @returns     The parsed JSON body, or throws on error / rate limit.
 */
export async function yahooFetch<T = unknown>(path: string): Promise<T> {
  ensureDayReset();

  // --- daily budget check ---
  if (requestsToday >= DAILY_LIMIT) {
    throw new YahooRateLimitError(
      `Yahoo Finance daily limit reached (${DAILY_LIMIT} requests). Try again tomorrow.`,
    );
  }

  // --- per-request throttle ---
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
  }

  // --- execute ---
  lastRequestAt = Date.now();
  requestsToday++;

  const url = buildUrl(path);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 429) {
    throw new YahooRateLimitError(
      'Yahoo Finance returned 429 Too Many Requests. Please wait before retrying.',
    );
  }

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Distinguishable error class so callers can detect rate-limit issues. */
export class YahooRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YahooRateLimitError';
  }
}
