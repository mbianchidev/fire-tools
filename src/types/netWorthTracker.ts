/**
 * Net Worth Tracker Types
 * Data model for tracking historical net worth on a monthly basis
 */

import { SupportedCurrency } from './currency';

// Asset entry with share count
export interface AssetHolding {
  id: string;
  ticker: string;
  name: string;
  shares: number; // Number of shares owned
  pricePerShare: number; // Price per share at the time of entry
  currency: SupportedCurrency;
  assetClass: 'STOCKS' | 'BONDS' | 'ETF' | 'CRYPTO' | 'REAL_ESTATE' | 'OTHER';
  note?: string;
  // Sync metadata (hidden from UI, preserved during sync)
  targetMode?: 'PERCENTAGE' | 'OFF' | 'SET';
  targetPercent?: number;
  targetValue?: number;
  syncAssetClass?: 'STOCKS' | 'BONDS' | 'CASH' | 'CRYPTO' | 'REAL_ESTATE';
  syncSubAssetType?: string;
  isin?: string;
}

// Cash/liquidity entry
export interface CashEntry {
  id: string;
  accountName: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'BROKERAGE' | 'CREDIT_CARD' | 'OTHER';
  balance: number;
  currency: SupportedCurrency;
  note?: string;
  // Sync metadata (hidden from UI, preserved during sync)
  shares?: number; // For cash treated as "1 share @ balance per share"
  pricePerShare?: number;
  targetMode?: 'PERCENTAGE' | 'OFF' | 'SET';
  targetPercent?: number;
  targetValue?: number;
  syncSubAssetType?: string;
}

// Pension entry
export interface PensionEntry {
  id: string;
  name: string;
  currentValue: number;
  currency: SupportedCurrency;
  pensionType: 'STATE' | 'PRIVATE' | 'EMPLOYER' | 'OTHER';
  note?: string;
}

// Financial operation types
export type OperationType = 
  | 'PURCHASE' // Stock/bond/ETF purchase
  | 'SALE' // Asset sale
  | 'DIVIDEND' // Dividend received
  | 'EXPENSE_REIMBURSEMENT' // Expenses reimbursed
  | 'GIFT_RECEIVED' // Gift received
  | 'GIFT_GIVEN' // Gift given
  | 'TAX_PAID' // Taxes paid
  | 'CASH_TRANSFER' // Cash transfer between accounts
  | 'PENSION_CONTRIBUTION' // Contribution to pension
  | 'PENSION_ADJUSTMENT' // Pension value adjustment
  | 'PRICE_UPDATE' // Asset price update
  | 'OTHER';

// Financial operation entry
export interface FinancialOperation {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  type: OperationType;
  description: string;
  amount: number;
  currency: SupportedCurrency;
  relatedAssetId?: string; // Link to asset if applicable
  relatedAccountId?: string; // Link to cash account if applicable
  note?: string;
}

// Monthly snapshot of net worth
export interface MonthlySnapshot {
  year: number;
  month: number; // 1-12
  
  // Manual inputs
  assets: AssetHolding[];
  cashEntries: CashEntry[];
  pensions: PensionEntry[];
  operations: FinancialOperation[];
  
  // Calculated values (computed at display time)
  totalAssetValue?: number; // Sum of (shares * pricePerShare) for all assets
  totalCash?: number; // Sum of all cash balances
  totalPension?: number; // Sum of all pension values
  totalTaxesPaid?: number; // Sum of TAX_PAID operations
  netWorth?: number; // totalAssetValue + totalCash + totalPension - totalTaxesPaid
  
  // Status
  isFrozen: boolean; // True if month has ended and values are finalized
  frozenDate?: string; // ISO date when month was frozen
  
  // Notes
  monthNote?: string;
}

// Year data container
export interface NetWorthYearData {
  year: number;
  months: MonthlySnapshot[];
  isArchived?: boolean;
}

// YTD summary
export interface YTDSummary {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  averageMonthlyNetWorth: number;
  netWorthChange: number;
  netWorthChangePercent: number;
}

// Month-over-month variation
export interface MonthlyVariation {
  month: string;
  netWorth: number;
  changeFromPrevMonth: number;
  changePercent: number;
  assetValueChange: number;
  cashChange: number;
  pensionChange: number;
}

// Forecast data
export interface NetWorthForecast {
  month: string;
  projectedNetWorth: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  basedOnMonths: number; // Number of months used for projection
}

// Chart data for multi-currency display
export interface NetWorthChartData {
  month: string;
  netWorth: number;
  currency: SupportedCurrency;
}

// FIRE progress calculation
export interface FIREProgress {
  currentNetWorth: number;
  fireTarget: number;
  percentToFire: number;
  projectedFireDate: string | null;
  yearsToFire: number | null;
}

