/**
 * Net Worth Calculator Utilities
 * Functions for calculating net worth, YTD summaries, variations, and forecasts
 */

import {
  MonthlySnapshot,
  YTDSummary,
  MonthlyVariation,
  NetWorthForecast,
  FIREProgress,
} from '../types/netWorthTracker';
import { DEFAULT_FALLBACK_RATES, SupportedCurrency } from '../types/currency';

// Options for net worth calculation
export interface NetWorthCalculationOptions {
  includePension?: boolean;
  targetCurrency?: SupportedCurrency;
}

// Result of monthly net worth calculation
export interface MonthlyNetWorthResult {
  totalAssetValue: number;
  totalCash: number;
  totalPension: number;
  totalTaxesPaid: number;
  netWorth: number;
}

/**
 * Convert amount from one currency to EUR
 */
function convertToEUR(amount: number, currency: SupportedCurrency): number {
  if (currency === 'EUR') return amount;
  const rate = DEFAULT_FALLBACK_RATES[currency] || 1;
  return amount * rate;
}

/**
 * Calculate net worth for a single monthly snapshot
 */
export function calculateMonthlyNetWorth(
  snapshot: MonthlySnapshot,
  options: NetWorthCalculationOptions = {}
): MonthlyNetWorthResult {
  const { includePension = true } = options;

  // Calculate total asset value (shares * price, converted to EUR)
  const totalAssetValue = snapshot.assets.reduce((sum, asset) => {
    const valueInOriginalCurrency = asset.shares * asset.pricePerShare;
    return sum + convertToEUR(valueInOriginalCurrency, asset.currency);
  }, 0);

  // Calculate total cash (converted to EUR)
  const totalCash = snapshot.cashEntries.reduce((sum, entry) => {
    return sum + convertToEUR(entry.balance, entry.currency);
  }, 0);

  // Calculate total pension (converted to EUR)
  const totalPension = includePension
    ? snapshot.pensions.reduce((sum, pension) => {
        return sum + convertToEUR(pension.currentValue, pension.currency);
      }, 0)
    : 0;

  // Calculate total taxes paid from operations
  const totalTaxesPaid = snapshot.operations
    .filter((op) => op.type === 'TAX_PAID')
    .reduce((sum, op) => sum + convertToEUR(op.amount, op.currency), 0);

  // Net worth = assets + cash + pension - taxes
  // Note: Taxes are typically already deducted from cash/income, so we don't subtract again
  // unless tracking separately. For simplicity, net worth = assets + cash + pension
  const netWorth = totalAssetValue + totalCash + totalPension;

  return {
    totalAssetValue,
    totalCash,
    totalPension,
    totalTaxesPaid,
    netWorth,
  };
}

/**
 * Calculate Year-to-Date summary from array of monthly snapshots
 */
export function calculateYTDSummary(
  snapshots: MonthlySnapshot[],
  upToMonth: number
): YTDSummary {
  if (snapshots.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      savingsRate: 0,
      averageMonthlyNetWorth: 0,
      netWorthChange: 0,
      netWorthChangePercent: 0,
    };
  }

  // Filter to only include months up to specified month
  const relevantSnapshots = snapshots
    .filter((s) => s.month <= upToMonth)
    .sort((a, b) => a.month - b.month);

  if (relevantSnapshots.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      savingsRate: 0,
      averageMonthlyNetWorth: 0,
      netWorthChange: 0,
      netWorthChangePercent: 0,
    };
  }

  // Calculate net worth for each month
  const monthlyNetWorths = relevantSnapshots.map((s) => calculateMonthlyNetWorth(s).netWorth);

  // Calculate average
  const averageMonthlyNetWorth =
    monthlyNetWorths.reduce((sum, nw) => sum + nw, 0) / monthlyNetWorths.length;

  // Calculate change from first to last month
  const firstNetWorth = monthlyNetWorths[0];
  const lastNetWorth = monthlyNetWorths[monthlyNetWorths.length - 1];
  const netWorthChange = lastNetWorth - firstNetWorth;
  const netWorthChangePercent =
    firstNetWorth > 0 ? (netWorthChange / firstNetWorth) * 100 : 0;

  // Calculate income/expenses from operations (simplified)
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const snapshot of relevantSnapshots) {
    for (const op of snapshot.operations) {
      const amount = convertToEUR(op.amount, op.currency);
      if (
        op.type === 'DIVIDEND' ||
        op.type === 'SALE' ||
        op.type === 'EXPENSE_REIMBURSEMENT' ||
        op.type === 'GIFT_RECEIVED'
      ) {
        totalIncome += amount;
      } else if (
        op.type === 'TAX_PAID' ||
        op.type === 'GIFT_GIVEN' ||
        op.type === 'PURCHASE'
      ) {
        totalExpenses += amount;
      }
    }
  }

  const totalSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    averageMonthlyNetWorth,
    netWorthChange,
    netWorthChangePercent,
  };
}

