import { describe, it, expect } from 'vitest';
import { calculateDCAAllocation, calculateShares, formatShares, formatDCACurrency } from './dcaCalculator';
import { Asset, AssetClass } from '../types/assetAllocation';

describe('DCA Calculator', () => {
  describe('calculateDCAAllocation', () => {
    it('should correctly distribute investment according to asset allocation', () => {
      // Setup: 60% Stocks, 40% Bonds
      // Stocks: VTI 60%, VOO 40% (within stocks)
      // Bonds: BND 100% (within bonds)
      const assets: Asset[] = [
        {
          id: 'vti',
          name: 'Vanguard Total Stock Market',
          ticker: 'VTI',
          assetClass: 'STOCKS',
          subAssetType: 'ETF',
          currentValue: 30000,
          targetMode: 'PERCENTAGE',
          targetPercent: 60,
        },
        {
          id: 'voo',
          name: 'Vanguard S&P 500',
          ticker: 'VOO',
          assetClass: 'STOCKS',
          subAssetType: 'ETF',
          currentValue: 20000,
          targetMode: 'PERCENTAGE',
          targetPercent: 40,
        },
        {
          id: 'bnd',
          name: 'Vanguard Total Bond Market',
          ticker: 'BND',
          assetClass: 'BONDS',
          subAssetType: 'ETF',
          currentValue: 30000,
          targetMode: 'PERCENTAGE',
          targetPercent: 100,
        },
      ];

      const assetClassTargets: Record<AssetClass, { targetMode: string; targetPercent?: number }> = {
        STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 60 },
        BONDS: { targetMode: 'PERCENTAGE', targetPercent: 40 },
        CASH: { targetMode: 'SET' },
        CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
        REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
      };

      const investmentAmount = 10000;

      const result = calculateDCAAllocation(assets, investmentAmount, assetClassTargets);

      // Total should equal investment amount
      expect(result.totalAmount).toBe(10000);
      expect(result.totalAllocated).toBeCloseTo(10000, 2);

      // Stocks should get 60% = 6000
      const stocksTotal = result.allocations
        .filter(a => a.assetClass === 'STOCKS')
        .reduce((sum, a) => sum + a.investmentAmount, 0);
      expect(stocksTotal).toBeCloseTo(6000, 2);

      // Bonds should get 40% = 4000
      const bondsTotal = result.allocations
        .filter(a => a.assetClass === 'BONDS')
        .reduce((sum, a) => sum + a.investmentAmount, 0);
      expect(bondsTotal).toBeCloseTo(4000, 2);

      // VTI should get 60% of stocks = 3600
      const vtiAllocation = result.allocations.find(a => a.assetId === 'vti');
      expect(vtiAllocation?.investmentAmount).toBeCloseTo(3600, 2);

      // VOO should get 40% of stocks = 2400
      const vooAllocation = result.allocations.find(a => a.assetId === 'voo');
      expect(vooAllocation?.investmentAmount).toBeCloseTo(2400, 2);

      // BND should get 100% of bonds = 4000
      const bndAllocation = result.allocations.find(a => a.assetId === 'bnd');
      expect(bndAllocation?.investmentAmount).toBeCloseTo(4000, 2);
    });

    it('should handle assets with OFF mode correctly', () => {
      const assets: Asset[] = [
        {
          id: 'vti',
          name: 'VTI',
          ticker: 'VTI',
          assetClass: 'STOCKS',
          subAssetType: 'ETF',
          currentValue: 50000,
          targetMode: 'PERCENTAGE',
          targetPercent: 100,
        },
        {
          id: 'bnd',
          name: 'BND',
          ticker: 'BND',
          assetClass: 'BONDS',
          subAssetType: 'ETF',
          currentValue: 30000,
          targetMode: 'OFF', // Should be excluded
        },
      ];

      const assetClassTargets: Record<AssetClass, { targetMode: string; targetPercent?: number }> = {
        STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 100 },
        BONDS: { targetMode: 'PERCENTAGE', targetPercent: 0 },
        CASH: { targetMode: 'SET' },
        CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
        REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
      };

      const result = calculateDCAAllocation(assets, 10000, assetClassTargets);

      // Should only have VTI allocation
      expect(result.allocations.length).toBe(1);
      expect(result.allocations[0].assetId).toBe('vti');
      expect(result.allocations[0].investmentAmount).toBeCloseTo(10000, 2);
    });

    it('should handle zero investment amount', () => {
      const assets: Asset[] = [
        {
          id: 'vti',
          name: 'VTI',
          ticker: 'VTI',
          assetClass: 'STOCKS',
          subAssetType: 'ETF',
          currentValue: 50000,
          targetMode: 'PERCENTAGE',
          targetPercent: 100,
        },
      ];

      const assetClassTargets: Record<AssetClass, { targetMode: string; targetPercent?: number }> = {
        STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 100 },
        BONDS: { targetMode: 'PERCENTAGE', targetPercent: 0 },
        CASH: { targetMode: 'SET' },
        CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
        REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
      };

      const result = calculateDCAAllocation(assets, 0, assetClassTargets);

      expect(result.totalAmount).toBe(0);
      expect(result.totalAllocated).toBe(0);
      result.allocations.forEach(allocation => {
        expect(allocation.investmentAmount).toBe(0);
      });
    });
  });

  describe('calculateShares', () => {
    it('should calculate correct share counts for each asset', () => {
      const dcaCalculation = {
        totalAmount: 10000,
        allocations: [
          {
            assetId: 'vti',
            assetName: 'VTI',
            ticker: 'VTI',
            assetClass: 'STOCKS' as AssetClass,
            allocationPercent: 60,
            investmentAmount: 6000,
          },
          {
            assetId: 'bnd',
            assetName: 'BND',
            ticker: 'BND',
            assetClass: 'BONDS' as AssetClass,
            allocationPercent: 40,
            investmentAmount: 4000,
          },
        ],
        totalAllocated: 10000,
        timestamp: new Date(),
      };

      const prices = {
        VTI: 200,
        BND: 80,
      };

      const result = calculateShares(dcaCalculation, prices);

      // VTI: 6000 / 200 = 30 shares
      const vtiAllocation = result.allocations.find(a => a.ticker === 'VTI');
      expect(vtiAllocation?.shares).toBeCloseTo(30, 6);
      expect(vtiAllocation?.currentPrice).toBe(200);

      // BND: 4000 / 80 = 50 shares
      const bndAllocation = result.allocations.find(a => a.ticker === 'BND');
      expect(bndAllocation?.shares).toBeCloseTo(50, 6);
      expect(bndAllocation?.currentPrice).toBe(80);
    });

    it('should handle fractional shares correctly', () => {
      const dcaCalculation = {
        totalAmount: 1000,
        allocations: [
          {
            assetId: 'aapl',
            assetName: 'Apple',
            ticker: 'AAPL',
            assetClass: 'STOCKS' as AssetClass,
            allocationPercent: 100,
            investmentAmount: 1000,
          },
        ],
        totalAllocated: 1000,
        timestamp: new Date(),
      };

      const prices = {
        AAPL: 175.5,
      };

      const result = calculateShares(dcaCalculation, prices);

      const aaplAllocation = result.allocations.find(a => a.ticker === 'AAPL');
      // 1000 / 175.5 = 5.698006 shares (fractional)
      expect(aaplAllocation?.shares).toBeCloseTo(5.698006, 4);
    });

    it('should set error for missing prices', () => {
      const dcaCalculation = {
        totalAmount: 1000,
        allocations: [
          {
            assetId: 'xyz',
            assetName: 'Unknown Asset',
            ticker: 'XYZ',
            assetClass: 'STOCKS' as AssetClass,
            allocationPercent: 100,
            investmentAmount: 1000,
          },
        ],
        totalAllocated: 1000,
        timestamp: new Date(),
      };

      const prices = {
        // XYZ price is missing
      };

      const result = calculateShares(dcaCalculation, prices);

      const xyzAllocation = result.allocations.find(a => a.ticker === 'XYZ');
      expect(xyzAllocation?.priceError).toBe('Price unavailable');
      expect(xyzAllocation?.shares).toBeUndefined();
    });

    it('should handle invalid prices (zero or negative)', () => {
      const dcaCalculation = {
        totalAmount: 1000,
        allocations: [
          {
            assetId: 'bad',
            assetName: 'Bad Asset',
            ticker: 'BAD',
            assetClass: 'STOCKS' as AssetClass,
            allocationPercent: 100,
            investmentAmount: 1000,
          },
        ],
        totalAllocated: 1000,
        timestamp: new Date(),
      };

      const prices = {
        BAD: 0,
      };

      const result = calculateShares(dcaCalculation, prices);

      const badAllocation = result.allocations.find(a => a.ticker === 'BAD');
      expect(badAllocation?.priceError).toBe('Invalid price');
      expect(badAllocation?.shares).toBeUndefined();
    });
  });

  describe('formatShares', () => {
    it('should format whole numbers without decimals', () => {
      expect(formatShares(10)).toBe('10');
      expect(formatShares(100)).toBe('100');
    });

    it('should format fractional shares with up to 6 decimals', () => {
      expect(formatShares(5.5)).toBe('5.5');
      expect(formatShares(5.123456)).toBe('5.123456');
      expect(formatShares(5.1234567)).toBe('5.123457'); // Rounded to 6 decimals
    });

    it('should remove trailing zeros', () => {
      expect(formatShares(5.1)).toBe('5.1');
      expect(formatShares(5.10)).toBe('5.1');
      expect(formatShares(5.100000)).toBe('5.1');
      expect(formatShares(5.000000)).toBe('5');
    });
  });

  describe('formatDCACurrency', () => {
    it('should format EUR currency correctly', () => {
      expect(formatDCACurrency(1000, 'EUR')).toBe('€1,000.00');
      expect(formatDCACurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatDCACurrency(0, 'EUR')).toBe('€0.00');
    });

    it('should format USD currency correctly', () => {
      expect(formatDCACurrency(1000, 'USD')).toBe('$1,000.00');
      expect(formatDCACurrency(1234.56, 'USD')).toBe('$1,234.56');
    });

    it('should handle large numbers with commas', () => {
      expect(formatDCACurrency(1000000, 'EUR')).toBe('€1,000,000.00');
      expect(formatDCACurrency(1234567.89, 'EUR')).toBe('€1,234,567.89');
    });

    it('should default to EUR if no currency specified', () => {
      expect(formatDCACurrency(1000)).toBe('€1,000.00');
    });
  });
});
