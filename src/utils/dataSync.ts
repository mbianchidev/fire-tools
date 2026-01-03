/**
 * Data Sync Utilities
 * Handles bidirectional data synchronization between Asset Allocation Manager 
 * and Net Worth Tracker for the current month
 */

import { Asset, AssetClass, SubAssetType } from '../types/assetAllocation';
import { 
  NetWorthTrackerData, 
  AssetHolding, 
  CashEntry, 
  generateNetWorthId,
  createEmptyMonthlySnapshot,
  createEmptyNetWorthYearData,
} from '../types/netWorthTracker';
import { SupportedCurrency } from '../types/currency';

/**
 * Maps Asset Allocation asset class to Net Worth asset class
 */
function mapAssetClassToNetWorth(assetClass: AssetClass): AssetHolding['assetClass'] {
  switch (assetClass) {
    case 'STOCKS':
      return 'STOCKS';
    case 'BONDS':
      return 'BONDS';
    case 'CRYPTO':
      return 'CRYPTO';
    case 'REAL_ESTATE':
      return 'REAL_ESTATE';
    case 'CASH':
      return 'OTHER'; // Cash handled separately
    default:
      return 'OTHER';
  }
}

/**
 * Maps SubAssetType to determine if asset should be treated as cash
 */
function isCashAsset(subAssetType: SubAssetType): boolean {
  return [
    'SAVINGS_ACCOUNT',
    'CHECKING_ACCOUNT',
    'BROKERAGE_ACCOUNT',
    'MONEY_ETF',
  ].includes(subAssetType);
}

/**
 * Maps Asset Allocation SubAssetType to Net Worth CashEntry account type
 */
function mapSubAssetTypeToCashAccountType(subAssetType: SubAssetType): CashEntry['accountType'] {
  switch (subAssetType) {
    case 'SAVINGS_ACCOUNT':
      return 'SAVINGS';
    case 'CHECKING_ACCOUNT':
      return 'CHECKING';
    case 'BROKERAGE_ACCOUNT':
      return 'BROKERAGE';
    case 'MONEY_ETF':
      return 'BROKERAGE';
    default:
      return 'OTHER';
  }
}

/**
 * Syncs asset allocation data to net worth tracker for the current month
 * 
 * Rules:
 * - Only syncs to the current month (currentYear/currentMonth)
 * - Assets (non-cash) are converted to AssetHolding with price = currentValue, shares = 1
 * - Cash assets are converted to CashEntry
 * - Existing data in current month is replaced (overwritten)
 * - Other months remain unchanged
 * 
 * @param assetAllocationData - Array of assets from Asset Allocation Manager
 * @param netWorthData - Current Net Worth Tracker data
 * @returns Updated Net Worth Tracker data with synced current month
 */
export function syncAssetAllocationToNetWorth(
  assetAllocationData: Asset[],
  netWorthData: NetWorthTrackerData
): NetWorthTrackerData {
  const result = JSON.parse(JSON.stringify(netWorthData)) as NetWorthTrackerData;
  
  // Find or create current year
  let yearData = result.years.find(y => y.year === result.currentYear);
  if (!yearData) {
    yearData = createEmptyNetWorthYearData(result.currentYear);
    result.years.push(yearData);
    result.years.sort((a, b) => a.year - b.year);
  }
  
  // Find or create current month
  let monthData = yearData.months.find(m => m.month === result.currentMonth);
  if (!monthData) {
    monthData = createEmptyMonthlySnapshot(result.currentYear, result.currentMonth);
    yearData.months.push(monthData);
    yearData.months.sort((a, b) => a.month - b.month);
  }
  
  // Clear existing assets and cash for sync
  const newAssets: AssetHolding[] = [];
  const newCashEntries: CashEntry[] = [];
  
  // Process each asset from Asset Allocation
  for (const asset of assetAllocationData) {
    if (asset.assetClass === 'CASH' || isCashAsset(asset.subAssetType)) {
      // Convert to cash entry
      const cashEntry: CashEntry = {
        id: generateNetWorthId(),
        accountName: asset.name,
        accountType: mapSubAssetTypeToCashAccountType(asset.subAssetType),
        balance: asset.currentValue,
        currency: (asset.originalCurrency || 'EUR') as SupportedCurrency,
      };
      newCashEntries.push(cashEntry);
    } else {
      // Convert to asset holding
      // Use shares = 1 and price = currentValue for simplicity
      const assetHolding: AssetHolding = {
        id: generateNetWorthId(),
        ticker: asset.ticker || asset.name.substring(0, 5).toUpperCase(),
        name: asset.name,
        shares: 1,
        pricePerShare: asset.currentValue,
        currency: (asset.originalCurrency || 'EUR') as SupportedCurrency,
        assetClass: mapAssetClassToNetWorth(asset.assetClass),
      };
      newAssets.push(assetHolding);
    }
  }
  
  // Replace current month data
  monthData.assets = newAssets;
  monthData.cashEntries = newCashEntries;
  // Keep pensions and operations unchanged
  
  return result;
}

/**
 * Syncs net worth tracker data to asset allocation for the current month
 * 
 * Rules:
 * - Only syncs from the current month (currentYear/currentMonth)
 * - AssetHolding are converted to Assets with currentValue = shares * pricePerShare
 * - CashEntry are converted to Cash assets
 * - Existing asset allocation data is replaced (overwritten)
 * 
 * @param netWorthData - Current Net Worth Tracker data
 * @returns Array of assets for Asset Allocation Manager
 */
export function syncNetWorthToAssetAllocation(
  netWorthData: NetWorthTrackerData
): Asset[] {
  // Find current month data
  const yearData = netWorthData.years.find(y => y.year === netWorthData.currentYear);
  if (!yearData) {
    return [];
  }
  
  const monthData = yearData.months.find(m => m.month === netWorthData.currentMonth);
  if (!monthData) {
    return [];
  }
  
  const assets: Asset[] = [];
  
  // Convert asset holdings to assets
  for (const holding of monthData.assets) {
    const asset: Asset = {
      id: holding.id,
      name: holding.name,
      ticker: holding.ticker,
      assetClass: holding.assetClass === 'ETF' ? 'STOCKS' : holding.assetClass as AssetClass,
      subAssetType: 'ETF' as SubAssetType, // Default to ETF for non-cash
      currentValue: holding.shares * holding.pricePerShare,
      originalCurrency: holding.currency as SupportedCurrency,
      originalValue: holding.shares * holding.pricePerShare,
      targetMode: 'OFF', // Default to OFF, user must configure
    };
    assets.push(asset);
  }
  
  // Convert cash entries to assets
  for (const cashEntry of monthData.cashEntries) {
    const subAssetType: SubAssetType = 
      cashEntry.accountType === 'SAVINGS' ? 'SAVINGS_ACCOUNT' :
      cashEntry.accountType === 'CHECKING' ? 'CHECKING_ACCOUNT' :
      cashEntry.accountType === 'BROKERAGE' ? 'BROKERAGE_ACCOUNT' :
      'SAVINGS_ACCOUNT';
    
    const asset: Asset = {
      id: cashEntry.id,
      name: cashEntry.accountName,
      ticker: '',
      assetClass: 'CASH',
      subAssetType,
      currentValue: cashEntry.balance,
      originalCurrency: cashEntry.currency as SupportedCurrency,
      originalValue: cashEntry.balance,
      targetMode: 'OFF', // Default to OFF, user must configure
    };
    assets.push(asset);
  }
  
  return assets;
}