/**
 * Calculate month-over-month variations
 */
export function calculateMonthlyVariations(
  snapshots: MonthlySnapshot[]
): MonthlyVariation[] {
  if (snapshots.length === 0) {
    return [];
  }

  // Sort by year and month
  const sorted = [...snapshots].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const variations: MonthlyVariation[] = [];
  let prevResult: MonthlyNetWorthResult | null = null;

  for (const snapshot of sorted) {
    const result = calculateMonthlyNetWorth(snapshot);
    const monthLabel = formatMonthLabel(snapshot.year, snapshot.month);

    if (prevResult === null) {
      // First month - no previous to compare
      variations.push({
        month: monthLabel,
        netWorth: result.netWorth,
        changeFromPrevMonth: 0,
        changePercent: 0,
        assetValueChange: 0,
        cashChange: 0,
        pensionChange: 0,
      });
    } else {
      const changeFromPrevMonth = result.netWorth - prevResult.netWorth;
      const changePercent =
        prevResult.netWorth > 0
          ? (changeFromPrevMonth / prevResult.netWorth) * 100
          : 0;

      variations.push({
        month: monthLabel,
        netWorth: result.netWorth,
        changeFromPrevMonth,
        changePercent,
        assetValueChange: result.totalAssetValue - prevResult.totalAssetValue,
        cashChange: result.totalCash - prevResult.totalCash,
        pensionChange: result.totalPension - prevResult.totalPension,
      });
    }

    prevResult = result;
  }

  return variations;
}

/**
 * Format month label (e.g., "Jan 2024")
 */
