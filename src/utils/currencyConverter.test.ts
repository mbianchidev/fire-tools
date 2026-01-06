import { describe, expect, it } from 'vitest';
import {
  convertToEUR,
  convertFromEUR,
  getCurrencySymbol,
  formatCurrencyValue,
  isValidCurrency,
  convertAmount,
  recalculateFallbackRates,
  convertAssetsToNewCurrency,
  convertNetWorthDataToNewCurrency,
  convertExpenseDataToNewCurrency,
  convertFireCalculatorInputsToNewCurrency,
  convertMonthlyVariationsToDisplayCurrency,
  convertNetWorthForecastToDisplayCurrency,
} from './currencyConverter';
import { DEFAULT_FALLBACK_RATES } from '../types/currency';
import { Asset } from '../types/assetAllocation';
import { NetWorthTrackerData, MonthlyVariation, NetWorthForecast } from '../types/netWorthTracker';
import { ExpenseTrackerData } from '../types/expenseTracker';

describe('Currency Converter', () => {
  describe('convertToEUR', () => {
    it('should return same amount for EUR', () => {
      expect(convertToEUR(100, 'EUR')).toBe(100);
    });

    it('should convert USD to EUR using default rate', () => {
      // 1 USD = 0.85 EUR, so 100 USD = 85 EUR
      expect(convertToEUR(100, 'USD')).toBe(85);
    });

    it('should convert GBP to EUR using default rate', () => {
      // 1 GBP = 1.15 EUR, so 100 GBP = 115 EUR
      expect(convertToEUR(100, 'GBP')).toBeCloseTo(115, 2);
    });

    it('should convert CHF to EUR using default rate', () => {
      // 1 CHF = 1.08 EUR, so 100 CHF = 108 EUR
      expect(convertToEUR(100, 'CHF')).toBe(108);
    });

    it('should convert JPY to EUR using default rate', () => {
      // 1 JPY = 0.0054 EUR, so 1000 JPY = 5.4 EUR
      expect(convertToEUR(1000, 'JPY')).toBeCloseTo(5.4, 2);
    });

    it('should convert AUD to EUR using default rate', () => {
      // 1 AUD = 0.57 EUR, so 100 AUD = 57 EUR
      expect(convertToEUR(100, 'AUD')).toBeCloseTo(57, 2);
    });

    it('should convert CAD to EUR using default rate', () => {
      // 1 CAD = 0.62 EUR, so 100 CAD = 62 EUR
      expect(convertToEUR(100, 'CAD')).toBe(62);
    });

    it('should use custom rates when provided', () => {
      const customRates = { ...DEFAULT_FALLBACK_RATES, USD: 0.90 };
      expect(convertToEUR(100, 'USD', customRates)).toBe(90);
    });

    it('should handle zero amounts', () => {
      expect(convertToEUR(0, 'USD')).toBe(0);
    });

    it('should handle negative amounts', () => {
      expect(convertToEUR(-100, 'USD')).toBe(-85);
    });
  });

  describe('convertFromEUR', () => {
    it('should return same amount for EUR', () => {
      expect(convertFromEUR(100, 'EUR')).toBe(100);
    });

    it('should convert EUR to USD using default rate', () => {
      // Rate is 0.85, so 85 EUR = 100 USD
      expect(convertFromEUR(85, 'USD')).toBeCloseTo(100, 2);
    });

    it('should convert EUR to GBP using default rate', () => {
      // Rate is 1.15, so 115 EUR = 100 GBP
      expect(convertFromEUR(115, 'GBP')).toBeCloseTo(100, 2);
    });

    it('should handle zero amounts', () => {
      expect(convertFromEUR(0, 'USD')).toBe(0);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return € for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return $ for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return £ for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£');
    });

    it('should return CHF for CHF', () => {
      expect(getCurrencySymbol('CHF')).toBe('CHF');
    });

    it('should return ¥ for JPY', () => {
      expect(getCurrencySymbol('JPY')).toBe('¥');
    });

    it('should return A$ for AUD', () => {
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });

    it('should return C$ for CAD', () => {
      expect(getCurrencySymbol('CAD')).toBe('C$');
    });
  });

  describe('formatCurrencyValue', () => {
    it('should format EUR with euro symbol', () => {
      expect(formatCurrencyValue(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('should format USD with dollar symbol', () => {
      expect(formatCurrencyValue(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should format with comma decimal separator when specified', () => {
      expect(formatCurrencyValue(1234.56, 'EUR', ',')).toBe('€1.234,56');
    });

    it('should format with point decimal separator when specified', () => {
      expect(formatCurrencyValue(1234.56, 'EUR', '.')).toBe('€1,234.56');
    });

    it('should handle zero values', () => {
      expect(formatCurrencyValue(0, 'EUR')).toBe('€0.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrencyValue(-1234.56, 'EUR')).toBe('-€1,234.56');
    });

    it('should format large numbers correctly', () => {
      expect(formatCurrencyValue(1000000, 'EUR')).toBe('€1,000,000.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrencyValue(1234.567, 'EUR')).toBe('€1,234.57');
    });
  });

  describe('isValidCurrency', () => {
    it('should return true for valid currencies', () => {
      expect(isValidCurrency('EUR')).toBe(true);
      expect(isValidCurrency('USD')).toBe(true);
      expect(isValidCurrency('GBP')).toBe(true);
      expect(isValidCurrency('CHF')).toBe(true);
      expect(isValidCurrency('JPY')).toBe(true);
      expect(isValidCurrency('AUD')).toBe(true);
      expect(isValidCurrency('CAD')).toBe(true);
    });

    it('should return false for invalid currencies', () => {
      expect(isValidCurrency('XYZ')).toBe(false);
      expect(isValidCurrency('')).toBe(false);
      expect(isValidCurrency('eur')).toBe(false); // Case sensitive
    });
  });

  describe('convertAmount', () => {
    it('should convert USD to EUR', () => {
      // 100 USD = 100 * 0.85 = 85 EUR
      expect(convertAmount(100, 'USD', 'EUR', DEFAULT_FALLBACK_RATES)).toBeCloseTo(85, 2);
    });

    it('should convert EUR to USD', () => {
      // 85 EUR = 85 / 0.85 = 100 USD
      expect(convertAmount(85, 'EUR', 'USD', DEFAULT_FALLBACK_RATES)).toBeCloseTo(100, 2);
    });

    it('should convert between two non-EUR currencies', () => {
      // USD to GBP: 100 USD -> EUR -> GBP
      // 100 USD = 85 EUR, 85 EUR = 85/1.15 = 73.91 GBP
      expect(convertAmount(100, 'USD', 'GBP', DEFAULT_FALLBACK_RATES)).toBeCloseTo(73.91, 1);
    });

    it('should return same amount for same currency', () => {
      expect(convertAmount(100, 'USD', 'USD', DEFAULT_FALLBACK_RATES)).toBe(100);
    });
  });

  describe('recalculateFallbackRates', () => {
    it('should recalculate rates when default currency changes from EUR to USD', () => {
      const newRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'USD');
      
      // USD becomes base (1), EUR becomes 1/0.85 = 1.176
      expect(newRates['USD']).toBeCloseTo(1, 2);
      expect(newRates['EUR']).toBeCloseTo(1 / 0.85, 2);
      // GBP: was 1.15 EUR, now in USD terms: 1.15 / 0.85 = 1.353
      expect(newRates['GBP']).toBeCloseTo(1.15 / 0.85, 2);
    });

    it('should recalculate rates when default currency changes from USD to EUR', () => {
      // Starting from USD-based rates
      const usdBasedRates = {
        USD: 1,
        EUR: 1 / 0.85,  // ~1.176
        GBP: 1.15 / 0.85, // ~1.353
        CHF: 1.08 / 0.85,
        JPY: 0.0054 / 0.85,
        AUD: 0.57 / 0.85,
        CAD: 0.62 / 0.85,
      };
      
      const newRates = recalculateFallbackRates(usdBasedRates, 'USD', 'EUR');
      
      // EUR becomes base (1), USD becomes ~0.85
      expect(newRates['EUR']).toBeCloseTo(1, 2);
      expect(newRates['USD']).toBeCloseTo(0.85, 2);
      expect(newRates['GBP']).toBeCloseTo(1.15, 2);
    });

    it('should return same rates when currency does not change', () => {
      const newRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'EUR');
      expect(newRates).toEqual(DEFAULT_FALLBACK_RATES);
    });
  });

  describe('convertAssetsToNewCurrency', () => {
    const createMockAsset = (overrides: Partial<Asset> = {}): Asset => ({
      id: 'test-1',
      name: 'Test Asset',
      ticker: 'TEST',
      assetClass: 'STOCKS',
      subAssetType: 'ETF',
      currentValue: 1000,
      originalCurrency: 'EUR',
      originalValue: 1000,
      targetMode: 'PERCENTAGE',
      ...overrides,
    });

    it('should convert asset values from EUR to USD', () => {
      const assets: Asset[] = [
        createMockAsset({ currentValue: 1000, originalCurrency: 'EUR', originalValue: 1000 }),
      ];
      
      // EUR to USD: 1000 EUR = 1000 / 0.85 = 1176.47 USD
      const converted = convertAssetsToNewCurrency(assets, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      expect(converted[0].currentValue).toBeCloseTo(1176.47, 0);
      expect(converted[0].originalCurrency).toBe('EUR');
      expect(converted[0].originalValue).toBe(1000);
    });

    it('should convert asset values from USD to EUR', () => {
      const assets: Asset[] = [
        createMockAsset({ currentValue: 1000, originalCurrency: 'USD', originalValue: 850 }),
      ];
      
      // 1000 USD * 0.85 = 850 EUR
      const converted = convertAssetsToNewCurrency(assets, 'USD', 'EUR', DEFAULT_FALLBACK_RATES);
      
      expect(converted[0].currentValue).toBeCloseTo(850, 0);
    });

    it('should handle conversion between non-EUR currencies', () => {
      const assets: Asset[] = [
        createMockAsset({ currentValue: 1000, originalCurrency: 'USD', originalValue: 850 }),
      ];
      
      // USD to GBP: 1000 USD -> EUR -> GBP
      // 1000 * 0.85 = 850 EUR, 850 / 1.15 = 739.13 GBP
      const converted = convertAssetsToNewCurrency(assets, 'USD', 'GBP', DEFAULT_FALLBACK_RATES);
      
      expect(converted[0].currentValue).toBeCloseTo(739.13, 0);
    });

    it('should return same values when currency does not change', () => {
      const assets: Asset[] = [
        createMockAsset({ currentValue: 1000, originalCurrency: 'EUR', originalValue: 1000 }),
      ];
      
      const converted = convertAssetsToNewCurrency(assets, 'EUR', 'EUR', DEFAULT_FALLBACK_RATES);
      
      expect(converted[0].currentValue).toBe(1000);
    });

    it('should convert multiple assets', () => {
      const assets: Asset[] = [
        createMockAsset({ id: '1', currentValue: 1000, originalCurrency: 'EUR', originalValue: 1000 }),
        createMockAsset({ id: '2', currentValue: 2000, originalCurrency: 'EUR', originalValue: 2000 }),
        createMockAsset({ id: '3', currentValue: 500, originalCurrency: 'EUR', originalValue: 500 }),
      ];
      
      const converted = convertAssetsToNewCurrency(assets, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // All values should be converted from EUR to USD (divide by 0.85)
      expect(converted[0].currentValue).toBeCloseTo(1176.47, 0);
      expect(converted[1].currentValue).toBeCloseTo(2352.94, 0);
      expect(converted[2].currentValue).toBeCloseTo(588.24, 0);
    });

    it('should preserve other asset properties', () => {
      const assets: Asset[] = [
        createMockAsset({
          id: 'test-id',
          name: 'My Asset',
          ticker: 'TICK',
          assetClass: 'BONDS',
          subAssetType: 'SINGLE_BOND',
          currentValue: 1000,
          targetMode: 'SET',
          targetValue: 1500,
          targetPercent: 50,
        }),
      ];
      
      const converted = convertAssetsToNewCurrency(assets, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      expect(converted[0].id).toBe('test-id');
      expect(converted[0].name).toBe('My Asset');
      expect(converted[0].ticker).toBe('TICK');
      expect(converted[0].assetClass).toBe('BONDS');
      expect(converted[0].subAssetType).toBe('SINGLE_BOND');
      expect(converted[0].targetMode).toBe('SET');
      // targetValue should also be converted
      expect(converted[0].targetValue).toBeCloseTo(1764.71, 0);
      expect(converted[0].targetPercent).toBe(50); // Percentage should NOT be converted
    });

    it('should handle empty asset array', () => {
      const converted = convertAssetsToNewCurrency([], 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      expect(converted).toEqual([]);
    });

    it('should handle assets with undefined originalCurrency (assume it matches fromCurrency)', () => {
      const assets: Asset[] = [
        createMockAsset({ currentValue: 1000, originalCurrency: undefined, originalValue: undefined }),
      ];
      
      const converted = convertAssetsToNewCurrency(assets, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // Should convert 1000 EUR to USD
      expect(converted[0].currentValue).toBeCloseTo(1176.47, 0);
    });
  });

  describe('convertNetWorthDataToNewCurrency', () => {
    // Helper to create mock Net Worth data
    const createMockNetWorthData = (): NetWorthTrackerData => ({
      years: [
        {
          year: 2024,
          months: [
            {
              year: 2024,
              month: 1,
              assets: [
                {
                  id: 'asset1',
                  ticker: 'VWCE',
                  name: 'Vanguard FTSE All-World',
                  shares: 100,
                  pricePerShare: 100,
                  currency: 'EUR',
                  assetClass: 'ETF',
                },
              ],
              cashEntries: [
                {
                  id: 'cash1',
                  accountName: 'Savings',
                  accountType: 'SAVINGS',
                  balance: 5000,
                  currency: 'EUR',
                },
              ],
              pensions: [
                {
                  id: 'pension1',
                  name: 'State Pension',
                  currentValue: 20000,
                  currency: 'EUR',
                  pensionType: 'STATE',
                },
              ],
              operations: [
                {
                  id: 'op1',
                  date: '2024-01-15',
                  type: 'DIVIDEND',
                  description: 'Dividend payment',
                  amount: 50,
                  currency: 'EUR',
                },
              ],
              isFrozen: false,
            },
          ],
        },
      ],
      currentYear: 2024,
      currentMonth: 1,
      defaultCurrency: 'EUR',
      settings: {
        showPensionInNetWorth: true,
        includeUnrealizedGains: true,
      },
    });

    it('should return same data when currencies are identical', () => {
      const data = createMockNetWorthData();
      const converted = convertNetWorthDataToNewCurrency(data, 'EUR', 'EUR', DEFAULT_FALLBACK_RATES);
      
      expect(converted.years[0].months[0].assets[0].pricePerShare).toBe(100);
      expect(converted.years[0].months[0].cashEntries[0].balance).toBe(5000);
      expect(converted.years[0].months[0].pensions[0].currentValue).toBe(20000);
      expect(converted.years[0].months[0].operations[0].amount).toBe(50);
    });

    it('should convert all values from EUR to USD', () => {
      const data = createMockNetWorthData();
      const converted = convertNetWorthDataToNewCurrency(data, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // EUR to USD rate: 1 EUR = 1/0.85 USD ≈ 1.1765 USD
      const expectedRate = 1 / 0.85;
      
      expect(converted.defaultCurrency).toBe('USD');
      expect(converted.years[0].months[0].assets[0].pricePerShare).toBeCloseTo(100 * expectedRate, 0);
      expect(converted.years[0].months[0].assets[0].currency).toBe('USD');
      expect(converted.years[0].months[0].cashEntries[0].balance).toBeCloseTo(5000 * expectedRate, 0);
      expect(converted.years[0].months[0].cashEntries[0].currency).toBe('USD');
      expect(converted.years[0].months[0].pensions[0].currentValue).toBeCloseTo(20000 * expectedRate, 0);
      expect(converted.years[0].months[0].pensions[0].currency).toBe('USD');
      expect(converted.years[0].months[0].operations[0].amount).toBeCloseTo(50 * expectedRate, 0);
      expect(converted.years[0].months[0].operations[0].currency).toBe('USD');
    });

    it('should convert from USD back to EUR with acceptable rounding error', () => {
      const originalData = createMockNetWorthData();
      
      // First convert EUR to USD
      const toUSD = convertNetWorthDataToNewCurrency(originalData, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // Recalculate rates as would happen in settings page
      const usdRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'USD');
      
      // Then convert back to EUR
      const backToEUR = convertNetWorthDataToNewCurrency(toUSD, 'USD', 'EUR', usdRates);
      
      // Values should be approximately the same as original (within 1% rounding error)
      expect(backToEUR.defaultCurrency).toBe('EUR');
      expect(backToEUR.years[0].months[0].assets[0].pricePerShare).toBeCloseTo(100, 0);
      expect(backToEUR.years[0].months[0].cashEntries[0].balance).toBeCloseTo(5000, 0);
      expect(backToEUR.years[0].months[0].pensions[0].currentValue).toBeCloseTo(20000, 0);
      expect(backToEUR.years[0].months[0].operations[0].amount).toBeCloseTo(50, 0);
    });
  });

  describe('convertExpenseDataToNewCurrency', () => {
    // Helper to create mock Expense Tracker data
    const createMockExpenseData = (): ExpenseTrackerData => ({
      years: [
        {
          year: 2024,
          months: [
            {
              year: 2024,
              month: 1,
              incomes: [
                {
                  id: 'income1',
                  date: '2024-01-01',
                  amount: 5000,
                  description: 'Salary',
                  type: 'income',
                  source: 'SALARY',
                  currency: 'EUR',
                },
              ],
              expenses: [
                {
                  id: 'expense1',
                  date: '2024-01-15',
                  amount: 1500,
                  description: 'Rent',
                  type: 'expense',
                  category: 'HOUSING',
                  expenseType: 'NEED',
                  currency: 'EUR',
                },
              ],
              budgets: [
                {
                  category: 'HOUSING',
                  monthlyBudget: 2000,
                  currency: 'EUR',
                },
              ],
            },
          ],
        },
      ],
      currentYear: 2024,
      currentMonth: 1,
      currency: 'EUR',
      globalBudgets: [
        {
          category: 'GROCERIES',
          monthlyBudget: 500,
          currency: 'EUR',
        },
      ],
    });

    it('should return same data when currencies are identical', () => {
      const data = createMockExpenseData();
      const converted = convertExpenseDataToNewCurrency(data, 'EUR', 'EUR', DEFAULT_FALLBACK_RATES);
      
      expect(converted.years[0].months[0].incomes[0].amount).toBe(5000);
      expect(converted.years[0].months[0].expenses[0].amount).toBe(1500);
      expect(converted.years[0].months[0].budgets[0].monthlyBudget).toBe(2000);
      expect(converted.globalBudgets[0].monthlyBudget).toBe(500);
    });

    it('should convert all values from EUR to USD', () => {
      const data = createMockExpenseData();
      const converted = convertExpenseDataToNewCurrency(data, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // EUR to USD rate: 1 EUR = 1/0.85 USD ≈ 1.1765 USD
      const expectedRate = 1 / 0.85;
      
      expect(converted.currency).toBe('USD');
      expect(converted.years[0].months[0].incomes[0].amount).toBeCloseTo(5000 * expectedRate, 0);
      expect(converted.years[0].months[0].incomes[0].currency).toBe('USD');
      expect(converted.years[0].months[0].expenses[0].amount).toBeCloseTo(1500 * expectedRate, 0);
      expect(converted.years[0].months[0].expenses[0].currency).toBe('USD');
      expect(converted.years[0].months[0].budgets[0].monthlyBudget).toBeCloseTo(2000 * expectedRate, 0);
      expect(converted.globalBudgets[0].monthlyBudget).toBeCloseTo(500 * expectedRate, 0);
    });

    it('should convert from USD back to EUR with acceptable rounding error', () => {
      const originalData = createMockExpenseData();
      
      // First convert EUR to USD
      const toUSD = convertExpenseDataToNewCurrency(originalData, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // Recalculate rates as would happen in settings page
      const usdRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'USD');
      
      // Then convert back to EUR
      const backToEUR = convertExpenseDataToNewCurrency(toUSD, 'USD', 'EUR', usdRates);
      
      // Values should be approximately the same as original (within 1% rounding error)
      expect(backToEUR.currency).toBe('EUR');
      expect(backToEUR.years[0].months[0].incomes[0].amount).toBeCloseTo(5000, 0);
      expect(backToEUR.years[0].months[0].expenses[0].amount).toBeCloseTo(1500, 0);
      expect(backToEUR.years[0].months[0].budgets[0].monthlyBudget).toBeCloseTo(2000, 0);
      expect(backToEUR.globalBudgets[0].monthlyBudget).toBeCloseTo(500, 0);
    });
  });

  describe('Full conversion workflow: EUR → USD → EUR roundtrip', () => {
    it('should maintain data integrity through currency conversions', () => {
      // This test simulates: Load demo data (EUR) → Change to USD → Change back to EUR
      const originalEUR = 10000;
      
      // Step 1: Convert EUR to USD
      const toUSD = convertAmount(originalEUR, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // Step 2: Recalculate rates for USD as base
      const usdRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'USD');
      
      // Step 3: Convert USD back to EUR using new rates
      const backToEUR = convertAmount(toUSD, 'USD', 'EUR', usdRates);
      
      // Should be approximately the same (within 0.01% due to floating point)
      expect(backToEUR).toBeCloseTo(originalEUR, 1);
    });

    it('should handle multiple currency changes accurately', () => {
      // EUR → USD → GBP → EUR
      const originalEUR = 10000;
      
      // EUR to USD
      const toUSD = convertAmount(originalEUR, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      const usdRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'USD');
      
      // USD to GBP
      const toGBP = convertAmount(toUSD, 'USD', 'GBP', usdRates);
      const gbpRates = recalculateFallbackRates(usdRates, 'USD', 'GBP');
      
      // GBP back to EUR
      const backToEUR = convertAmount(toGBP, 'GBP', 'EUR', gbpRates);
      
      // Should be approximately the same
      expect(backToEUR).toBeCloseTo(originalEUR, 0);
    });
  });

  describe('convertFireCalculatorInputsToNewCurrency', () => {
    const createMockFireInputs = (): Parameters<typeof convertFireCalculatorInputsToNewCurrency>[0] => ({
      initialSavings: 50000,
      currentAnnualExpenses: 40000,
      fireAnnualExpenses: 40000,
      annualLaborIncome: 60000,
      statePensionIncome: 12000,
      privatePensionIncome: 6000,
      otherIncome: 2000,
      // Non-monetary fields
      stocksPercent: 70,
      bondsPercent: 20,
      cashPercent: 10,
      savingsRate: 33.33,
      desiredWithdrawalRate: 3,
      yearsOfExpenses: 33.33,
      laborIncomeGrowthRate: 2,
      expectedStockReturn: 7,
      expectedBondReturn: 3,
      expectedCashReturn: -2,
      yearOfBirth: 1990,
      retirementAge: 67,
      stopWorkingAtFIRE: true,
      maxAge: 100,
      useAssetAllocationValue: false,
      useExpenseTrackerExpenses: false,
      useExpenseTrackerIncome: false,
    });

    it('should return same inputs when currencies are identical', () => {
      const inputs = createMockFireInputs();
      const converted = convertFireCalculatorInputsToNewCurrency(inputs, 'EUR', 'EUR', DEFAULT_FALLBACK_RATES);
      
      expect(converted.initialSavings).toBe(50000);
      expect(converted.currentAnnualExpenses).toBe(40000);
      expect(converted.annualLaborIncome).toBe(60000);
    });

    it('should convert all monetary values from EUR to USD', () => {
      const inputs = createMockFireInputs();
      const converted = convertFireCalculatorInputsToNewCurrency(inputs, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // EUR to USD rate: 1 EUR = 1/0.85 USD = 1.176 USD
      const rate = 1 / DEFAULT_FALLBACK_RATES.USD;
      
      expect(converted.initialSavings).toBeCloseTo(50000 * rate, 0);
      expect(converted.currentAnnualExpenses).toBeCloseTo(40000 * rate, 0);
      expect(converted.fireAnnualExpenses).toBeCloseTo(40000 * rate, 0);
      expect(converted.annualLaborIncome).toBeCloseTo(60000 * rate, 0);
      expect(converted.statePensionIncome).toBeCloseTo(12000 * rate, 0);
      expect(converted.privatePensionIncome).toBeCloseTo(6000 * rate, 0);
      expect(converted.otherIncome).toBeCloseTo(2000 * rate, 0);
    });

    it('should convert all monetary values from EUR to JPY', () => {
      const inputs = createMockFireInputs();
      const converted = convertFireCalculatorInputsToNewCurrency(inputs, 'EUR', 'JPY', DEFAULT_FALLBACK_RATES);
      
      // EUR to JPY rate: 1 EUR = 1/0.0054 JPY = 185.18 JPY
      const rate = 1 / DEFAULT_FALLBACK_RATES.JPY;
      
      expect(converted.initialSavings).toBeCloseTo(50000 * rate, 0);
      expect(converted.currentAnnualExpenses).toBeCloseTo(40000 * rate, 0);
      expect(converted.fireAnnualExpenses).toBeCloseTo(40000 * rate, 0);
      expect(converted.annualLaborIncome).toBeCloseTo(60000 * rate, 0);
    });

    it('should not modify non-monetary fields', () => {
      const inputs = createMockFireInputs();
      const converted = convertFireCalculatorInputsToNewCurrency(inputs, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      expect(converted.stocksPercent).toBe(70);
      expect(converted.bondsPercent).toBe(20);
      expect(converted.cashPercent).toBe(10);
      expect(converted.savingsRate).toBe(33.33);
      expect(converted.desiredWithdrawalRate).toBe(3);
      expect(converted.yearsOfExpenses).toBe(33.33);
    });

    it('should convert from USD back to EUR with acceptable rounding error', () => {
      const originalInputs = createMockFireInputs();
      
      // First convert EUR to USD
      const toUSD = convertFireCalculatorInputsToNewCurrency(originalInputs, 'EUR', 'USD', DEFAULT_FALLBACK_RATES);
      
      // Recalculate rates as would happen in settings page
      const usdRates = recalculateFallbackRates(DEFAULT_FALLBACK_RATES, 'EUR', 'USD');
      
      // Then convert back to EUR
      const backToEUR = convertFireCalculatorInputsToNewCurrency(toUSD, 'USD', 'EUR', usdRates);
      
      // Values should be approximately the same as original (within 1% rounding error)
      expect(backToEUR.initialSavings).toBeCloseTo(50000, 0);
      expect(backToEUR.currentAnnualExpenses).toBeCloseTo(40000, 0);
      expect(backToEUR.fireAnnualExpenses).toBeCloseTo(40000, 0);
      expect(backToEUR.annualLaborIncome).toBeCloseTo(60000, 0);
      expect(backToEUR.statePensionIncome).toBeCloseTo(12000, 0);
      expect(backToEUR.privatePensionIncome).toBeCloseTo(6000, 0);
      expect(backToEUR.otherIncome).toBeCloseTo(2000, 0);
    });
  });

  describe('convertMonthlyVariationsToDisplayCurrency', () => {
    const createMockVariations = (): MonthlyVariation[] => [
      {
        month: 'Jan 2024',
        netWorth: 100000,
        changeFromPrevMonth: 0,
        changePercent: 0,
        assetValueChange: 0,
        cashChange: 0,
        pensionChange: 0,
      },
      {
        month: 'Feb 2024',
        netWorth: 105000,
        changeFromPrevMonth: 5000,
        changePercent: 5,
        assetValueChange: 3000,
        cashChange: 1500,
        pensionChange: 500,
      },
    ];

    it('should return same values when converting to the same currency', () => {
      const variations = createMockVariations();
      const converted = convertMonthlyVariationsToDisplayCurrency(
        variations,
        'EUR',
        'EUR',
        DEFAULT_FALLBACK_RATES
      );
      
      expect(converted[0].netWorth).toBe(100000);
      expect(converted[1].netWorth).toBe(105000);
      expect(converted[1].changeFromPrevMonth).toBe(5000);
    });

    it('should convert net worth values from EUR to USD', () => {
      const variations = createMockVariations();
      // EUR to USD rate: 1 EUR = 1/0.85 USD ≈ 1.1765 USD
      const converted = convertMonthlyVariationsToDisplayCurrency(
        variations,
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      const expectedRate = 1 / 0.85;
      expect(converted[0].netWorth).toBeCloseTo(100000 * expectedRate, 0);
      expect(converted[1].netWorth).toBeCloseTo(105000 * expectedRate, 0);
      expect(converted[1].changeFromPrevMonth).toBeCloseTo(5000 * expectedRate, 0);
    });

    it('should preserve percentage values without conversion', () => {
      const variations = createMockVariations();
      const converted = convertMonthlyVariationsToDisplayCurrency(
        variations,
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      // Percentage values should not be converted
      expect(converted[1].changePercent).toBe(5);
    });

    it('should convert all monetary fields', () => {
      const variations = createMockVariations();
      const converted = convertMonthlyVariationsToDisplayCurrency(
        variations,
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      const expectedRate = 1 / 0.85;
      expect(converted[1].assetValueChange).toBeCloseTo(3000 * expectedRate, 0);
      expect(converted[1].cashChange).toBeCloseTo(1500 * expectedRate, 0);
      expect(converted[1].pensionChange).toBeCloseTo(500 * expectedRate, 0);
    });

    it('should handle empty variations array', () => {
      const converted = convertMonthlyVariationsToDisplayCurrency(
        [],
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      expect(converted).toEqual([]);
    });

    it('should preserve month labels', () => {
      const variations = createMockVariations();
      const converted = convertMonthlyVariationsToDisplayCurrency(
        variations,
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      expect(converted[0].month).toBe('Jan 2024');
      expect(converted[1].month).toBe('Feb 2024');
    });
  });

  describe('convertNetWorthForecastToDisplayCurrency', () => {
    const createMockForecast = (): NetWorthForecast[] => [
      {
        month: 'Mar 2024',
        projectedNetWorth: 110000,
        confidenceLevel: 'MEDIUM',
        basedOnMonths: 6,
      },
      {
        month: 'Apr 2024',
        projectedNetWorth: 115000,
        confidenceLevel: 'MEDIUM',
        basedOnMonths: 6,
      },
    ];

    it('should return same values when converting to the same currency', () => {
      const forecast = createMockForecast();
      const converted = convertNetWorthForecastToDisplayCurrency(
        forecast,
        'EUR',
        'EUR',
        DEFAULT_FALLBACK_RATES
      );
      
      expect(converted[0].projectedNetWorth).toBe(110000);
      expect(converted[1].projectedNetWorth).toBe(115000);
    });

    it('should convert projected net worth values from EUR to USD', () => {
      const forecast = createMockForecast();
      // EUR to USD rate: 1 EUR = 1/0.85 USD ≈ 1.1765 USD
      const converted = convertNetWorthForecastToDisplayCurrency(
        forecast,
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      const expectedRate = 1 / 0.85;
      expect(converted[0].projectedNetWorth).toBeCloseTo(110000 * expectedRate, 0);
      expect(converted[1].projectedNetWorth).toBeCloseTo(115000 * expectedRate, 0);
    });

    it('should preserve non-monetary fields', () => {
      const forecast = createMockForecast();
      const converted = convertNetWorthForecastToDisplayCurrency(
        forecast,
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      expect(converted[0].month).toBe('Mar 2024');
      expect(converted[0].confidenceLevel).toBe('MEDIUM');
      expect(converted[0].basedOnMonths).toBe(6);
    });

    it('should handle empty forecast array', () => {
      const converted = convertNetWorthForecastToDisplayCurrency(
        [],
        'EUR',
        'USD',
        DEFAULT_FALLBACK_RATES
      );
      
      expect(converted).toEqual([]);
    });
  });
});
