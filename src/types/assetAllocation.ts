/**
 * Asset Allocation Manager Types
 */

import { SupportedCurrency } from './currency';

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
  | 'PRIVATE_EQUITY'
  | 'NONE';

export interface Asset {
  id: string;
  name: string;
  ticker: string;
  isin?: string; // ISIN code (required for ETF, SINGLE_STOCK, SINGLE_BOND, REIT, MONEY_ETF)
  assetClass: AssetClass;
  subAssetType: SubAssetType;
  currentValue: number; // Value in EUR (converted if entered in another currency)
  shares?: number; // Number of shares owned (optional, for stocks/ETFs/bonds)
  pricePerShare?: number; // Price per share (optional, for stocks/ETFs/bonds)
  originalCurrency?: SupportedCurrency; // The currency the value was originally entered in (defaults to EUR)
  originalValue?: number; // The original value before conversion to EUR
  targetMode: AllocationMode;
  targetValue?: number; // For SET mode (fixed amount in EUR)
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
  totalValue: number; // Portfolio value excluding cash (used for calculations)
  totalHoldings: number; // Total holdings including cash (for display)
  deltas: AllocationDelta[];
  isValid: boolean;
  validationErrors: string[];
}

export interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
  ticker?: string; // Used as fallback label for long asset names in charts
  [key: string]: string | number | undefined;
}

export interface AssetAllocationConfig {
  currency: string; // Default EUR
  allowNegativeCash: boolean;
  targetAllocationTolerance: number; // e.g., 2% tolerance
}