// Main net worth tracker state
export interface NetWorthTrackerData {
  years: NetWorthYearData[];
  currentYear: number;
  currentMonth: number;
  defaultCurrency: SupportedCurrency;
  // Settings
  settings: {
    showPensionInNetWorth: boolean;
    includeUnrealizedGains: boolean;
    syncWithAssetAllocation?: boolean; // When true, sync current month with Asset Allocation Manager
  };
}

// Helper functions

/**
 * Generate unique ID for entries
 */
export function generateNetWorthId(): string {
  return `nw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty monthly snapshot
 */
export function createEmptyMonthlySnapshot(year: number, month: number): MonthlySnapshot {
  return {
    year,
    month,
    assets: [],
    cashEntries: [],
    pensions: [],
    operations: [],
    isFrozen: false,
  };
}

/**
 * Create empty year data
 */
export function createEmptyNetWorthYearData(year: number): NetWorthYearData {
  return {
    year,
    months: [],
    isArchived: false,
  };
}

/**
 * Get month key for storage/lookup
 */
export function getNetWorthMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Operation type display info
export interface OperationTypeInfo {
  id: OperationType;
  name: string;
  icon: string;
  isIncome: boolean; // True if operation adds to net worth
}

export const OPERATION_TYPES: OperationTypeInfo[] = [
  { id: 'PURCHASE', name: 'Asset Purchase', icon: '📈', isIncome: false },
  { id: 'SALE', name: 'Asset Sale', icon: '📉', isIncome: true },
  { id: 'DIVIDEND', name: 'Dividend Received', icon: '💵', isIncome: true },
  { id: 'EXPENSE_REIMBURSEMENT', name: 'Expense Reimbursement', icon: '💳', isIncome: true },
  { id: 'GIFT_RECEIVED', name: 'Gift Received', icon: '🎁', isIncome: true },
  { id: 'GIFT_GIVEN', name: 'Gift Given', icon: '🎁', isIncome: false },
  { id: 'TAX_PAID', name: 'Tax Paid', icon: '🏛️', isIncome: false },
  { id: 'CASH_TRANSFER', name: 'Cash Transfer', icon: '🔄', isIncome: false },
  { id: 'PENSION_CONTRIBUTION', name: 'Pension Contribution', icon: '🧓', isIncome: false },
  { id: 'PENSION_ADJUSTMENT', name: 'Pension Adjustment', icon: '📊', isIncome: false },
  { id: 'PRICE_UPDATE', name: 'Price Update', icon: '💹', isIncome: false },
  { id: 'OTHER', name: 'Other', icon: '📝', isIncome: false },
];

/**
 * Get operation type info
 */
export function getOperationTypeInfo(type: OperationType): OperationTypeInfo {
  return OPERATION_TYPES.find(t => t.id === type) || OPERATION_TYPES[OPERATION_TYPES.length - 1];
}

// Asset class display info
export interface AssetClassInfo {
  id: AssetHolding['assetClass'];
  name: string;
  icon: string;
}

export const ASSET_CLASSES: AssetClassInfo[] = [
  { id: 'STOCKS', name: 'Stocks', icon: '📊' },
  { id: 'BONDS', name: 'Bonds', icon: '📜' },
  { id: 'ETF', name: 'ETF', icon: '📈' },
  { id: 'CRYPTO', name: 'Crypto', icon: '₿' },
  { id: 'REAL_ESTATE', name: 'Real Estate', icon: '🏠' },
  { id: 'OTHER', name: 'Other', icon: '📦' },
];

// Account type display info
export interface AccountTypeInfo {
  id: CashEntry['accountType'];
  name: string;
  icon: string;
}

export const ACCOUNT_TYPES: AccountTypeInfo[] = [
  { id: 'SAVINGS', name: 'Savings Account', icon: '🏦' },
  { id: 'CHECKING', name: 'Checking Account', icon: '💳' },
  { id: 'BROKERAGE', name: 'Brokerage Account', icon: '📈' },
  { id: 'CREDIT_CARD', name: 'Credit Card', icon: '💳' },
  { id: 'OTHER', name: 'Other', icon: '💰' },
];

// Pension type display info
export interface PensionTypeInfo {
  id: PensionEntry['pensionType'];
  name: string;
  icon: string;
}

export const PENSION_TYPES: PensionTypeInfo[] = [
  { id: 'STATE', name: 'State Pension', icon: '🏛️' },
  { id: 'PRIVATE', name: 'Private Pension', icon: '🏦' },
  { id: 'EMPLOYER', name: 'Employer Pension', icon: '🏢' },
  { id: 'OTHER', name: 'Other Pension', icon: '🧓' },
];
