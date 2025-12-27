import { describe, expect, it } from 'vitest';
import {
  exportFireCalculatorToCSV,
  importFireCalculatorFromCSV,
  exportAssetAllocationToCSV,
  importAssetAllocationFromCSV,
} from './csvExport';
import { CalculatorInputs } from '../types/calculator';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { DEFAULT_INPUTS } from './defaults';

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
});
