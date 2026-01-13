import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLast12MonthsData,
  calculateAnnualExpensesFromTracker,
  calculateAnnualIncomeFromTracker,
} from '../../src/utils/expenseTrackerIntegration';
import { ExpenseTrackerData, YearData, MonthData } from '../../src/types/expenseTracker';
import * as cookieStorage from '../../src/utils/cookieStorage';

// Mock the cookieStorage module
vi.mock('../../src/utils/cookieStorage', () => ({
  loadExpenseTrackerData: vi.fn(),
}));

// Helper function to create expense tracker data
function createExpenseTrackerData(
  yearsData: Array<{ year: number; months: Array<{ month: number; expenses: number; income: number }> }>
): ExpenseTrackerData {
  const years: YearData[] = yearsData.map(yearInfo => ({
    year: yearInfo.year,
    months: yearInfo.months.map(monthInfo => ({
      year: yearInfo.year,
      month: monthInfo.month,
      expenses: [{
        id: `exp-${yearInfo.year}-${monthInfo.month}`,
        date: `${yearInfo.year}-${String(monthInfo.month).padStart(2, '0')}-15`,
        amount: monthInfo.expenses,
        description: 'Test expense',
        type: 'expense' as const,
        category: 'OTHER' as const,
        expenseType: 'WANT' as const,
      }],
      incomes: [{
        id: `inc-${yearInfo.year}-${monthInfo.month}`,
        date: `${yearInfo.year}-${String(monthInfo.month).padStart(2, '0')}-15`,
        amount: monthInfo.income,
        description: 'Test income',
        type: 'income' as const,
        source: 'SALARY' as const,
      }],
      budgets: [],
    })),
  }));

  return {
    years,
    currentYear: yearsData[0]?.year || new Date().getFullYear(),
    currentMonth: 1,
    currency: 'EUR',
    globalBudgets: [],
  };
}

// Helper to create empty month data
function createEmptyMonthData(year: number, month: number): MonthData {
  return {
    year,
    month,
    incomes: [],
    expenses: [],
    budgets: [],
  };
}

