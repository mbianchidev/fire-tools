/**
 * Integration utilities between Expense Tracker and FIRE Calculator
 * Provides functions to calculate income and expenses from expense tracker data
 */

import { ExpenseTrackerData } from '../types/expenseTracker';
import { loadExpenseTrackerData } from './cookieStorage';

/**
 * Get the last 12 months of expense data from the expense tracker
 * @param expenseTrackerData - Optional expense tracker data to use, if not provided will load from cookies
 * @returns Object with total expenses and total income from last 12 months
 */
export function getLast12MonthsData(expenseTrackerData?: ExpenseTrackerData | null): {
  totalExpenses: number;
  totalIncome: number;
  monthsCount: number;
} {
  // Load data if not provided
  const data = expenseTrackerData ?? loadExpenseTrackerData();
  
  if (!data || data.years.length === 0) {
    return { totalExpenses: 0, totalIncome: 0, monthsCount: 0 };
  }
  
  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  // Calculate which months we need (last 12 months including current)
  const monthsToInclude: Array<{ year: number; month: number }> = [];
  
  for (let i = 0; i < 12; i++) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    if (targetMonth <= 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    monthsToInclude.push({ year: targetYear, month: targetMonth });
  }
  
  // Collect all transactions from these months
  let totalExpenses = 0;
  let totalIncome = 0;
  let monthsFound = 0;
  
  for (const { year, month } of monthsToInclude) {
    const yearData = data.years.find(y => y.year === year);
    if (!yearData) continue;
    
    const monthData = yearData.months.find(m => m.month === month);
    if (!monthData) continue;
    
    monthsFound++;
    
    // Sum expenses
    for (const expense of monthData.expenses) {
      totalExpenses += expense.amount;
    }
    
    // Sum income
    for (const income of monthData.incomes) {
      totalIncome += income.amount;
    }
  }
  
  return {
    totalExpenses,
    totalIncome,
    monthsCount: monthsFound,
  };
}

/**
 * Calculate annual expenses from expense tracker data (last 12 months)
 * Adjusts for inflation if fewer than 12 months of data available
 * @param expenseTrackerData - Optional expense tracker data to use
 * @param inflationRate - Inflation rate to use for projection (as percentage, e.g., 2 for 2%)
 * @returns Calculated annual expenses
 */
export function calculateAnnualExpensesFromTracker(
  expenseTrackerData?: ExpenseTrackerData | null,
  inflationRate: number = 2
): number {
  const { totalExpenses, monthsCount } = getLast12MonthsData(expenseTrackerData);
  
  if (monthsCount === 0) {
    return 0;
  }
  
  // If we have exactly 12 months, return the total
  if (monthsCount === 12) {
    return totalExpenses;
  }
  
  // Otherwise, calculate monthly average and project to annual with inflation adjustment
  const monthlyAverage = totalExpenses / monthsCount;
  const annualProjection = monthlyAverage * 12;
  
  // Apply inflation adjustment for partial data
  // (Assumes data might be from earlier months)
  const inflationMultiplier = 1 + (inflationRate / 100);
  return annualProjection * inflationMultiplier;
}

/**
 * Calculate annual labor income from expense tracker data (last 12 months)
 * Adjusts based on labor income growth rate if fewer than 12 months available
 * @param expenseTrackerData - Optional expense tracker data to use
 * @param laborIncomeGrowthRate - Labor income growth rate (as percentage, e.g., 3 for 3%)
 * @returns Calculated annual labor income (NET)
 */
export function calculateAnnualIncomeFromTracker(
  expenseTrackerData?: ExpenseTrackerData | null,
  laborIncomeGrowthRate: number = 3
): number {
  const { totalIncome, monthsCount } = getLast12MonthsData(expenseTrackerData);
  
  if (monthsCount === 0) {
    return 0;
  }
  
  // If we have exactly 12 months, return the total
  if (monthsCount === 12) {
    return totalIncome;
  }
  
  // Otherwise, calculate monthly average and project to annual with growth adjustment
  const monthlyAverage = totalIncome / monthsCount;
  const annualProjection = monthlyAverage * 12;
  
  // Apply growth adjustment for partial data
  const growthMultiplier = 1 + (laborIncomeGrowthRate / 100);
  return annualProjection * growthMultiplier;
}
