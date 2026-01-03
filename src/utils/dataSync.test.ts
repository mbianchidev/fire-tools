import { describe, expect, it } from 'vitest';
import {
  syncAssetAllocationToNetWorth,
  syncNetWorthToAssetAllocation,
} from './dataSync';
import { Asset, AssetClass, AllocationMode, SubAssetType } from '../types/assetAllocation';
import { NetWorthTrackerData, MonthlySnapshot, AssetHolding, CashEntry } from '../types/netWorthTracker';

describe('Data Sync Utilities', () => {
  describe('syncAssetAllocationToNetWorth', () => {
    it('should sync assets from asset allocation to net worth current month', () => {
      // ARRANGE
      const currentYear = 2026;
      const currentMonth = 1;
      
      const assetAllocationData: Asset[] = [
        {
          id: 'aa-1',
          name: 'Vanguard FTSE All-World',
          ticker: 'VWCE',
          assetClass: 'STOCKS' as AssetClass,
          subAssetType: 'ETF' as SubAssetType,
          currentValue: 10000,
          targetMode: 'PERCENTAGE' as AllocationMode,
          targetPercent: 70,
        },
        {
          id: 'aa-2',
          name: 'iShares Global Agg Bond',
          ticker: 'AGGH',
          assetClass: 'BONDS' as AssetClass,
          subAssetType: 'ETF' as SubAssetType,
          currentValue: 5000,
          targetMode: 'PERCENTAGE' as AllocationMode,
          targetPercent: 30,
        },
      ];
      
      const netWorthData: NetWorthTrackerData = {
        years: [
          {
            year: currentYear,
            months: [
              {
                year: currentYear,
                month: currentMonth,
                assets: [],
                cashEntries: [],
                pensions: [],
                operations: [],
                isFrozen: false,
              },
            ],
          },
        ],
        currentYear,
        currentMonth,
        defaultCurrency: 'EUR',
        settings: {
          showPensionInNetWorth: true,
          includeUnrealizedGains: true,
        },
      };
      
      // ACT
      const result = syncAssetAllocationToNetWorth(assetAllocationData, netWorthData);
      
      // ASSERT
      expect(result.years[0].months[0].assets).toHaveLength(2);
      expect(result.years[0].months[0].assets[0].name).toBe('Vanguard FTSE All-World');
      expect(result.years[0].months[0].assets[0].ticker).toBe('VWCE');
      expect(result.years[0].months[0].assets[0].shares * result.years[0].months[0].assets[0].pricePerShare).toBeCloseTo(10000, 0);
      expect(result.years[0].months[0].assets[1].name).toBe('iShares Global Agg Bond');
      expect(result.years[0].months[0].assets[1].ticker).toBe('AGGH');
    });

    it('should sync cash entries from asset allocation to net worth', () => {
      // ARRANGE
      const currentYear = 2026;
      const currentMonth = 1;
      
      const assetAllocationData: Asset[] = [
        {
          id: 'aa-cash-1',
          name: 'Emergency Fund',
          ticker: '',
          assetClass: 'CASH' as AssetClass,
          subAssetType: 'SAVINGS_ACCOUNT' as SubAssetType,
          currentValue: 12000,
          targetMode: 'SET' as AllocationMode,
          targetValue: 12000,
        },
        {
          id: 'aa-cash-2',
          name: 'Main Checking',
          ticker: '',
          assetClass: 'CASH' as AssetClass,
          subAssetType: 'CHECKING_ACCOUNT' as SubAssetType,
          currentValue: 3000,
          targetMode: 'SET' as AllocationMode,
          targetValue: 3000,
        },
      ];
      
      const netWorthData: NetWorthTrackerData = {
        years: [
          {
            year: currentYear,
            months: [
              {
                year: currentYear,
                month: currentMonth,
                assets: [],
                cashEntries: [],
                pensions: [],
                operations: [],
                isFrozen: false,
              },
            ],
          },
        ],
        currentYear,
        currentMonth,
        defaultCurrency: 'EUR',
        settings: {
          showPensionInNetWorth: true,
          includeUnrealizedGains: true,
        },
      };
      
      // ACT
      const result = syncAssetAllocationToNetWorth(assetAllocationData, netWorthData);
      
      // ASSERT
      expect(result.years[0].months[0].cashEntries).toHaveLength(2);
      expect(result.years[0].months[0].cashEntries[0].accountName).toBe('Emergency Fund');
      expect(result.years[0].months[0].cashEntries[0].balance).toBe(12000);
      expect(result.years[0].months[0].cashEntries[0].accountType).toBe('SAVINGS');
      expect(result.years[0].months[0].cashEntries[1].accountName).toBe('Main Checking');
      expect(result.years[0].months[0].cashEntries[1].balance).toBe(3000);
      expect(result.years[0].months[0].cashEntries[1].accountType).toBe('CHECKING');
    });
  });

  describe('syncNetWorthToAssetAllocation', () => {
    it('should sync from net worth to asset allocation', () => {
      // ARRANGE
      const currentYear = 2026;
      const currentMonth = 1;
      
      const netWorthData: NetWorthTrackerData = {
        years: [
          {
            year: currentYear,
            months: [
              {
                year: currentYear,
                month: currentMonth,
                assets: [
                  {
                    id: 'nw-1',
                    ticker: 'VWCE',
                    name: 'Vanguard FTSE All-World',
                    shares: 100,
                    pricePerShare: 110,
                    currency: 'EUR',
                    assetClass: 'ETF',
                  },
                  {
                    id: 'nw-2',
                    ticker: 'AGGH',
                    name: 'iShares Global Agg Bond',
                    shares: 50,
                    pricePerShare: 45,
                    currency: 'EUR',
                    assetClass: 'BONDS',
                  },
                ],
                cashEntries: [
                  {
                    id: 'nw-cash-1',
                    accountName: 'Emergency Fund',
                    accountType: 'SAVINGS',
                    balance: 12000,
                    currency: 'EUR',
                  },
                  {
                    id: 'nw-cash-2',
                    accountName: 'Main Checking',
                    accountType: 'CHECKING',
                    balance: 3000,
                    currency: 'EUR',
                  },
                ],
                pensions: [],
                operations: [],
                isFrozen: false,
              },
            ],
          },
        ],
        currentYear,
        currentMonth,
        defaultCurrency: 'EUR',
        settings: {
          showPensionInNetWorth: true,
          includeUnrealizedGains: true,
        },
      };
      
      // ACT
      const result = syncNetWorthToAssetAllocation(netWorthData);
      
      // ASSERT
      expect(result).toHaveLength(4); // 2 assets + 2 cash entries
      
      // Check VWCE asset
      const vwce = result.find(a => a.ticker === 'VWCE');
      expect(vwce).toBeDefined();
      expect(vwce!.name).toBe('Vanguard FTSE All-World');
      expect(vwce!.currentValue).toBe(11000); // 100 * 110
      
      // Check AGGH asset
      const aggh = result.find(a => a.ticker === 'AGGH');
      expect(aggh).toBeDefined();
      expect(aggh!.name).toBe('iShares Global Agg Bond');
      expect(aggh!.currentValue).toBe(2250); // 50 * 45
      
      // Check Emergency Fund
      const emergency = result.find(a => a.name === 'Emergency Fund');
      expect(emergency).toBeDefined();
      expect(emergency!.assetClass).toBe('CASH');
      expect(emergency!.currentValue).toBe(12000);
      
      // Check Main Checking
      const checking = result.find(a => a.name === 'Main Checking');
      expect(checking).toBeDefined();
      expect(checking!.assetClass).toBe('CASH');
      expect(checking!.currentValue).toBe(3000);
    });
  });
});
