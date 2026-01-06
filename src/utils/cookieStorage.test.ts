import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  saveAssetAllocation,
  loadAssetAllocation,
  clearAssetAllocation,
  saveFireCalculatorInputs,
  loadFireCalculatorInputs,
  clearFireCalculatorInputs,
  saveExpenseTrackerData,
  loadExpenseTrackerData,
  clearExpenseTrackerData,
  clearAllData,
  isCookieStorageAvailable,
} from './cookieStorage';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { CalculatorInputs } from '../types/calculator';
import { ExpenseTrackerData, ExpenseCategory, IncomeSource } from '../types/expenseTracker';
import { DEFAULT_INPUTS } from './defaults';

// Mock document.cookie
const cookieMock = (() => {
  let cookies: Record<string, string> = {};

  return {
    get: () => {
      return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    },
    set: (value: string) => {
      // Parse cookie string like "key=value; path=/; max-age=..."
      const [cookiePair] = value.split(';');
      const [key, val] = cookiePair.split('=');
      if (key && val !== undefined) {
        if (val === '' || value.includes('max-age=0') || value.includes('expires=Thu, 01 Jan 1970')) {
          // Cookie deletion
          delete cookies[key.trim()];
        } else {
          cookies[key.trim()] = val.trim();
        }
      }
    },
    clear: () => {
      cookies = {};
    },
    delete: (key: string) => {
      delete cookies[key];
    },
  };
})();

// Mock document.cookie getter/setter
Object.defineProperty(document, 'cookie', {
  get: () => cookieMock.get(),
  set: (value: string) => cookieMock.set(value),
  configurable: true,
});

