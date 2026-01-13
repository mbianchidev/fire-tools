import { describe, it, expect } from 'vitest';
import { DEFAULT_PORTFOLIO_VALUE, DEFAULT_ASSETS } from '../../src/utils/defaultAssets';
import { Asset, AssetClass } from '../../src/types/assetAllocation';

describe('defaultAssets', () => {
  describe('DEFAULT_PORTFOLIO_VALUE', () => {
    it('should be a positive number', () => {
      expect(DEFAULT_PORTFOLIO_VALUE).toBeGreaterThan(0);
    });

    it('should equal 65000 (non-cash assets total)', () => {
      expect(DEFAULT_PORTFOLIO_VALUE).toBe(65000);
    });
  });

  describe('DEFAULT_ASSETS', () => {
    it('should be an array of assets', () => {
      expect(Array.isArray(DEFAULT_ASSETS)).toBe(true);
      expect(DEFAULT_ASSETS.length).toBeGreaterThan(0);
    });

    it('should have required properties for each asset', () => {
      DEFAULT_ASSETS.forEach((asset: Asset) => {
        expect(asset.id).toBeDefined();
        expect(typeof asset.id).toBe('string');
        expect(asset.name).toBeDefined();
        expect(typeof asset.name).toBe('string');
        expect(asset.ticker).toBeDefined();
        expect(typeof asset.ticker).toBe('string');
        expect(asset.assetClass).toBeDefined();
        expect(asset.subAssetType).toBeDefined();
        expect(typeof asset.currentValue).toBe('number');
        expect(asset.targetMode).toBeDefined();
      });
    });

    it('should have unique IDs for all assets', () => {
      const ids = DEFAULT_ASSETS.map(asset => asset.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include all expected asset classes', () => {
      const assetClasses = new Set(DEFAULT_ASSETS.map(asset => asset.assetClass));
      expect(assetClasses.has('STOCKS')).toBe(true);
      expect(assetClasses.has('BONDS')).toBe(true);
      expect(assetClasses.has('CASH')).toBe(true);
    });

    it('should have total holdings of approximately 70000', () => {
      const totalHoldings = DEFAULT_ASSETS.reduce((sum, asset) => sum + asset.currentValue, 0);
      expect(totalHoldings).toBe(70000);
    });

    it('should have non-cash assets summing to DEFAULT_PORTFOLIO_VALUE', () => {
      const nonCashTotal = DEFAULT_ASSETS
        .filter(asset => asset.assetClass !== 'CASH')
        .reduce((sum, asset) => sum + asset.currentValue, 0);
      expect(nonCashTotal).toBe(DEFAULT_PORTFOLIO_VALUE);
    });

    it('should have percentage targets summing to 100 within each asset class', () => {
      // Group assets by class
      const assetsByClass = new Map<AssetClass, Asset[]>();
      DEFAULT_ASSETS.forEach(asset => {
        const existing = assetsByClass.get(asset.assetClass) || [];
        existing.push(asset);
        assetsByClass.set(asset.assetClass, existing);
      });

      // Check each class
      assetsByClass.forEach((assets, assetClass) => {
        const percentageAssets = assets.filter(a => a.targetMode === 'PERCENTAGE');
        if (percentageAssets.length > 0) {
          const totalPercent = percentageAssets.reduce((sum, a) => sum + (a.targetPercent || 0), 0);
          expect(totalPercent).toBe(100);
        }
      });
    });

    it('should have valid target modes', () => {
      DEFAULT_ASSETS.forEach(asset => {
        expect(['PERCENTAGE', 'SET', 'OFF']).toContain(asset.targetMode);
      });
    });

    it('should have PERCENTAGE assets with defined targetPercent', () => {
      DEFAULT_ASSETS.forEach(asset => {
        if (asset.targetMode === 'PERCENTAGE') {
          expect(asset.targetPercent).toBeDefined();
          expect(typeof asset.targetPercent).toBe('number');
          expect(asset.targetPercent).toBeGreaterThan(0);
          expect(asset.targetPercent).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should have SET assets with defined targetValue', () => {
      DEFAULT_ASSETS.forEach(asset => {
        if (asset.targetMode === 'SET') {
          expect(asset.targetValue).toBeDefined();
          expect(typeof asset.targetValue).toBe('number');
        }
      });
    });

    it('should have cash asset with SET target mode', () => {
      const cashAssets = DEFAULT_ASSETS.filter(asset => asset.assetClass === 'CASH');
      expect(cashAssets.length).toBeGreaterThan(0);
      cashAssets.forEach(cash => {
        expect(cash.targetMode).toBe('SET');
      });
    });

    it('should have valid sub-asset types', () => {
      const validSubTypes = [
        'ETF',
        'SINGLE_STOCK',
        'SINGLE_BOND',
        'SAVINGS_ACCOUNT',
        'CHECKING_ACCOUNT',
        'BROKERAGE_ACCOUNT',
        'MONEY_ETF',
        'COIN',
        'PROPERTY',
        'REIT',
        'NONE',
      ];
      DEFAULT_ASSETS.forEach(asset => {
        expect(validSubTypes).toContain(asset.subAssetType);
      });
    });

    it('should have non-negative current values', () => {
      DEFAULT_ASSETS.forEach(asset => {
        expect(asset.currentValue).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have stock assets as ETF type', () => {
      const stockAssets = DEFAULT_ASSETS.filter(asset => asset.assetClass === 'STOCKS');
      stockAssets.forEach(stock => {
        expect(stock.subAssetType).toBe('ETF');
      });
    });

    it('should have bond assets as ETF type', () => {
      const bondAssets = DEFAULT_ASSETS.filter(asset => asset.assetClass === 'BONDS');
      bondAssets.forEach(bond => {
        expect(bond.subAssetType).toBe('ETF');
      });
    });

    it('should have expected stock tickers', () => {
      const stockTickers = DEFAULT_ASSETS
        .filter(asset => asset.assetClass === 'STOCKS')
        .map(asset => asset.ticker);
      expect(stockTickers).toContain('SPY');
      expect(stockTickers).toContain('VTI');
    });

    it('should have expected bond tickers', () => {
      const bondTickers = DEFAULT_ASSETS
        .filter(asset => asset.assetClass === 'BONDS')
        .map(asset => asset.ticker);
      expect(bondTickers).toContain('BND');
    });

    it('should have ISIN codes for ETF assets', () => {
      const etfAssets = DEFAULT_ASSETS.filter(asset => asset.subAssetType === 'ETF');
      etfAssets.forEach(etf => {
        expect(etf.isin).toBeDefined();
        expect(typeof etf.isin).toBe('string');
        expect(etf.isin?.length).toBeGreaterThan(0);
      });
    });
  });
});
