import { describe, expect, it } from 'vitest';
import {
  exportAllDataAsJSON,
  importAllDataFromJSON,
  AllDataExport,
} from '../../src/utils/dataExportImport';
import { CalculatorInputs } from '../../src/types/calculator';
import { Asset, AssetClass, AllocationMode } from '../../src/types/assetAllocation';
import { ExpenseTrackerData } from '../../src/types/expenseTracker';
import { NetWorthTrackerData } from '../../src/types/netWorthTracker';
import { DEFAULT_INPUTS } from '../../src/utils/defaults';
import { DEFAULT_FALLBACK_RATES } from '../../src/types/currency';

describe('Data Export/Import All', () => {
  // Test data
  const testFireInputs: CalculatorInputs = {
    ...DEFAULT_INPUTS,
    initialSavings: 50000,
    currentAnnualExpenses: 40000,
    annualLaborIncome: 60000,
  };

  const testAssets: Asset[] = [
    {
      id: 'asset-1',
      name: 'Test Stock ETF',
      ticker: 'VTI',
      isin: 'US9229083632',
      assetClass: 'STOCKS' as AssetClass,
      subAssetType: 'ETF',
      currentValue: 35000,
      targetMode: 'PERCENTAGE' as AllocationMode,
      targetPercent: 50,
      originalCurrency: 'EUR',
    },
    {
      id: 'asset-2',
      name: 'Test Bond ETF',
      ticker: 'BND',
      isin: 'US9219378356',
      assetClass: 'BONDS' as AssetClass,
      subAssetType: 'ETF',
      currentValue: 15000,
      targetMode: 'PERCENTAGE' as AllocationMode,
      targetPercent: 50,
      originalCurrency: 'EUR',
    },
  ];

  const testAssetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> = {
    STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 70 },
    BONDS: { targetMode: 'PERCENTAGE', targetPercent: 30 },
    CASH: { targetMode: 'SET' },
    CRYPTO: { targetMode: 'OFF' },
    REAL_ESTATE: { targetMode: 'OFF' },
  };

  const testExpenseData: ExpenseTrackerData = {
    years: [
      {
        year: 2024,
        months: [
          {
            year: 2024,
            month: 1,
            incomes: [
              {
                id: 'inc-1',
                type: 'income',
                date: '2024-01-15',
                amount: 5000,
                description: 'Salary',
                source: 'SALARY',
                currency: 'EUR',
              },
            ],
            expenses: [
              {
                id: 'exp-1',
                type: 'expense',
                date: '2024-01-01',
                amount: 1200,
                description: 'Rent',
                category: 'HOUSING',
                expenseType: 'NEED',
                currency: 'EUR',
              },
            ],
            budgets: [],
          },
        ],
        isArchived: false,
      },
    ],
    currentYear: 2024,
    currentMonth: 1,
    currency: 'EUR',
    globalBudgets: [],
  };

  const testNetWorthData: NetWorthTrackerData = {
    years: [
      {
        year: 2024,
        months: [
          {
            year: 2024,
            month: 1,
            assets: [
              {
                id: 'nw-asset-1',
                ticker: 'VTI',
                name: 'Total Stock Market',
                shares: 100,
                pricePerShare: 350,
                currency: 'EUR',
                assetClass: 'STOCKS',
              },
            ],
            cashEntries: [
              {
                id: 'cash-1',
                accountName: 'Savings',
                accountType: 'SAVINGS',
                balance: 5000,
                currency: 'EUR',
              },
            ],
            pensions: [],
            operations: [],
            isFrozen: false,
          },
        ],
        isArchived: false,
      },
    ],
    currentYear: 2024,
    currentMonth: 1,
    defaultCurrency: 'EUR',
    settings: {
      showPensionInNetWorth: true,
      includeUnrealizedGains: true,
    },
  };

  describe('exportAllDataAsJSON', () => {
    it('should export all data with correct structure', () => {
      const result = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );

      expect(result.exportVersion).toBe('1.0');
      expect(result.exportType).toBe('FireToolsAllData');
      expect(result.exportDate).toBeDefined();
      expect(result.originalCurrency).toBe('EUR');
    });

    it('should include fire calculator data', () => {
      const result = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );

      expect(result.fireCalculator).toEqual(testFireInputs);
    });

    it('should include asset allocation data', () => {
      const result = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );

      expect(result.assetAllocation.assets).toEqual(testAssets);
      expect(result.assetAllocation.assetClassTargets).toEqual(testAssetClassTargets);
    });

    it('should include expense tracker data', () => {
      const result = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );

      expect(result.expenseTracker).toEqual(testExpenseData);
    });

    it('should include net worth tracker data', () => {
      const result = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );

      expect(result.netWorthTracker).toEqual(testNetWorthData);
    });

    it('should handle null/undefined data gracefully', () => {
      const result = exportAllDataAsJSON(
        null as unknown as CalculatorInputs,
        null as unknown as Asset[],
        null as unknown as Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>,
        null as unknown as ExpenseTrackerData,
        null as unknown as NetWorthTrackerData
      );

      expect(result.exportVersion).toBe('1.0');
      expect(result.fireCalculator).toBeNull();
      expect(result.assetAllocation.assets).toBeNull();
    });
  });

  describe('importAllDataFromJSON', () => {
    it('should import all data from JSON string', () => {
      const exportData = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );
      const jsonString = JSON.stringify(exportData);

      const result = importAllDataFromJSON(jsonString, 'EUR', DEFAULT_FALLBACK_RATES);

      expect(result.fireCalculator).toEqual(testFireInputs);
      expect(result.assetAllocation.assets).toEqual(testAssets);
      expect(result.expenseTracker).toEqual(testExpenseData);
      expect(result.netWorthTracker).toEqual(testNetWorthData);
    });

    it('should convert data to target currency', () => {
      const exportData = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );
      const jsonString = JSON.stringify(exportData);

      // Import with USD as target currency
      const result = importAllDataFromJSON(jsonString, 'USD', DEFAULT_FALLBACK_RATES);

      // Values should be converted from EUR to USD
      // EUR to USD rate in DEFAULT_FALLBACK_RATES is ~0.91 (1 USD = 0.91 EUR)
      // So EUR values / 0.91 = USD values
      const expectedInitialSavings = testFireInputs.initialSavings / DEFAULT_FALLBACK_RATES.USD;
      expect(result.fireCalculator?.initialSavings).toBeCloseTo(expectedInitialSavings, 2);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => importAllDataFromJSON('invalid json', 'EUR', DEFAULT_FALLBACK_RATES)).toThrow();
    });

    it('should throw error for invalid export format', () => {
      const invalidData = { foo: 'bar' };
      expect(() => importAllDataFromJSON(JSON.stringify(invalidData), 'EUR', DEFAULT_FALLBACK_RATES)).toThrow('Invalid export format');
    });

    it('should handle missing optional data', () => {
      const partialExport: AllDataExport = {
        exportVersion: '1.0',
        exportType: 'FireToolsAllData',
        exportDate: new Date().toISOString(),
        originalCurrency: 'EUR',
        fireCalculator: testFireInputs,
        assetAllocation: {
          assets: null,
          assetClassTargets: null,
        },
        expenseTracker: null,
        netWorthTracker: null,
      };
      const jsonString = JSON.stringify(partialExport);

      const result = importAllDataFromJSON(jsonString, 'EUR', DEFAULT_FALLBACK_RATES);

      expect(result.fireCalculator).toEqual(testFireInputs);
      expect(result.assetAllocation.assets).toBeNull();
      expect(result.expenseTracker).toBeNull();
      expect(result.netWorthTracker).toBeNull();
    });
  });

  describe('round-trip export/import', () => {
    it('should preserve all data through export and import', () => {
      const exportData = exportAllDataAsJSON(
        testFireInputs,
        testAssets,
        testAssetClassTargets,
        testExpenseData,
        testNetWorthData
      );
      const jsonString = JSON.stringify(exportData);
      const imported = importAllDataFromJSON(jsonString, 'EUR', DEFAULT_FALLBACK_RATES);

      expect(imported.fireCalculator).toEqual(testFireInputs);
      expect(imported.assetAllocation.assets).toEqual(testAssets);
      expect(imported.assetAllocation.assetClassTargets).toEqual(testAssetClassTargets);
      expect(imported.expenseTracker).toEqual(testExpenseData);
      expect(imported.netWorthTracker).toEqual(testNetWorthData);
    });
  });
});
