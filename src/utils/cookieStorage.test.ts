import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  saveAssetAllocation,
  loadAssetAllocation,
  clearAssetAllocation,
  saveFireCalculatorInputs,
  loadFireCalculatorInputs,
  clearFireCalculatorInputs,
  clearAllData,
  isCookieStorageAvailable,
} from './cookieStorage';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { CalculatorInputs } from '../types/calculator';
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
});
