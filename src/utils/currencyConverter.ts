/**
 * Currency Converter Utilities
 * Handles currency conversion to/from EUR (the default currency)
 */

import {
  SupportedCurrency,
  ExchangeRates,
  DEFAULT_FALLBACK_RATES,
  SUPPORTED_CURRENCIES,
} from '../types/currency';

/**
 * Convert an amount from a given currency to EUR
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency
 * @param rates - Optional custom exchange rates (defaults to fallback rates)
 * @returns The converted amount in EUR
 */
export function convertToEUR(
  amount: number,
  fromCurrency: SupportedCurrency,
  rates: ExchangeRates = DEFAULT_FALLBACK_RATES
): number {
  if (fromCurrency === 'EUR') {
    return amount;
  }
  
  // First try custom rates, then fallback to defaults
  const rate = rates[fromCurrency] ?? DEFAULT_FALLBACK_RATES[fromCurrency];
  if (rate === undefined || rate <= 0) {
    // This should never happen for SupportedCurrency types, but handle gracefully
    console.error(`Invalid exchange rate for ${fromCurrency}. Using 1:1 conversion as fallback.`);
    return amount;
  }
  
  return amount * rate;
}

/**
 * Convert an amount from EUR to a given currency
 * @param amount - The amount in EUR to convert
 * @param toCurrency - The target currency
 * @param rates - Optional custom exchange rates (defaults to fallback rates)
 * @returns The converted amount in the target currency
 */
export function convertFromEUR(
  amount: number,
  toCurrency: SupportedCurrency,
  rates: ExchangeRates = DEFAULT_FALLBACK_RATES
): number {
  if (toCurrency === 'EUR') {
    return amount;
  }
  
  const rate = rates[toCurrency] ?? DEFAULT_FALLBACK_RATES[toCurrency];
  if (rate === undefined || rate === 0) {
    console.warn(`No exchange rate found for ${toCurrency}, returning original amount`);
    return amount;
  }
  
  return amount / rate;
}

/**
 * Get the symbol for a currency
 * @param currency - The currency code
 * @returns The currency symbol
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  return currencyInfo?.symbol ?? currency;
}

/**
 * Format a currency value with proper symbol and formatting
 * @param value - The numeric value to format
 * @param currency - The currency code
 * @param decimalSeparator - The decimal separator to use ('.' or ',')
 * @returns The formatted currency string
 */
export function formatCurrencyValue(
  value: number,
  currency: SupportedCurrency,
  decimalSeparator: '.' | ',' = '.'
): string {
  const symbol = getCurrencySymbol(currency);
  const absValue = Math.abs(value);
  const isNegative = value < 0;
  
  // Round to 2 decimal places
  const rounded = Math.round(absValue * 100) / 100;
  
  let formatted: string;
  if (decimalSeparator === ',') {
    // European format: 1.234,56
    formatted = rounded.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    // US format: 1,234.56
    formatted = rounded.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Check if a string is a valid supported currency code
 * @param currency - The string to check
 * @returns True if the string is a valid currency code
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.some(c => c.code === currency);
}

/**
 * Get exchange rate between two currencies
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param rates - Optional custom exchange rates
 * @returns The exchange rate
 */
export function getExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rates: ExchangeRates = DEFAULT_FALLBACK_RATES
): number {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  // Convert via EUR
  const fromRate = rates[fromCurrency] ?? DEFAULT_FALLBACK_RATES[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? DEFAULT_FALLBACK_RATES[toCurrency] ?? 1;
  
  // fromCurrency -> EUR -> toCurrency
  // (1 fromCurrency) * fromRate = X EUR
  // X EUR / toRate = Y toCurrency
  return fromRate / toRate;
}

/**
 * Convert an amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param rates - Exchange rates (rates are relative to the base currency in the rates object)
 * @returns The converted amount
 */
export function convertAmount(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rates: ExchangeRates = DEFAULT_FALLBACK_RATES
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const rate = getExchangeRate(fromCurrency, toCurrency, rates);
  return amount * rate;
}

/**
 * Recalculate fallback rates when the default currency changes
 * All rates are recalculated relative to the new default currency
 * @param currentRates - Current exchange rates
 * @param fromDefaultCurrency - The previous default currency
 * @param toDefaultCurrency - The new default currency
 * @returns New exchange rates relative to the new default currency
 */
export function recalculateFallbackRates(
  currentRates: ExchangeRates,
  fromDefaultCurrency: SupportedCurrency,
  toDefaultCurrency: SupportedCurrency
): ExchangeRates {
  if (fromDefaultCurrency === toDefaultCurrency) {
    return { ...currentRates };
  }
  
  const newRates: ExchangeRates = {};
  
  // Get the conversion rate from old default to new default
  // This tells us how much 1 unit of old default is in new default
  const conversionRate = getExchangeRate(fromDefaultCurrency, toDefaultCurrency, currentRates);
  
  // For each currency, recalculate its rate relative to the new default
  SUPPORTED_CURRENCIES.forEach(currency => {
    const code = currency.code;
    if (code === toDefaultCurrency) {
      // The new default currency has a rate of 1
      newRates[code] = 1;
    } else {
      // Get how much 1 unit of this currency is in the old default
      const oldRate = currentRates[code] ?? DEFAULT_FALLBACK_RATES[code] ?? 1;
      // Convert to new default: oldRate * conversionRate
      newRates[code] = oldRate * conversionRate;
    }
  });
  
  return newRates;
}
