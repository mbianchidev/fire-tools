/**
 * useExchangeRates Hook
 * 
 * Fetches live exchange rates from Yahoo Finance.
 * Falls back to hardcoded rates if the API is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { ExchangeRates } from '../types/currency';
import { fetchExchangeRatesAsMap } from '../utils/exchangeRateApi';
import { loadSettings, saveSettings } from '../utils/cookieSettings';

export interface UseExchangeRatesReturn {
  rates: ExchangeRates;
  isLoading: boolean;
  isUsingFallback: boolean;
  lastUpdate: string | null;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage live exchange rates from Yahoo Finance.
 * Automatically fetches on mount if useApiRates is enabled in settings.
 * Persists fetched rates to settings for use across the app.
 */
export function useExchangeRates(): UseExchangeRatesReturn {
  const [rates, setRates] = useState<ExchangeRates>(() => {
    const settings = loadSettings();
    return settings.currencySettings.fallbackRates;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(() => {
    const settings = loadSettings();
    return settings.currencySettings.lastApiUpdate;
  });
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchExchangeRatesAsMap();

      setRates(result.rates);
      setIsUsingFallback(result.isUsingFallback);
      setLastUpdate(result.lastUpdate);

      if (result.error) {
        setError(result.error);
      }

      // Persist fetched rates to settings so they're used app-wide
      if (!result.isUsingFallback) {
        const settings = loadSettings();
        saveSettings({
          ...settings,
          currencySettings: {
            ...settings.currencySettings,
            fallbackRates: result.rates,
            lastApiUpdate: result.lastUpdate,
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount if API rates are enabled
  useEffect(() => {
    const settings = loadSettings();
    if (settings.currencySettings.useApiRates) {
      refresh();
    }
  }, [refresh]);

  return { rates, isLoading, isUsingFallback, lastUpdate, error, refresh };
}