describe('Cookie Storage utilities', () => {
  beforeEach(() => {
    cookieMock.clear();
    // Also explicitly clear via the library to ensure clean state
    clearAssetAllocation();
    clearFireCalculatorInputs();
    clearExpenseTrackerData();
  });

  describe('Asset Allocation', () => {
    const mockAssets: Asset[] = [
      {
        id: 'asset-1',
        name: 'Test Asset',
        ticker: 'TEST',
        isin: 'US1234567890',
        assetClass: 'STOCKS',
        subAssetType: 'ETF',
        currentValue: 10000,
        targetMode: 'PERCENTAGE',
        targetPercent: 50,
      },
      {
        id: 'asset-2',
        name: 'Test Bond',
        ticker: 'BOND',
        assetClass: 'BONDS',
        subAssetType: 'ETF',
        currentValue: 5000,
        targetMode: 'PERCENTAGE',
        targetPercent: 50,
      },
    ];

    const mockTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> = {
      STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 60 },
      BONDS: { targetMode: 'PERCENTAGE', targetPercent: 40 },
      CASH: { targetMode: 'SET' },
      CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
      REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
    };

    it('should save and load asset allocation', () => {
      saveAssetAllocation(mockAssets, mockTargets);
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toEqual(mockAssets);
      expect(loaded.assetClassTargets).toEqual(mockTargets);
    });

    it('should return null when no data is saved', () => {
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toBeNull();
      expect(loaded.assetClassTargets).toBeNull();
    });

    it('should clear asset allocation data', () => {
      saveAssetAllocation(mockAssets, mockTargets);
      clearAssetAllocation();
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toBeNull();
      expect(loaded.assetClassTargets).toBeNull();
    });

    it('should handle corrupted data gracefully', () => {
      // Manually set invalid cookie data
      document.cookie = 'fire-calculator-asset-allocation=invalid-encrypted-data';
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toBeNull();
      expect(loaded.assetClassTargets).toBeNull();
    });

    it('should validate asset structure', () => {
      // Save invalid data directly by manipulating cookie
      const invalidData = JSON.stringify([{ invalid: 'data' }]);
      document.cookie = `fire-calculator-asset-allocation=${invalidData}`;
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toBeNull();
    });

    it('should encrypt data in cookies', () => {
      saveAssetAllocation(mockAssets, mockTargets);
      const cookieValue = document.cookie;
      
      // Cookie should not contain plaintext sensitive data
      expect(cookieValue).not.toContain('Test Asset');
      expect(cookieValue).not.toContain('10000');
    });
  });

  describe('FIRE Calculator Inputs', () => {
    const mockInputs: CalculatorInputs = {
      ...DEFAULT_INPUTS,
      initialSavings: 100000,
      stocksPercent: 80,
      yearOfBirth: 1985,
    };

    it('should save and load calculator inputs', () => {
      saveFireCalculatorInputs(mockInputs);
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toEqual(mockInputs);
    });

    it('should return null when no data is saved', () => {
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toBeNull();
    });

    it('should clear calculator inputs', () => {
      saveFireCalculatorInputs(mockInputs);
      clearFireCalculatorInputs();
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toBeNull();
    });

    it('should handle corrupted data gracefully', () => {
      document.cookie = 'fire-calculator-inputs=invalid-encrypted-data';
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toBeNull();
    });

    it('should validate inputs structure', () => {
      const invalidData = JSON.stringify({ invalid: 'data' });
      document.cookie = `fire-calculator-inputs=${invalidData}`;
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toBeNull();
    });

    it('should merge with defaults to ensure all fields exist', () => {
      const partialInputs = {
        ...DEFAULT_INPUTS,
        initialSavings: 50000,
        stocksPercent: 60,
      };
      
      saveFireCalculatorInputs(partialInputs);
      const loaded = loadFireCalculatorInputs();

      expect(loaded?.initialSavings).toBe(50000);
      expect(loaded?.stocksPercent).toBe(60);
      expect(loaded?.retirementAge).toBe(DEFAULT_INPUTS.retirementAge);
    });

    it('should encrypt data in cookies', () => {
      saveFireCalculatorInputs(mockInputs);
      const cookieValue = document.cookie;
      
      // Cookie should not contain plaintext sensitive data
      expect(cookieValue).not.toContain('100000');
      expect(cookieValue).not.toContain('1985');
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from cookies', () => {
      const mockAssets: Asset[] = [{
        id: 'asset-1',
        name: 'Test',
        ticker: 'TEST',
        assetClass: 'STOCKS',
        subAssetType: 'ETF',
        currentValue: 1000,
        targetMode: 'PERCENTAGE',
        targetPercent: 100,
      }];
      
      const mockTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> = {
        STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 100 },
        BONDS: { targetMode: 'SET' },
        CASH: { targetMode: 'SET' },
        CRYPTO: { targetMode: 'SET' },
        REAL_ESTATE: { targetMode: 'SET' },
      };
      
      const mockInputs: CalculatorInputs = DEFAULT_INPUTS;
      
      saveAssetAllocation(mockAssets, mockTargets);
      saveFireCalculatorInputs(mockInputs);
      
      clearAllData();
      
      const assetsLoaded = loadAssetAllocation();
      const inputsLoaded = loadFireCalculatorInputs();
      
      expect(assetsLoaded.assets).toBeNull();
      expect(assetsLoaded.assetClassTargets).toBeNull();
      expect(inputsLoaded).toBeNull();
    });
  });

  describe('isCookieStorageAvailable', () => {
    it('should return true when cookies are available', () => {
      expect(isCookieStorageAvailable()).toBe(true);
    });

    it('should return false when cookies are not available', () => {
      // Mock document.cookie to throw error
      const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      Object.defineProperty(document, 'cookie', {
        get: () => {
          throw new Error('Cookies disabled');
        },
        set: () => {
          throw new Error('Cookies disabled');
        },
        configurable: true,
      });

      expect(isCookieStorageAvailable()).toBe(false);

      // Restore original
      if (originalDescriptor) {
        Object.defineProperty(document, 'cookie', originalDescriptor);
      }
    });
  });

  describe('Expense Tracker Data', () => {
    const mockExpenseTrackerData: ExpenseTrackerData = {
      years: [
        {
          year: 2026,
          months: [
            {
              year: 2026,
              month: 1,
              incomes: [
                {
                  id: 'income-1',
                  type: 'income',
                  date: '2026-01-15',
                  amount: 5000,
                  description: 'Salary',
                  source: 'EMPLOYMENT' as IncomeSource,
                },
              ],
              expenses: [
                {
                  id: 'expense-1',
                  type: 'expense',
                  date: '2026-01-10',
                  amount: 100,
                  description: 'Test expense',
                  category: 'OTHER' as ExpenseCategory,
                  expenseType: 'WANT',
                },
              ],
              budgets: [],
            },
          ],
          isArchived: false,
        },
      ],
      currentYear: 2026,
      currentMonth: 1,
      currency: 'EUR',
      globalBudgets: [],
    };

    it('should save and load expense tracker data', () => {
      saveExpenseTrackerData(mockExpenseTrackerData);
      const loaded = loadExpenseTrackerData();

      expect(loaded).toEqual(mockExpenseTrackerData);
      expect(loaded?.years[0].months[0].incomes[0].amount).toBe(5000);
      expect(loaded?.years[0].months[0].expenses[0].amount).toBe(100);
    });

    it('should persist expense tracker data across multiple save/load cycles', () => {
      // First save and load
      saveExpenseTrackerData(mockExpenseTrackerData);
      const loaded1 = loadExpenseTrackerData();
      expect(loaded1).toEqual(mockExpenseTrackerData);

      // Modify and save again
      const modifiedData = {
        ...mockExpenseTrackerData,
        years: [
          {
            ...mockExpenseTrackerData.years[0],
            months: [
              {
                ...mockExpenseTrackerData.years[0].months[0],
                expenses: [
                  ...mockExpenseTrackerData.years[0].months[0].expenses,
                  {
                    id: 'expense-2',
                    type: 'expense' as const,
                    date: '2026-01-20',
                    amount: 200,
                    description: 'Another expense',
                    category: 'GROCERIES' as ExpenseCategory,
                    expenseType: 'NEED' as const,
                  },
                ],
              },
            ],
          },
        ],
      };

      saveExpenseTrackerData(modifiedData);
      const loaded2 = loadExpenseTrackerData();

      expect(loaded2).toEqual(modifiedData);
      expect(loaded2?.years[0].months[0].expenses).toHaveLength(2);
      expect(loaded2?.years[0].months[0].expenses[1].amount).toBe(200);
    });

    it('should return null when no expense tracker data is saved', () => {
      const loaded = loadExpenseTrackerData();
      expect(loaded).toBeNull();
    });

    it('should clear expense tracker data', () => {
      saveExpenseTrackerData(mockExpenseTrackerData);
      clearExpenseTrackerData();
      const loaded = loadExpenseTrackerData();

      expect(loaded).toBeNull();
    });

    it('should handle corrupted expense tracker data gracefully', () => {
      // Suppress console.log for migration message during this test
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      document.cookie = 'fire-tools-expense-tracker=invalid-encrypted-data';
      const loaded = loadExpenseTrackerData();

      expect(loaded).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should encrypt expense tracker data in cookies', () => {
      saveExpenseTrackerData(mockExpenseTrackerData);
      const cookieValue = document.cookie;
      
      // Cookie should not contain plaintext sensitive data
      expect(cookieValue).not.toContain('Salary');
      expect(cookieValue).not.toContain('5000');
      expect(cookieValue).not.toContain('Test expense');
    });

    it('should simulate page refresh - data persists after save and reload', () => {
      // Simulate user adding data
      const initialData: ExpenseTrackerData = {
        years: [
          {
            year: 2026,
            months: [
              {
                year: 2026,
                month: 1,
                incomes: [],
                expenses: [
                  {
                    id: 'expense-new',
                    type: 'expense',
                    date: '2026-01-15',
                    amount: 250,
                    description: 'New expense after refresh test',
                    category: 'GROCERIES' as ExpenseCategory,
                    expenseType: 'NEED',
                  },
                ],
                budgets: [],
              },
            ],
            isArchived: false,
          },
        ],
        currentYear: 2026,
        currentMonth: 1,
        currency: 'EUR',
        globalBudgets: [],
      };

      // Save the data (simulates auto-save on data change)
      saveExpenseTrackerData(initialData);

      // Simulate page refresh by loading data again
      const loadedAfterRefresh = loadExpenseTrackerData();

      // Data should be exactly the same
      expect(loadedAfterRefresh).not.toBeNull();
      expect(loadedAfterRefresh?.years[0].months[0].expenses).toHaveLength(1);
      expect(loadedAfterRefresh?.years[0].months[0].expenses[0].amount).toBe(250);
      expect(loadedAfterRefresh?.years[0].months[0].expenses[0].description).toBe('New expense after refresh test');
    });

    it('should preserve data when adding new month to existing year', () => {
      // Start with data for January
      const dataWithJanuary: ExpenseTrackerData = {
        years: [
          {
            year: 2026,
            months: [
              {
                year: 2026,
                month: 1,
                incomes: [{
                  id: 'income-jan',
                  type: 'income',
                  date: '2026-01-15',
                  amount: 3000,
                  description: 'January salary',
                  source: 'EMPLOYMENT' as IncomeSource,
                }],
                expenses: [{
                  id: 'expense-jan',
                  type: 'expense',
                  date: '2026-01-10',
                  amount: 500,
                  description: 'January rent',
                  category: 'HOUSING' as ExpenseCategory,
                  expenseType: 'NEED',
                }],
                budgets: [],
              },
            ],
            isArchived: false,
          },
        ],
        currentYear: 2026,
        currentMonth: 1,
        currency: 'EUR',
        globalBudgets: [],
      };

      // Save January data
      saveExpenseTrackerData(dataWithJanuary);

      // Load it back
      const loaded = loadExpenseTrackerData();
      expect(loaded).not.toBeNull();
      expect(loaded?.years[0].months).toHaveLength(1);
      expect(loaded?.years[0].months[0].incomes[0].amount).toBe(3000);

      // Now add February data (simulating user navigating to February and adding data)
      const dataWithFebruary: ExpenseTrackerData = {
        ...dataWithJanuary,
        years: [
          {
            ...dataWithJanuary.years[0],
            months: [
              ...dataWithJanuary.years[0].months,
              {
                year: 2026,
                month: 2,
                incomes: [{
                  id: 'income-feb',
                  type: 'income',
                  date: '2026-02-15',
                  amount: 3000,
                  description: 'February salary',
                  source: 'EMPLOYMENT' as IncomeSource,
                }],
                expenses: [],
                budgets: [],
              },
            ],
          },
        ],
      };

      // Save February data
      saveExpenseTrackerData(dataWithFebruary);

      // Load it back - both January and February should be there
      const loadedWithBoth = loadExpenseTrackerData();
      expect(loadedWithBoth).not.toBeNull();
      expect(loadedWithBoth?.years[0].months).toHaveLength(2);
      expect(loadedWithBoth?.years[0].months[0].month).toBe(1);
      expect(loadedWithBoth?.years[0].months[0].incomes[0].amount).toBe(3000); // January income still there
      expect(loadedWithBoth?.years[0].months[0].expenses[0].amount).toBe(500); // January expense still there
      expect(loadedWithBoth?.years[0].months[1].month).toBe(2);
      expect(loadedWithBoth?.years[0].months[1].incomes[0].amount).toBe(3000); // February income there
    });
  });
});
