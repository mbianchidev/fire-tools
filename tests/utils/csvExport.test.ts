import { describe, expect, it } from 'vitest';
import {
  exportFireCalculatorToCSV,
  importFireCalculatorFromCSV,
  exportAssetAllocationToCSV,
  importAssetAllocationFromCSV,
  exportNetWorthTrackerToJSON,
  importNetWorthTrackerFromJSON,
} from '../../src/utils/csvExport';
import { CalculatorInputs } from '../../src/types/calculator';
import { Asset, AssetClass, AllocationMode } from '../../src/types/assetAllocation';
import { DEFAULT_INPUTS } from '../../src/utils/defaults';

describe('CSV Export/Import', () => {
  describe('FIRE Calculator CSV', () => {
    const testInputs: CalculatorInputs = {
      ...DEFAULT_INPUTS,
      initialSavings: 100000,
      stocksPercent: 80,
      yearOfBirth: 1985,
      stopWorkingAtFIRE: false,
    };

    it('should export calculator inputs to CSV', () => {
      const csv = exportFireCalculatorToCSV(testInputs);

      expect(csv).toContain('FIRE Calculator Data Export');
      expect(csv).toContain('Initial Savings,100000');
      expect(csv).toContain('Stocks Percent,80');
      expect(csv).toContain('Year of Birth,1985');
      expect(csv).toContain('Stop Working At FIRE,false');
    });

    it('should import calculator inputs from CSV', () => {
      const csv = exportFireCalculatorToCSV(testInputs);
      const imported = importFireCalculatorFromCSV(csv);

      expect(imported.initialSavings).toBe(testInputs.initialSavings);
      expect(imported.stocksPercent).toBe(testInputs.stocksPercent);
      expect(imported.yearOfBirth).toBe(testInputs.yearOfBirth);
      expect(imported.stopWorkingAtFIRE).toBe(testInputs.stopWorkingAtFIRE);
    });

    it('should handle round-trip export/import', () => {
      const csv = exportFireCalculatorToCSV(testInputs);
      const imported = importFireCalculatorFromCSV(csv);

      expect(imported).toEqual(testInputs);
    });

    it('should throw error for invalid CSV with missing required fields', () => {
      const invalidCSV = 'FIRE Calculator Data Export\nGenerated,2024-01-01\n';

      expect(() => importFireCalculatorFromCSV(invalidCSV)).toThrow('Missing required field');
    });
  });

  describe('Asset Allocation CSV', () => {
    const testAssets: Asset[] = [
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
        name: 'Asset, With Comma',
        ticker: 'COMMA',
        assetClass: 'BONDS',
        subAssetType: 'ETF',
        currentValue: 5000,
        targetMode: 'PERCENTAGE',
        targetPercent: 50,
      },
    ];

    const testTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> = {
      STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 60 },
      BONDS: { targetMode: 'PERCENTAGE', targetPercent: 40 },
      CASH: { targetMode: 'SET' },
      CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
      REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
    };

    it('should export asset allocation to CSV', () => {
      const csv = exportAssetAllocationToCSV(testAssets, testTargets);

      expect(csv).toContain('Asset Allocation Export');
      expect(csv).toContain('Asset Class Targets');
      expect(csv).toContain('STOCKS,PERCENTAGE,60');
      expect(csv).toContain('Assets');
      expect(csv).toContain('asset-1');
      expect(csv).toContain('Test Asset');
    });

    it('should handle asset names with commas', () => {
      const csv = exportAssetAllocationToCSV(testAssets, testTargets);

      expect(csv).toContain('"Asset, With Comma"');
    });

    it('should import asset allocation from CSV', () => {
      const csv = exportAssetAllocationToCSV(testAssets, testTargets);
      const imported = importAssetAllocationFromCSV(csv);

      expect(imported.assets).toHaveLength(2);
      expect(imported.assets[0].id).toBe('asset-1');
      expect(imported.assets[0].name).toBe('Test Asset');
      expect(imported.assets[1].name).toBe('Asset, With Comma');
      expect(imported.assetClassTargets.STOCKS.targetPercent).toBe(60);
    });

    it('should handle round-trip export/import for asset allocation', () => {
      const csv = exportAssetAllocationToCSV(testAssets, testTargets);
      const imported = importAssetAllocationFromCSV(csv);

      expect(imported.assets[0]).toEqual(testAssets[0]);
      expect(imported.assets[1]).toEqual(testAssets[1]);
      expect(imported.assetClassTargets).toEqual(testTargets);
    });

    it('should throw error for CSV with no assets', () => {
      const invalidCSV = 'Asset Allocation Export\nGenerated,2024-01-01\n';

      expect(() => importAssetAllocationFromCSV(invalidCSV)).toThrow('No assets found');
    });
  });

  describe('Net Worth Tracker JSON', () => {
    const testNetWorthData = {
      years: [
        {
          year: 2024,
          months: [
            {
              year: 2024,
              month: 1,
              assets: [
                {
                  id: 'asset-1',
                  ticker: 'VWCE',
                  name: 'Vanguard All-World',
                  shares: 100,
                  pricePerShare: 100,
                  currency: 'EUR' as const,
                  assetClass: 'ETF' as const,
                },
              ],
              cashEntries: [
                {
                  id: 'cash-1',
                  accountName: 'Savings',
                  accountType: 'SAVINGS' as const,
                  balance: 5000,
                  currency: 'EUR' as const,
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
      defaultCurrency: 'EUR' as const,
      settings: {
        showPensionInNetWorth: true,
        includeUnrealizedGains: true,
      },
    };

    it('should export net worth tracker data to JSON', () => {
      const json = exportNetWorthTrackerToJSON(testNetWorthData);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('NetWorthTracker');
      expect(parsed.exportVersion).toBe('1.0');
      expect(parsed.data.years).toHaveLength(1);
      expect(parsed.data.years[0].months[0].assets[0].ticker).toBe('VWCE');
    });

    it('should import net worth tracker data from JSON', () => {
      const json = exportNetWorthTrackerToJSON(testNetWorthData);
      const imported = importNetWorthTrackerFromJSON(json);

      expect(imported.years).toHaveLength(1);
      expect(imported.years[0].months[0].assets[0].ticker).toBe('VWCE');
      expect(imported.years[0].months[0].cashEntries[0].balance).toBe(5000);
    });

    it('should handle round-trip export/import', () => {
      const json = exportNetWorthTrackerToJSON(testNetWorthData);
      const imported = importNetWorthTrackerFromJSON(json);

      expect(imported.years[0].months[0]).toEqual(testNetWorthData.years[0].months[0]);
      expect(imported.defaultCurrency).toBe(testNetWorthData.defaultCurrency);
    });

    it('should import raw data without wrapper', () => {
      const rawJson = JSON.stringify(testNetWorthData);
      const imported = importNetWorthTrackerFromJSON(rawJson);

      expect(imported.years).toHaveLength(1);
      expect(imported.defaultCurrency).toBe('EUR');
    });
  });
});