function formatMonthLabel(year: number, month: number): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${monthNames[month - 1]} ${year}`;
}

/**
 * Calculate net worth forecast based on historical data
 */
export function calculateNetWorthForecast(
  snapshots: MonthlySnapshot[],
  monthsToForecast: number
): NetWorthForecast[] {
  // Need at least 2 months of data for trend calculation
  if (snapshots.length < 2) {
    return [];
  }

  // Sort by date
  const sorted = [...snapshots].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Calculate net worth for each month
  const netWorths = sorted.map((s) => ({
    year: s.year,
    month: s.month,
    netWorth: calculateMonthlyNetWorth(s).netWorth,
  }));

  // Calculate average monthly change (simple linear regression)
  let totalChange = 0;
  for (let i = 1; i < netWorths.length; i++) {
    totalChange += netWorths[i].netWorth - netWorths[i - 1].netWorth;
  }
  const avgMonthlyChange = totalChange / (netWorths.length - 1);

  // Determine confidence level based on data consistency
  const changes = netWorths.slice(1).map((nw, i) => nw.netWorth - netWorths[i].netWorth);
  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const variance = changes.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / changes.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgChange !== 0 ? Math.abs(stdDev / avgChange) : 1;

  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  if (coefficientOfVariation < 0.3 && snapshots.length >= 24) {
    confidenceLevel = 'HIGH';
  } else if (snapshots.length >= 6) {
    confidenceLevel = 'MEDIUM';
  } else {
    confidenceLevel = 'LOW';
  }

  // Generate forecasts
  const forecasts: NetWorthForecast[] = [];
  const lastEntry = netWorths[netWorths.length - 1];
  let currentYear = lastEntry.year;
  let currentMonth = lastEntry.month;
  let currentNetWorth = lastEntry.netWorth;

  for (let i = 0; i < monthsToForecast; i++) {
    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }

    currentNetWorth += avgMonthlyChange;

    forecasts.push({
      month: formatMonthLabel(currentYear, currentMonth),
      projectedNetWorth: Math.round(currentNetWorth),
      confidenceLevel,
      basedOnMonths: snapshots.length,
    });
  }

  return forecasts;
}

/**
 * Calculate FIRE progress based on current net worth and target
 */
export function calculateFIREProgress(
  currentNetWorth: number,
  fireTarget: number,
  _withdrawalRate: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  annualSavings?: number,
  expectedReturn?: number
): FIREProgress {
  // Calculate percent to FIRE
  const percentToFire = fireTarget > 0 ? (currentNetWorth / fireTarget) * 100 : 0;

  // If no savings info provided, can't calculate projected date
  if (annualSavings === undefined || expectedReturn === undefined) {
    return {
      currentNetWorth,
      fireTarget,
      percentToFire,
      projectedFireDate: null,
      yearsToFire: null,
    };
  }

  // Already at FIRE
  if (currentNetWorth >= fireTarget) {
    return {
      currentNetWorth,
      fireTarget,
      percentToFire,
      projectedFireDate: new Date().toISOString().split('T')[0],
      yearsToFire: 0,
    };
  }

  // Calculate years to FIRE using future value formula
  // FV = PV * (1 + r)^n + PMT * ((1 + r)^n - 1) / r
  // Solve for n when FV = fireTarget
  
  // Using iterative approach for simplicity
  let years = 0;
  let portfolio = currentNetWorth;
  const maxYears = 100;

  while (portfolio < fireTarget && years < maxYears) {
    portfolio = portfolio * (1 + expectedReturn) + annualSavings;
    years++;
  }

  if (years >= maxYears) {
    return {
      currentNetWorth,
      fireTarget,
      percentToFire,
      projectedFireDate: null,
      yearsToFire: null,
    };
  }

  // Calculate projected date
  const projectedDate = new Date();
  projectedDate.setFullYear(projectedDate.getFullYear() + years);

  return {
    currentNetWorth,
    fireTarget,
    percentToFire,
    projectedFireDate: projectedDate.toISOString().split('T')[0],
    yearsToFire: years,
  };
}

/**
 * Get the previous year's December snapshot value for comparison
 */
export function getPreviousYearEndValue(
  allYears: { year: number; months: MonthlySnapshot[] }[],
  currentYear: number
): number | null {
  const prevYear = allYears.find((y) => y.year === currentYear - 1);
  if (!prevYear) return null;

  const december = prevYear.months.find((m) => m.month === 12);
  if (!december) return null;

  return calculateMonthlyNetWorth(december).netWorth;
}

/**
 * Calculate asset price variations (YTD and last month)
 */
export function calculateAssetPriceVariations(
  snapshots: MonthlySnapshot[],
  assetId: string
): { ytdVariation: number; lastMonthVariation: number } | null {
  if (snapshots.length < 2) return null;

  // Sort by date
  const sorted = [...snapshots].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Find asset in first and last snapshots
  const firstSnapshot = sorted[0];
  const lastSnapshot = sorted[sorted.length - 1];
  const prevSnapshot = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

  const firstAsset = firstSnapshot.assets.find((a) => a.id === assetId);
  const lastAsset = lastSnapshot.assets.find((a) => a.id === assetId);
  const prevAsset = prevSnapshot?.assets.find((a) => a.id === assetId);

  if (!firstAsset || !lastAsset) return null;

  const ytdVariation =
    firstAsset.pricePerShare > 0
      ? ((lastAsset.pricePerShare - firstAsset.pricePerShare) / firstAsset.pricePerShare) * 100
      : 0;

  const lastMonthVariation =
    prevAsset && prevAsset.pricePerShare > 0
      ? ((lastAsset.pricePerShare - prevAsset.pricePerShare) / prevAsset.pricePerShare) * 100
      : 0;

  return { ytdVariation, lastMonthVariation };
}
