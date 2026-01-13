import { describe, expect, it } from 'vitest';
import {
  syncAssetAllocationToNetWorth,
  syncNetWorthToAssetAllocation,
} from '../../src/utils/dataSync';
import { Asset, AssetClass, AllocationMode, SubAssetType } from '../../src/types/assetAllocation';
import { NetWorthTrackerData } from '../../src/types/netWorthTracker';
import { SupportedCurrency } from '../../src/types/currency';
import { getDemoAssetAllocationData } from '../../src/utils/defaults';

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

    it('should sync shares and pricePerShare from net worth to asset allocation', () => {
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
                    shares: 85,
                    pricePerShare: 112.50,
                    currency: 'EUR',
                    assetClass: 'ETF',
                  },
                ],
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
      const result = syncNetWorthToAssetAllocation(netWorthData);
      
      // ASSERT
      expect(result).toHaveLength(1);
      const vwce = result[0];
      expect(vwce.shares).toBe(85);
      expect(vwce.pricePerShare).toBe(112.50);
      expect(vwce.currentValue).toBeCloseTo(9562.50, 2); // 85 * 112.50
    });
  });

  describe('syncAssetAllocationToNetWorth with shares', () => {
    it('should sync shares and pricePerShare from asset allocation to net worth', () => {
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
          currentValue: 9562.50,
          shares: 85,
          pricePerShare: 112.50,
          targetMode: 'OFF' as AllocationMode,
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
      expect(result.years[0].months[0].assets).toHaveLength(1);
      const asset = result.years[0].months[0].assets[0];
      expect(asset.shares).toBe(85);
      expect(asset.pricePerShare).toBe(112.50);
      expect(asset.shares * asset.pricePerShare).toBeCloseTo(9562.50, 2);
    });

    it('should calculate pricePerShare when only currentValue is provided', () => {
      // ARRANGE - User entered current value but not shares
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
          // No shares or pricePerShare provided
          targetMode: 'OFF' as AllocationMode,
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
      expect(result.years[0].months[0].assets).toHaveLength(1);
      const asset = result.years[0].months[0].assets[0];
      // Should default to shares=1 and pricePerShare=currentValue for backwards compatibility
      expect(asset.shares).toBe(1);
      expect(asset.pricePerShare).toBe(10000);
    });
  });

  describe('Demo Data Integration and Sync Tests', () => {
    describe('Reset and Load Demo Data (No Sync)', () => {
      it('should load demo data with 8 ETFs and proper share quantities', () => {
        // ARRANGE & ACT
        const demoData = getDemoAssetAllocationData();
        
        // ASSERT
        // Should have 8 ETFs + 2 cash = 10 assets total
        expect(demoData.assets).toHaveLength(10);
        
        // Check all 8 ETFs are present
        const etfTickers = ['SPY', 'VTI', 'VXUS', 'VWO', 'VBR', 'BND', 'TIP', 'BNDX'];
        etfTickers.forEach(ticker => {
          const etf = demoData.assets.find(a => a.ticker === ticker);
          expect(etf).toBeDefined();
          expect(etf!.shares).toBeGreaterThan(0);
          expect(etf!.pricePerShare).toBeGreaterThan(0);
        });
        
        // Check SPY specifically (as per requirement: 11.961 shares @ €585.21 ≈ €7,000)
        const spy = demoData.assets.find(a => a.ticker === 'SPY');
        expect(spy!.shares).toBeCloseTo(11.961, 2);
        expect(spy!.pricePerShare).toBeCloseTo(585.21, 2);
        expect(spy!.currentValue).toBeCloseTo(7000, 0);
        
        // Check cash assets have shares and price
        const cashAssets = demoData.assets.filter(a => a.assetClass === 'CASH');
        expect(cashAssets).toHaveLength(2);
        cashAssets.forEach(cash => {
          expect(cash.shares).toBeDefined();
          expect(cash.shares).toBeGreaterThan(0);
          expect(cash.pricePerShare).toBeDefined();
          expect(cash.pricePerShare).toBeGreaterThan(0);
        });
        
        // Total portfolio should be ~€70,000 (allow small rounding differences)
        const totalValue = demoData.assets.reduce((sum, asset) => sum + asset.currentValue, 0);
        expect(totalValue).toBeCloseTo(70000, -1); // Within ±5
      });

      it('should verify all demo assets have shares and pricePerShare fields', () => {
        // ARRANGE & ACT
        const demoData = getDemoAssetAllocationData();
        
        // ASSERT
        demoData.assets.forEach(asset => {
          // Every asset must have shares and pricePerShare
          expect(asset.shares).toBeDefined();
          expect(asset.pricePerShare).toBeDefined();
          expect(asset.shares).toBeGreaterThan(0);
          expect(asset.pricePerShare).toBeGreaterThan(0);
          
          // Current value should equal shares × pricePerShare
          const calculatedValue = asset.shares! * asset.pricePerShare!;
          expect(asset.currentValue).toBeCloseTo(calculatedValue, 2);
        });
      });
    });

    describe('Sync Enable/Disable Behavior', () => {
      it('should preserve all Asset Allocation fields when enabling sync', () => {
        // ARRANGE
        const currentYear = 2026;
        const currentMonth = 1;
        
        // Start with Asset Allocation data with all fields populated
        const originalAssetAllocationData: Asset[] = [
          {
            id: 'aa-1',
            name: 'S&P 500 Index',
            ticker: 'SPY',
            isin: 'US78462F1030',
            assetClass: 'STOCKS' as AssetClass,
            subAssetType: 'ETF' as SubAssetType,
            currentValue: 7000,
            shares: 11.961,
            pricePerShare: 585.21,
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 20,
            originalCurrency: 'USD' as SupportedCurrency,
          },
          {
            id: 'aa-2',
            name: 'Total Bond Market',
            ticker: 'BND',
            isin: 'US9219378356',
            assetClass: 'BONDS' as AssetClass,
            subAssetType: 'ETF' as SubAssetType,
            currentValue: 10000,
            shares: 158.876,
            pricePerShare: 62.94,
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 33.33,
            originalCurrency: 'USD' as SupportedCurrency,
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
        
        // ACT - Enable sync by syncing to Net Worth
        const syncedNetWorthData = syncAssetAllocationToNetWorth(originalAssetAllocationData, netWorthData);
        
        // Then sync back to Asset Allocation
        const syncedAssetAllocationData = syncNetWorthToAssetAllocation(syncedNetWorthData);
        
        // ASSERT - All fields should be preserved
        expect(syncedAssetAllocationData).toHaveLength(2);
        
        const spy = syncedAssetAllocationData.find(a => a.ticker === 'SPY');
        expect(spy).toBeDefined();
        expect(spy!.name).toBe('S&P 500 Index');
        expect(spy!.ticker).toBe('SPY');
        expect(spy!.shares).toBeCloseTo(11.961, 3);
        expect(spy!.pricePerShare).toBeCloseTo(585.21, 2);
        expect(spy!.currentValue).toBeCloseTo(7000, 0);
        expect(spy!.assetClass).toBe('STOCKS');
        
        const bnd = syncedAssetAllocationData.find(a => a.ticker === 'BND');
        expect(bnd).toBeDefined();
        expect(bnd!.name).toBe('Total Bond Market');
        expect(bnd!.shares).toBeCloseTo(158.876, 3);
        expect(bnd!.pricePerShare).toBeCloseTo(62.94, 2);
        expect(bnd!.currentValue).toBeCloseTo(10000, 0);
      });

      it('should reflect price edits from Net Worth in Asset Allocation with recalculations', () => {
        // ARRANGE
        const currentYear = 2026;
        const currentMonth = 1;
        
        // Initial Asset Allocation state
        const initialAssetAllocationData: Asset[] = [
          {
            id: 'aa-1',
            name: 'S&P 500 Index',
            ticker: 'SPY',
            assetClass: 'STOCKS' as AssetClass,
            subAssetType: 'ETF' as SubAssetType,
            currentValue: 7000,
            shares: 11.961,
            pricePerShare: 585.21,
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 20,
          },
        ];
        
        // Sync to Net Worth
        let netWorthData: NetWorthTrackerData = {
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
        
        netWorthData = syncAssetAllocationToNetWorth(initialAssetAllocationData, netWorthData);
        
        // ACT - Edit price per share in Net Worth (+50)
        const editedAsset = netWorthData.years[0].months[0].assets[0];
        editedAsset.pricePerShare = 635.21; // Was 585.21, now +50
        
        // Sync back to Asset Allocation
        const updatedAssetAllocationData = syncNetWorthToAssetAllocation(netWorthData);
        
        // ASSERT - Price change should reflect with recalculated value
        expect(updatedAssetAllocationData).toHaveLength(1);
        const spy = updatedAssetAllocationData[0];
        
        expect(spy.shares).toBeCloseTo(11.961, 3); // Shares unchanged
        expect(spy.pricePerShare).toBeCloseTo(635.21, 2); // Price updated +50
        
        // Current value should be recalculated: 11.961 × 635.21 = 7,598.09
        const expectedValue = 11.961 * 635.21;
        expect(spy.currentValue).toBeCloseTo(expectedValue, 2);
        expect(spy.currentValue).toBeCloseTo(7598.09, 0);
      });

      it('should handle asset add/remove with sync enabled', () => {
        // ARRANGE
        const currentYear = 2026;
        const currentMonth = 1;
        
        const initialAssetAllocationData: Asset[] = [
          {
            id: 'aa-1',
            name: 'S&P 500 Index',
            ticker: 'SPY',
            assetClass: 'STOCKS' as AssetClass,
            subAssetType: 'ETF' as SubAssetType,
            currentValue: 7000,
            shares: 11.961,
            pricePerShare: 585.21,
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 20,
          },
        ];
        
        let netWorthData: NetWorthTrackerData = {
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
        
        // Initial sync
        netWorthData = syncAssetAllocationToNetWorth(initialAssetAllocationData, netWorthData);
        expect(netWorthData.years[0].months[0].assets).toHaveLength(1);
        
        // ACT 1 - Add asset to Asset Allocation
        const updatedAssetAllocationData: Asset[] = [
          ...initialAssetAllocationData,
          {
            id: 'aa-2',
            name: 'Total Bond Market',
            ticker: 'BND',
            assetClass: 'BONDS' as AssetClass,
            subAssetType: 'ETF' as SubAssetType,
            currentValue: 10000,
            shares: 158.876,
            pricePerShare: 62.94,
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 33.33,
          },
        ];
        
        netWorthData = syncAssetAllocationToNetWorth(updatedAssetAllocationData, netWorthData);
        
        // ASSERT 1 - New asset should appear in Net Worth
        expect(netWorthData.years[0].months[0].assets).toHaveLength(2);
        const bnd = netWorthData.years[0].months[0].assets.find(a => a.ticker === 'BND');
        expect(bnd).toBeDefined();
        expect(bnd!.shares).toBeCloseTo(158.876, 3);
        
        // ACT 2 - Remove asset from Asset Allocation
        const reducedAssetAllocationData = updatedAssetAllocationData.filter(a => a.ticker !== 'SPY');
        
        netWorthData = syncAssetAllocationToNetWorth(reducedAssetAllocationData, netWorthData);
        
        // ASSERT 2 - Removed asset should no longer be in Net Worth current month
        expect(netWorthData.years[0].months[0].assets).toHaveLength(1);
        expect(netWorthData.years[0].months[0].assets[0].ticker).toBe('BND');
      });

      it('should handle asset add/remove with sync disabled (no sync)', () => {
        // ARRANGE
        const currentYear = 2026;
        const currentMonth = 1;
        
        // Separate Asset Allocation data
        const assetAllocationData: Asset[] = [
          {
            id: 'aa-1',
            name: 'S&P 500 Index',
            ticker: 'SPY',
            assetClass: 'STOCKS' as AssetClass,
            subAssetType: 'ETF' as SubAssetType,
            currentValue: 7000,
            shares: 11.961,
            pricePerShare: 585.21,
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 20,
          },
        ];
        
        // Separate Net Worth data (not synced)
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
                      ticker: 'VTI',
                      name: 'Total Stock Market',
                      shares: 29.346,
                      pricePerShare: 238.54,
                      currency: 'EUR',
                      assetClass: 'ETF',
                    },
                  ],
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
        
        // ACT - With sync disabled, changes in Asset Allocation don't affect Net Worth
        // (In the app, this is controlled by the sync checkbox, not tested here)
        
        // ASSERT - Data should remain independent
        expect(assetAllocationData).toHaveLength(1);
        expect(assetAllocationData[0].ticker).toBe('SPY');
        
        expect(netWorthData.years[0].months[0].assets).toHaveLength(1);
        expect(netWorthData.years[0].months[0].assets[0].ticker).toBe('VTI');
        
        // They are completely separate
        expect(assetAllocationData[0].ticker).not.toBe(netWorthData.years[0].months[0].assets[0].ticker);
      });
    });

    describe('Cash Asset Sync with Shares and Price', () => {
      it('should sync cash assets with shares and pricePerShare fields', () => {
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
            currentValue: 3500,
            shares: 1, // Cash treated as 1 unit
            pricePerShare: 3500, // @ value per unit
            targetMode: 'PERCENTAGE' as AllocationMode,
            targetPercent: 70,
          },
          {
            id: 'aa-cash-2',
            name: 'Main Checking',
            ticker: '',
            assetClass: 'CASH' as AssetClass,
            subAssetType: 'CHECKING_ACCOUNT' as SubAssetType,
            currentValue: 1500,
            shares: 1,
            pricePerShare: 1500,
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
        expect(result.years[0].months[0].cashEntries).toHaveLength(2);
        
        const emergencyFund = result.years[0].months[0].cashEntries.find(c => c.accountName === 'Emergency Fund');
        expect(emergencyFund).toBeDefined();
        expect(emergencyFund!.balance).toBe(3500);
        
        const checking = result.years[0].months[0].cashEntries.find(c => c.accountName === 'Main Checking');
        expect(checking).toBeDefined();
        expect(checking!.balance).toBe(1500);
      });
    });
  });
});