describe('expenseTrackerIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date - use a fixed date for predictable tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getLast12MonthsData', () => {
    it('should return zeros when no data is provided and cookie storage is empty', () => {
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(null);

      const result = getLast12MonthsData();

      expect(result.totalExpenses).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.monthsCount).toBe(0);
    });

    it('should return zeros when data has no years', () => {
      const data: ExpenseTrackerData = {
        years: [],
        currentYear: 2024,
        currentMonth: 6,
        currency: 'EUR',
        globalBudgets: [],
      };

      const result = getLast12MonthsData(data);

      expect(result.totalExpenses).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.monthsCount).toBe(0);
    });

    it('should sum expenses and income from last 12 months', () => {
      // Current date is June 2024, so last 12 months is July 2023 - June 2024
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
            { month: 2, expenses: 1200, income: 3000 },
            { month: 3, expenses: 1100, income: 3000 },
            { month: 4, expenses: 900, income: 3000 },
            { month: 5, expenses: 1300, income: 3000 },
            { month: 6, expenses: 1000, income: 3000 },
          ],
        },
        {
          year: 2023,
          months: [
            { month: 7, expenses: 1000, income: 3000 },
            { month: 8, expenses: 1000, income: 3000 },
            { month: 9, expenses: 1000, income: 3000 },
            { month: 10, expenses: 1000, income: 3000 },
            { month: 11, expenses: 1000, income: 3000 },
            { month: 12, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = getLast12MonthsData(data);

      expect(result.totalExpenses).toBe(12500); // Sum of all expenses
      expect(result.totalIncome).toBe(36000);   // Sum of all income
      expect(result.monthsCount).toBe(12);
    });

    it('should handle partial year data', () => {
      // Current date is June 2024, only provide 6 months of data
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
            { month: 2, expenses: 1000, income: 3000 },
            { month: 3, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = getLast12MonthsData(data);

      expect(result.totalExpenses).toBe(3000);
      expect(result.totalIncome).toBe(9000);
      expect(result.monthsCount).toBe(3);
    });

    it('should load data from cookies if not provided', () => {
      const mockData = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 6, expenses: 500, income: 2000 },
          ],
        },
      ]);
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(mockData);

      const result = getLast12MonthsData();

      expect(cookieStorage.loadExpenseTrackerData).toHaveBeenCalled();
      expect(result.totalExpenses).toBe(500);
      expect(result.totalIncome).toBe(2000);
      expect(result.monthsCount).toBe(1);
    });

    it('should handle year boundary correctly', () => {
      // Set date to January 2024, last 12 months spans 2023-2024
      vi.setSystemTime(new Date('2024-01-15'));

      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
          ],
        },
        {
          year: 2023,
          months: [
            { month: 2, expenses: 800, income: 2800 },
            { month: 3, expenses: 800, income: 2800 },
            { month: 4, expenses: 800, income: 2800 },
            { month: 5, expenses: 800, income: 2800 },
            { month: 6, expenses: 800, income: 2800 },
            { month: 7, expenses: 800, income: 2800 },
            { month: 8, expenses: 800, income: 2800 },
            { month: 9, expenses: 800, income: 2800 },
            { month: 10, expenses: 800, income: 2800 },
            { month: 11, expenses: 800, income: 2800 },
            { month: 12, expenses: 800, income: 2800 },
          ],
        },
      ]);

      const result = getLast12MonthsData(data);

      // Should include Jan 2024 + Feb-Dec 2023
      expect(result.monthsCount).toBe(12);
      expect(result.totalExpenses).toBe(1000 + 11 * 800); // Jan 2024 + 11 months from 2023
    });

    it('should handle multiple transactions per month', () => {
      const data: ExpenseTrackerData = {
        years: [{
          year: 2024,
          months: [{
            year: 2024,
            month: 6,
            expenses: [
              { id: 'e1', date: '2024-06-01', amount: 100, description: 'Exp 1', type: 'expense', category: 'GROCERIES', expenseType: 'NEED' },
              { id: 'e2', date: '2024-06-15', amount: 200, description: 'Exp 2', type: 'expense', category: 'DINING_OUT', expenseType: 'WANT' },
              { id: 'e3', date: '2024-06-30', amount: 300, description: 'Exp 3', type: 'expense', category: 'OTHER', expenseType: 'WANT' },
            ],
            incomes: [
              { id: 'i1', date: '2024-06-01', amount: 2000, description: 'Inc 1', type: 'income', source: 'SALARY' },
              { id: 'i2', date: '2024-06-15', amount: 500, description: 'Inc 2', type: 'income', source: 'BONUS' },
            ],
            budgets: [],
          }],
        }],
        currentYear: 2024,
        currentMonth: 6,
        currency: 'EUR',
        globalBudgets: [],
      };

      const result = getLast12MonthsData(data);

      expect(result.totalExpenses).toBe(600); // 100 + 200 + 300
      expect(result.totalIncome).toBe(2500);   // 2000 + 500
      expect(result.monthsCount).toBe(1);
    });

    it('should skip months that do not exist in data', () => {
      // Only have data for some months
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 2, expenses: 1000, income: 3000 },
            { month: 4, expenses: 1000, income: 3000 },
            { month: 6, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = getLast12MonthsData(data);

      expect(result.totalExpenses).toBe(3000);
      expect(result.totalIncome).toBe(9000);
      expect(result.monthsCount).toBe(3);
    });
  });

  describe('calculateAnnualExpensesFromTracker', () => {
    it('should return 0 when no data is available', () => {
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(null);

      const result = calculateAnnualExpensesFromTracker();

      expect(result).toBe(0);
    });

    it('should return total expenses for full 12 months of data', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
            { month: 2, expenses: 1000, income: 3000 },
            { month: 3, expenses: 1000, income: 3000 },
            { month: 4, expenses: 1000, income: 3000 },
            { month: 5, expenses: 1000, income: 3000 },
            { month: 6, expenses: 1000, income: 3000 },
          ],
        },
        {
          year: 2023,
          months: [
            { month: 7, expenses: 1000, income: 3000 },
            { month: 8, expenses: 1000, income: 3000 },
            { month: 9, expenses: 1000, income: 3000 },
            { month: 10, expenses: 1000, income: 3000 },
            { month: 11, expenses: 1000, income: 3000 },
            { month: 12, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = calculateAnnualExpensesFromTracker(data);

      expect(result).toBe(12000);
    });

    it('should project annual expenses with inflation for partial data', () => {
      // Only 6 months of data
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
            { month: 2, expenses: 1000, income: 3000 },
            { month: 3, expenses: 1000, income: 3000 },
            { month: 4, expenses: 1000, income: 3000 },
            { month: 5, expenses: 1000, income: 3000 },
            { month: 6, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = calculateAnnualExpensesFromTracker(data, 2);

      // Monthly average = 6000 / 6 = 1000
      // Annual projection = 1000 * 12 = 12000
      // With 2% inflation = 12000 * 1.02 = 12240
      expect(result).toBe(12240);
    });

    it('should use custom inflation rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
            { month: 2, expenses: 1000, income: 3000 },
            { month: 3, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = calculateAnnualExpensesFromTracker(data, 5);

      // Monthly average = 3000 / 3 = 1000
      // Annual projection = 1000 * 12 = 12000
      // With 5% inflation = 12000 * 1.05 = 12600
      expect(result).toBe(12600);
    });

    it('should default to 2% inflation rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = calculateAnnualExpensesFromTracker(data);

      // Monthly average = 1000 / 1 = 1000
      // Annual projection = 1000 * 12 = 12000
      // With default 2% inflation = 12000 * 1.02 = 12240
      expect(result).toBe(12240);
    });

    it('should handle zero inflation rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = calculateAnnualExpensesFromTracker(data, 0);

      // Monthly average = 1000 / 1 = 1000
      // Annual projection = 1000 * 12 = 12000
      // With 0% inflation = 12000 * 1.0 = 12000
      expect(result).toBe(12000);
    });

    it('should load data from cookies if not provided', () => {
      const mockData = createExpenseTrackerData([
        {
          year: 2024,
          months: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            expenses: 500,
            income: 2000,
          })),
        },
        {
          year: 2023,
          months: [
            { month: 7, expenses: 500, income: 2000 },
            { month: 8, expenses: 500, income: 2000 },
            { month: 9, expenses: 500, income: 2000 },
            { month: 10, expenses: 500, income: 2000 },
            { month: 11, expenses: 500, income: 2000 },
            { month: 12, expenses: 500, income: 2000 },
          ],
        },
      ]);
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(mockData);

      const result = calculateAnnualExpensesFromTracker();

      expect(cookieStorage.loadExpenseTrackerData).toHaveBeenCalled();
      expect(result).toBe(6000); // 500 * 12 months
    });
  });

  describe('calculateAnnualIncomeFromTracker', () => {
    it('should return 0 when no data is available', () => {
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(null);

      const result = calculateAnnualIncomeFromTracker();

      expect(result).toBe(0);
    });

    it('should return total income for full 12 months of data', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 3000 },
            { month: 2, expenses: 1000, income: 3000 },
            { month: 3, expenses: 1000, income: 3000 },
            { month: 4, expenses: 1000, income: 3000 },
            { month: 5, expenses: 1000, income: 3000 },
            { month: 6, expenses: 1000, income: 3000 },
          ],
        },
        {
          year: 2023,
          months: [
            { month: 7, expenses: 1000, income: 3000 },
            { month: 8, expenses: 1000, income: 3000 },
            { month: 9, expenses: 1000, income: 3000 },
            { month: 10, expenses: 1000, income: 3000 },
            { month: 11, expenses: 1000, income: 3000 },
            { month: 12, expenses: 1000, income: 3000 },
          ],
        },
      ]);

      const result = calculateAnnualIncomeFromTracker(data);

      expect(result).toBe(36000);
    });

    it('should project annual income with growth rate for partial data', () => {
      // Only 6 months of data
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 5000 },
            { month: 2, expenses: 1000, income: 5000 },
            { month: 3, expenses: 1000, income: 5000 },
            { month: 4, expenses: 1000, income: 5000 },
            { month: 5, expenses: 1000, income: 5000 },
            { month: 6, expenses: 1000, income: 5000 },
          ],
        },
      ]);

      const result = calculateAnnualIncomeFromTracker(data, 3);

      // Monthly average = 30000 / 6 = 5000
      // Annual projection = 5000 * 12 = 60000
      // With 3% growth = 60000 * 1.03 = 61800
      expect(result).toBe(61800);
    });

    it('should use custom growth rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 4000 },
            { month: 2, expenses: 1000, income: 4000 },
          ],
        },
      ]);

      const result = calculateAnnualIncomeFromTracker(data, 5);

      // Monthly average = 8000 / 2 = 4000
      // Annual projection = 4000 * 12 = 48000
      // With 5% growth = 48000 * 1.05 = 50400
      expect(result).toBe(50400);
    });

    it('should default to 3% labor income growth rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 5000 },
          ],
        },
      ]);

      const result = calculateAnnualIncomeFromTracker(data);

      // Monthly average = 5000 / 1 = 5000
      // Annual projection = 5000 * 12 = 60000
      // With default 3% growth = 60000 * 1.03 = 61800
      expect(result).toBe(61800);
    });

    it('should handle zero growth rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 5000 },
          ],
        },
      ]);

      const result = calculateAnnualIncomeFromTracker(data, 0);

      // Monthly average = 5000 / 1 = 5000
      // Annual projection = 5000 * 12 = 60000
      // With 0% growth = 60000 * 1.0 = 60000
      expect(result).toBe(60000);
    });

    it('should load data from cookies if not provided', () => {
      const mockData = createExpenseTrackerData([
        {
          year: 2024,
          months: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            expenses: 500,
            income: 2000,
          })),
        },
        {
          year: 2023,
          months: [
            { month: 7, expenses: 500, income: 2000 },
            { month: 8, expenses: 500, income: 2000 },
            { month: 9, expenses: 500, income: 2000 },
            { month: 10, expenses: 500, income: 2000 },
            { month: 11, expenses: 500, income: 2000 },
            { month: 12, expenses: 500, income: 2000 },
          ],
        },
      ]);
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(mockData);

      const result = calculateAnnualIncomeFromTracker();

      expect(cookieStorage.loadExpenseTrackerData).toHaveBeenCalled();
      expect(result).toBe(24000); // 2000 * 12 months
    });

    it('should handle negative growth rate', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: [
            { month: 1, expenses: 1000, income: 5000 },
          ],
        },
      ]);

      const result = calculateAnnualIncomeFromTracker(data, -2);

      // Monthly average = 5000 / 1 = 5000
      // Annual projection = 5000 * 12 = 60000
      // With -2% growth = 60000 * 0.98 = 58800
      expect(result).toBe(58800);
    });
  });

  describe('edge cases', () => {
    it('should handle very large amounts', () => {
      const data = createExpenseTrackerData([
        {
          year: 2024,
          months: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            expenses: 1000000,
            income: 2000000,
          })),
        },
        {
          year: 2023,
          months: [
            { month: 7, expenses: 1000000, income: 2000000 },
            { month: 8, expenses: 1000000, income: 2000000 },
            { month: 9, expenses: 1000000, income: 2000000 },
            { month: 10, expenses: 1000000, income: 2000000 },
            { month: 11, expenses: 1000000, income: 2000000 },
            { month: 12, expenses: 1000000, income: 2000000 },
          ],
        },
      ]);

      const expenseResult = calculateAnnualExpensesFromTracker(data);
      const incomeResult = calculateAnnualIncomeFromTracker(data);

      expect(expenseResult).toBe(12000000);
      expect(incomeResult).toBe(24000000);
    });

    it('should handle decimal amounts', () => {
      const data: ExpenseTrackerData = {
        years: [{
          year: 2024,
          months: Array.from({ length: 12 }, (_, i) => ({
            year: 2024,
            month: i + 1,
            expenses: [{
              id: `e-${i}`,
              date: `2024-${String(i + 1).padStart(2, '0')}-15`,
              amount: 1000.50,
              description: 'Test',
              type: 'expense' as const,
              category: 'OTHER' as const,
              expenseType: 'WANT' as const,
            }],
            incomes: [{
              id: `i-${i}`,
              date: `2024-${String(i + 1).padStart(2, '0')}-15`,
              amount: 3000.75,
              description: 'Test',
              type: 'income' as const,
              source: 'SALARY' as const,
            }],
            budgets: [],
          })),
        }, {
          year: 2023,
          months: [7, 8, 9, 10, 11, 12].map(month => ({
            year: 2023,
            month,
            expenses: [{
              id: `e-2023-${month}`,
              date: `2023-${String(month).padStart(2, '0')}-15`,
              amount: 1000.50,
              description: 'Test',
              type: 'expense' as const,
              category: 'OTHER' as const,
              expenseType: 'WANT' as const,
            }],
            incomes: [{
              id: `i-2023-${month}`,
              date: `2023-${String(month).padStart(2, '0')}-15`,
              amount: 3000.75,
              description: 'Test',
              type: 'income' as const,
              source: 'SALARY' as const,
            }],
            budgets: [],
          })),
        }],
        currentYear: 2024,
        currentMonth: 6,
        currency: 'EUR',
        globalBudgets: [],
      };

      const expenseResult = calculateAnnualExpensesFromTracker(data);
      const incomeResult = calculateAnnualIncomeFromTracker(data);

      expect(expenseResult).toBeCloseTo(12006, 0); // 1000.50 * 12
      expect(incomeResult).toBeCloseTo(36009, 0); // 3000.75 * 12
    });

    it('should handle null expense tracker data parameter', () => {
      vi.mocked(cookieStorage.loadExpenseTrackerData).mockReturnValue(null);

      const result = getLast12MonthsData(null);

      expect(result.totalExpenses).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.monthsCount).toBe(0);
    });
  });
});
