import { describe, expect, it } from 'vitest';
import {
  exportFireCalculatorToCSV,
  importFireCalculatorFromCSV,
  exportAssetAllocationToCSV,
  importAssetAllocationFromCSV,
  exportNetWorthTrackerToJSON,
  importNetWorthTrackerFromJSON,
  exportMonteCarloLogsToCSV,
  exportMonteCarloLogsToJSON,
} from '../../src/utils/csvExport';
import { CalculatorInputs, SimulationLogEntry, MonteCarloFixedParameters } from '../../src/types/calculator';
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

  describe('Monte Carlo Logs Export', () => {
    const testLogs: SimulationLogEntry[] = [
      {
        simulationId: 1,
        timestamp: '2024-01-15T10:00:00.000Z',
        success: true,
        yearsToFIRE: 15,
        finalPortfolio: 1500000,
        yearlyData: [
          {
            year: 2024,
            age: 34,
            stockReturn: 7.5,
            bondReturn: 2.1,
            cashReturn: -2,
            portfolioReturn: 5.3,
            isBlackSwan: false,
            expenses: 40000,
            laborIncome: 60000,
            totalIncome: 75000,
            portfolioValue: 150000,
            isFIREAchieved: false,
          },
          {
            year: 2025,
            age: 35,
            stockReturn: -15.2,
            bondReturn: 1.5,
            cashReturn: -2,
            portfolioReturn: -10.1,
            isBlackSwan: true,
            expenses: 40000,
            laborIncome: 62000,
            totalIncome: 47000,
            portfolioValue: 135000,
            isFIREAchieved: false,
          },
        ],
      },
      {
        simulationId: 2,
        timestamp: '2024-01-15T10:00:00.000Z',
        success: false,
        yearsToFIRE: null,
        finalPortfolio: 50000,
        yearlyData: [
          {
            year: 2024,
            age: 34,
            stockReturn: -25,
            bondReturn: -5,
            cashReturn: -2,
            portfolioReturn: -20,
            isBlackSwan: true,
            expenses: 40000,
            laborIncome: 60000,
            totalIncome: 40000,
            portfolioValue: 40000,
            isFIREAchieved: false,
          },
        ],
      },
    ];

    const testFixedParameters: MonteCarloFixedParameters = {
      initialSavings: 100000,
      stocksPercent: 70,
      bondsPercent: 20,
      cashPercent: 10,
      currentAnnualExpenses: 40000,
      fireAnnualExpenses: 40000,
      annualLaborIncome: 60000,
      savingsRate: 33.33,
      desiredWithdrawalRate: 4,
      expectedStockReturn: 7,
      expectedBondReturn: 2,
      expectedCashReturn: -2,
      numSimulations: 2,
      stockVolatility: 15,
      bondVolatility: 5,
      blackSwanProbability: 2,
      blackSwanImpact: -40,
      stopWorkingAtFIRE: true,
    };

    it('should export Monte Carlo logs to CSV with fixed parameters', () => {
      const csv = exportMonteCarloLogsToCSV(testLogs, testFixedParameters);

      expect(csv).toContain('Monte Carlo Simulation Logs');
      expect(csv).toContain('Fixed Parameters (apply to all simulations)');
      expect(csv).toContain('Initial Savings,100000');
      expect(csv).toContain('Stocks Percent,70');
      expect(csv).toContain('Stock Volatility,15');
      expect(csv).toContain('Simulation Results Summary');
      expect(csv).toContain('Detailed Yearly Data');
    });

    it('should include simulation summary in CSV export', () => {
      const csv = exportMonteCarloLogsToCSV(testLogs, testFixedParameters);

      expect(csv).toContain('1,true,15');
      expect(csv).toContain('2,false,N/A');
    });

    it('should include yearly data in CSV export', () => {
      const csv = exportMonteCarloLogsToCSV(testLogs, testFixedParameters);

      // Check for yearly data headers
      expect(csv).toContain('Simulation ID,Year,Age,Stock Return');
      
      // Check for actual yearly data values
      expect(csv).toContain('1,2024,34');
      expect(csv).toContain('7.50'); // Stock return
      expect(csv).toContain('true'); // Black swan event in second year
    });

    it('should export Monte Carlo logs to JSON with complete structure', () => {
      const json = exportMonteCarloLogsToJSON(testLogs, testFixedParameters);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('MonteCarloSimulationLogs');
      expect(parsed.exportVersion).toBe('1.0');
      expect(parsed.fixedParameters).toBeDefined();
      expect(parsed.simulations).toHaveLength(2);
    });

    it('should preserve all data in JSON export', () => {
      const json = exportMonteCarloLogsToJSON(testLogs, testFixedParameters);
      const parsed = JSON.parse(json);

      expect(parsed.fixedParameters.initialSavings).toBe(100000);
      expect(parsed.fixedParameters.stockVolatility).toBe(15);
      expect(parsed.simulations[0].simulationId).toBe(1);
      expect(parsed.simulations[0].success).toBe(true);
      expect(parsed.simulations[0].yearlyData).toHaveLength(2);
      expect(parsed.simulations[0].yearlyData[1].isBlackSwan).toBe(true);
    });

    it('should handle empty logs array', () => {
      const csv = exportMonteCarloLogsToCSV([], testFixedParameters);
      const json = exportMonteCarloLogsToJSON([], testFixedParameters);

      expect(csv).toContain('Monte Carlo Simulation Logs');
      expect(csv).toContain('Fixed Parameters');
      
      const parsed = JSON.parse(json);
      expect(parsed.simulations).toHaveLength(0);
    });
  });
});
