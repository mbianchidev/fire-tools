/**
 * Asset Allocation Manager Types
 */

export type AllocationMode = 'PERCENTAGE' | 'OFF' | 'SET';

export type AssetClass = 'STOCKS' | 'BONDS' | 'CASH' | 'CRYPTO' | 'REAL_ESTATE';

export type SubAssetType = 
  | 'ETF' 
  | 'SINGLE_STOCK' 
  | 'SINGLE_BOND' 
  | 'SAVINGS_ACCOUNT'
  | 'CHECKING_ACCOUNT'
  | 'BROKERAGE_ACCOUNT'
  | 'MONEY_ETF'
  | 'COIN'
  | 'PROPERTY'
  | 'REIT'
  | 'NONE';

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  assetClass: AssetClass;
  subAssetType: SubAssetType;
  currentValue: number;
  targetMode: AllocationMode;
  targetValue?: number; // For SET mode (fixed amount)
  targetPercent?: number; // For PERCENTAGE mode
}

export interface AssetClassSummary {
  assetClass: AssetClass;
  assets: Asset[];
  currentTotal: number;
  currentPercent: number;
  targetMode: AllocationMode;
  targetPercent?: number;
  targetTotal?: number;
  delta: number;
  action: AllocationAction;
}

export type AllocationAction = 'BUY' | 'SELL' | 'SAVE' | 'INVEST' | 'HOLD' | 'EXCLUDED';

export interface AllocationDelta {
  assetId: string;
  currentValue: number;
  currentPercent: number;
  currentPercentInClass: number;
  targetValue: number;
  targetPercent: number;
  delta: number;
  deltaPercent: number;
  action: AllocationAction;
}

export interface PortfolioAllocation {
  assets: Asset[];
  assetClasses: AssetClassSummary[];
  totalValue: number;
  deltas: AllocationDelta[];
  isValid: boolean;
  validationErrors: string[];
}

export interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  [key: string]: string | number | undefined;
}

export interface AssetAllocationConfig {
  currency: string; // Default EUR
  allowNegativeCash: boolean;
  targetAllocationTolerance: number; // e.g., 2% tolerance
}
