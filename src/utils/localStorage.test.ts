import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  saveAssetAllocation,
  loadAssetAllocation,
  clearAssetAllocation,
  saveFireCalculatorInputs,
  loadFireCalculatorInputs,
  clearFireCalculatorInputs,
  isLocalStorageAvailable,
} from './localStorage';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { CalculatorInputs } from '../types/calculator';
import { DEFAULT_INPUTS } from './defaults';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
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
      localStorage.setItem('fire-calculator-asset-allocation', 'invalid json');
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toBeNull();
      expect(loaded.assetClassTargets).toBeNull();
    });

    it('should validate asset structure', () => {
      // Save invalid data directly
      localStorage.setItem('fire-calculator-asset-allocation', JSON.stringify([{ invalid: 'data' }]));
      const loaded = loadAssetAllocation();

      expect(loaded.assets).toBeNull();
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
      localStorage.setItem('fire-calculator-inputs', 'invalid json');
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toBeNull();
    });

    it('should validate inputs structure', () => {
      // Save invalid data directly
      localStorage.setItem('fire-calculator-inputs', JSON.stringify({ invalid: 'data' }));
      const loaded = loadFireCalculatorInputs();

      expect(loaded).toBeNull();
    });

    it('should merge with defaults to ensure all fields exist', () => {
      const partialInputs = {
        initialSavings: 50000,
        stocksPercent: 60,
        bondsPercent: 30,
        cashPercent: 10,
        currentAnnualExpenses: 30000,
        fireAnnualExpenses: 30000,
        annualLaborIncome: 50000,
        yearOfBirth: 1990,
      };
      
      localStorage.setItem('fire-calculator-inputs', JSON.stringify(partialInputs));
      const loaded = loadFireCalculatorInputs();

      // Should have the partial values
      expect(loaded?.initialSavings).toBe(50000);
      expect(loaded?.stocksPercent).toBe(60);
      // Should also have default values for missing fields
      expect(loaded?.retirementAge).toBe(DEFAULT_INPUTS.retirementAge);
      expect(loaded?.expectedStockReturn).toBe(DEFAULT_INPUTS.expectedStockReturn);
    });
  });

  describe('isLocalStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it('should return false when localStorage is not available', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      expect(isLocalStorageAvailable()).toBe(false);

      localStorage.setItem = originalSetItem;
    });
  });
});
