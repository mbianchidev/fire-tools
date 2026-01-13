import { describe, expect, it } from 'vitest';
import {
  calculateTransactionSummary,
  calculateCategoryBreakdown,
  calculateBudgetRuleBreakdown,
  calculatePeriodBreakdown,
  filterTransactions,
  sortTransactions,
  calculateMonthlyComparison,
  calculateCategoryTrends,
  calculateYearToDateAverage,
  calculateQuarterlyBreakdown,
  calculateYearToDateBreakdown,
} from '../../src/utils/expenseCalculator';
import {
  IncomeEntry,
  ExpenseEntry,
  MonthData,
  TransactionFilter,
  TransactionSort,
} from '../../src/types/expenseTracker';

describe('Expense Calculator', () => {
  // Test data
  const mockIncomes: IncomeEntry[] = [
    {
      id: 'inc-1',
      type: 'income',
      date: '2024-01-15',
      amount: 5000,
      description: 'January Salary',
      source: 'SALARY',
    },
    {
      id: 'inc-2',
      type: 'income',
      date: '2024-01-20',
      amount: 500,
      description: 'Freelance work',
      source: 'FREELANCE',
    },
  ];

  const mockExpenses: ExpenseEntry[] = [
    {
      id: 'exp-1',
      type: 'expense',
      date: '2024-01-05',
      amount: 1500,
      description: 'Rent',
      category: 'HOUSING',
      expenseType: 'NEED',
    },
    {
      id: 'exp-2',
      type: 'expense',
      date: '2024-01-10',
      amount: 200,
      description: 'Electric bill',
      category: 'UTILITIES',
      expenseType: 'NEED',
    },
    {
      id: 'exp-3',
      type: 'expense',
      date: '2024-01-12',
      amount: 150,
      description: 'Restaurant dinner',
      category: 'DINING_OUT',
      expenseType: 'WANT',
    },
    {
      id: 'exp-4',
      type: 'expense',
      date: '2024-01-18',
      amount: 400,
      description: 'Groceries',
      category: 'GROCERIES',
      expenseType: 'NEED',
    },
    {
      id: 'exp-5',
      type: 'expense',
      date: '2024-01-25',
      amount: 100,
      description: 'Netflix & Spotify',
      category: 'SUBSCRIPTIONS',
      expenseType: 'WANT',
    },
  ];

  const mockMonthData: MonthData = {
    year: 2024,
    month: 1,
    incomes: mockIncomes,
    expenses: mockExpenses,
    budgets: [
      { category: 'HOUSING', monthlyBudget: 1500 },
      { category: 'GROCERIES', monthlyBudget: 500 },
      { category: 'DINING_OUT', monthlyBudget: 200 },
    ],
  };

  describe('calculateTransactionSummary', () => {
    it('should calculate total income correctly', () => {
      const summary = calculateTransactionSummary(mockIncomes, mockExpenses);
      expect(summary.totalIncome).toBe(5500);
    });

    it('should calculate total expenses correctly', () => {
      const summary = calculateTransactionSummary(mockIncomes, mockExpenses);
      expect(summary.totalExpenses).toBe(2350);
    });

    it('should calculate net balance correctly', () => {
      const summary = calculateTransactionSummary(mockIncomes, mockExpenses);
      expect(summary.netBalance).toBe(3150);
    });

    it('should calculate savings amount correctly', () => {
      const summary = calculateTransactionSummary(mockIncomes, mockExpenses);
      expect(summary.savingsAmount).toBe(3150);
    });

    it('should calculate savings rate correctly', () => {
      const summary = calculateTransactionSummary(mockIncomes, mockExpenses);
      // 3150 / 5500 = 57.27%
      expect(summary.savingsRate).toBeCloseTo(57.27, 1);
    });

    it('should handle empty transactions', () => {
      const summary = calculateTransactionSummary([], []);
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netBalance).toBe(0);
      expect(summary.savingsAmount).toBe(0);
      expect(summary.savingsRate).toBe(0);
    });

    it('should handle zero income (no division by zero)', () => {
      const summary = calculateTransactionSummary([], mockExpenses);
      expect(summary.savingsRate).toBe(0);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should group expenses by category', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      expect(breakdown).toHaveLength(5); // 5 unique categories
    });

    it('should calculate total amount per category', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      const housing = breakdown.find(b => b.category === 'HOUSING');
      expect(housing?.totalAmount).toBe(1500);
    });

    it('should calculate percentage correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      const housing = breakdown.find(b => b.category === 'HOUSING');
      // 1500 / 2350 = 63.83%
      expect(housing?.percentage).toBeCloseTo(63.83, 1);
    });

    it('should count transactions per category', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses);
      const housing = breakdown.find(b => b.category === 'HOUSING');
      expect(housing?.transactionCount).toBe(1);
    });

    it('should handle empty expenses', () => {
      const breakdown = calculateCategoryBreakdown([]);
      expect(breakdown).toHaveLength(0);
    });

    it('should include budget info when provided', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses, mockMonthData.budgets);
      const housing = breakdown.find(b => b.category === 'HOUSING');
      expect(housing?.budgeted).toBe(1500);
      expect(housing?.remaining).toBe(0); // 1500 budget - 1500 spent
    });

    it('should calculate remaining budget correctly', () => {
      const breakdown = calculateCategoryBreakdown(mockExpenses, mockMonthData.budgets);
      const groceries = breakdown.find(b => b.category === 'GROCERIES');
      expect(groceries?.remaining).toBe(100); // 500 budget - 400 spent
    });
  });

  describe('calculateBudgetRuleBreakdown', () => {
    it('should categorize needs correctly', () => {
      const breakdown = calculateBudgetRuleBreakdown(mockIncomes, mockExpenses);
      // Needs: HOUSING (1500) + UTILITIES (200) + GROCERIES (400) = 2100
      expect(breakdown.needs.amount).toBe(2100);
    });

    it('should categorize wants correctly', () => {
      const breakdown = calculateBudgetRuleBreakdown(mockIncomes, mockExpenses);
      // Wants: DINING_OUT (150) + SUBSCRIPTIONS (100) = 250
      expect(breakdown.wants.amount).toBe(250);
    });

    it('should calculate savings correctly', () => {
      const breakdown = calculateBudgetRuleBreakdown(mockIncomes, mockExpenses);
      // Savings: 5500 - 2350 = 3150
      expect(breakdown.savings.amount).toBe(3150);
    });

    it('should calculate percentages based on total income', () => {
      const breakdown = calculateBudgetRuleBreakdown(mockIncomes, mockExpenses);
      // Needs: 2100 / 5500 = 38.18%
      expect(breakdown.needs.percentage).toBeCloseTo(38.18, 1);
      // Wants: 250 / 5500 = 4.55%
      expect(breakdown.wants.percentage).toBeCloseTo(4.55, 1);
      // Savings: 3150 / 5500 = 57.27%
      expect(breakdown.savings.percentage).toBeCloseTo(57.27, 1);
    });

    it('should have correct target percentages', () => {
      const breakdown = calculateBudgetRuleBreakdown(mockIncomes, mockExpenses);
      expect(breakdown.needs.targetPercentage).toBe(50);
      expect(breakdown.wants.targetPercentage).toBe(30);
      expect(breakdown.savings.targetPercentage).toBe(20);
    });

    it('should include category breakdown for needs and wants', () => {
      const breakdown = calculateBudgetRuleBreakdown(mockIncomes, mockExpenses);
      expect(breakdown.needs.categories.length).toBeGreaterThan(0);
      expect(breakdown.wants.categories.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePeriodBreakdown', () => {
    const monthsData: MonthData[] = [
      {
        year: 2024,
        month: 1,
        incomes: mockIncomes,
        expenses: mockExpenses,
        budgets: [],
      },
      {
        year: 2024,
        month: 2,
        incomes: [
          { id: 'inc-3', type: 'income', date: '2024-02-15', amount: 5000, description: 'Feb Salary', source: 'SALARY' },
        ],
        expenses: [
          { id: 'exp-6', type: 'expense', date: '2024-02-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
          { id: 'exp-7', type: 'expense', date: '2024-02-10', amount: 300, description: 'Groceries', category: 'GROCERIES', expenseType: 'NEED' },
        ],
        budgets: [],
      },
    ];

    it('should calculate monthly breakdown', () => {
      const breakdown = calculatePeriodBreakdown(monthsData, 'MONTHLY');
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].period).toBe('2024-01');
      expect(breakdown[1].period).toBe('2024-02');
    });

    it('should calculate quarterly breakdown', () => {
      const breakdown = calculatePeriodBreakdown(monthsData, 'QUARTERLY');
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].period).toBe('2024-Q1');
    });

    it('should calculate yearly breakdown', () => {
      const breakdown = calculatePeriodBreakdown(monthsData, 'YEARLY');
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].period).toBe('2024');
    });

    it('should include total expenses per period', () => {
      const breakdown = calculatePeriodBreakdown(monthsData, 'MONTHLY');
      expect(breakdown[0].totalExpenses).toBe(2350);
      expect(breakdown[1].totalExpenses).toBe(1800);
    });

    it('should include total income per period', () => {
      const breakdown = calculatePeriodBreakdown(monthsData, 'MONTHLY');
      expect(breakdown[0].totalIncome).toBe(5500);
      expect(breakdown[1].totalIncome).toBe(5000);
    });
  });

  describe('filterTransactions', () => {
    const allTransactions = [...mockIncomes, ...mockExpenses];

    it('should filter by date range', () => {
      const filter: TransactionFilter = {
        startDate: '2024-01-10',
        endDate: '2024-01-20',
      };
      const filtered = filterTransactions(allTransactions, filter);
      // Jan 10 (UTILITIES), Jan 12 (DINING_OUT), Jan 15 (Salary), Jan 18 (GROCERIES), Jan 20 (Freelance) = 5
      expect(filtered.length).toBe(5);
    });

    it('should filter by category', () => {
      const filter: TransactionFilter = { category: 'HOUSING' };
      const filtered = filterTransactions(mockExpenses, filter);
      expect(filtered.length).toBe(1);
      expect((filtered[0] as ExpenseEntry).category).toBe('HOUSING');
    });

    it('should filter by expense type (need/want)', () => {
      const filter: TransactionFilter = { expenseType: 'WANT' };
      const filtered = filterTransactions(mockExpenses, filter);
      expect(filtered.length).toBe(2); // DINING_OUT and SUBSCRIPTIONS
    });

    it('should filter by minimum amount', () => {
      const filter: TransactionFilter = { minAmount: 400 };
      const filtered = filterTransactions(allTransactions, filter);
      expect(filtered.every(t => t.amount >= 400)).toBe(true);
    });

    it('should filter by maximum amount', () => {
      const filter: TransactionFilter = { maxAmount: 200 };
      const filtered = filterTransactions(allTransactions, filter);
      expect(filtered.every(t => t.amount <= 200)).toBe(true);
    });

    it('should filter by search term in description', () => {
      const filter: TransactionFilter = { searchTerm: 'rent' };
      const filtered = filterTransactions(mockExpenses, filter);
      expect(filtered.length).toBe(1);
      expect(filtered[0].description.toLowerCase()).toContain('rent');
    });

    it('should combine multiple filters', () => {
      const filter: TransactionFilter = {
        minAmount: 100,
        maxAmount: 500,
        expenseType: 'NEED',
      };
      const filtered = filterTransactions(mockExpenses, filter);
      expect(filtered.length).toBe(2); // UTILITIES (200) and GROCERIES (400)
    });
  });

  describe('sortTransactions', () => {
    it('should sort by date ascending', () => {
      const sort: TransactionSort = { field: 'date', direction: 'asc' };
      const sorted = sortTransactions(mockExpenses, sort);
      expect(sorted[0].date).toBe('2024-01-05');
      expect(sorted[sorted.length - 1].date).toBe('2024-01-25');
    });

    it('should sort by date descending', () => {
      const sort: TransactionSort = { field: 'date', direction: 'desc' };
      const sorted = sortTransactions(mockExpenses, sort);
      expect(sorted[0].date).toBe('2024-01-25');
      expect(sorted[sorted.length - 1].date).toBe('2024-01-05');
    });

    it('should sort by amount ascending', () => {
      const sort: TransactionSort = { field: 'amount', direction: 'asc' };
      const sorted = sortTransactions(mockExpenses, sort);
      expect(sorted[0].amount).toBe(100);
      expect(sorted[sorted.length - 1].amount).toBe(1500);
    });

    it('should sort by amount descending', () => {
      const sort: TransactionSort = { field: 'amount', direction: 'desc' };
      const sorted = sortTransactions(mockExpenses, sort);
      expect(sorted[0].amount).toBe(1500);
      expect(sorted[sorted.length - 1].amount).toBe(100);
    });

    it('should sort by category alphabetically', () => {
      const sort: TransactionSort = { field: 'category', direction: 'asc' };
      const sorted = sortTransactions(mockExpenses, sort);
      // Categories should be in alphabetical order
      expect((sorted[0] as ExpenseEntry).category).toBe('DINING_OUT');
    });
  });

  describe('calculateMonthlyComparison', () => {
    const monthsData: MonthData[] = [
      {
        year: 2024,
        month: 1,
        incomes: [{ id: 'i1', type: 'income', date: '2024-01-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [{ id: 'e1', type: 'expense', date: '2024-01-05', amount: 2000, description: 'Various', category: 'HOUSING', expenseType: 'NEED' }],
        budgets: [],
      },
      {
        year: 2024,
        month: 2,
        incomes: [{ id: 'i2', type: 'income', date: '2024-02-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [{ id: 'e2', type: 'expense', date: '2024-02-05', amount: 2500, description: 'Various', category: 'HOUSING', expenseType: 'NEED' }],
        budgets: [],
      },
      {
        year: 2024,
        month: 3,
        incomes: [{ id: 'i3', type: 'income', date: '2024-03-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [{ id: 'e3', type: 'expense', date: '2024-03-05', amount: 1500, description: 'Various', category: 'HOUSING', expenseType: 'NEED' }],
        budgets: [],
      },
    ];

    it('should return monthly expense data', () => {
      const comparison = calculateMonthlyComparison(monthsData);
      expect(comparison).toHaveLength(3);
      expect(comparison[0].expenses).toBe(2000);
      expect(comparison[1].expenses).toBe(2500);
      expect(comparison[2].expenses).toBe(1500);
    });

    it('should return monthly income data', () => {
      const comparison = calculateMonthlyComparison(monthsData);
      expect(comparison[0].income).toBe(5000);
    });

    it('should include average expense', () => {
      const comparison = calculateMonthlyComparison(monthsData);
      // Average: (2000 + 2500 + 1500) / 3 = 2000
      expect(comparison[0].average).toBe(2000);
    });

    it('should format month labels correctly', () => {
      const comparison = calculateMonthlyComparison(monthsData);
      expect(comparison[0].month).toBe('Jan 2024');
      expect(comparison[1].month).toBe('Feb 2024');
    });
  });

  describe('calculateCategoryTrends', () => {
    const monthsData: MonthData[] = [
      {
        year: 2024,
        month: 1,
        incomes: [],
        expenses: [
          { id: 'e1', type: 'expense', date: '2024-01-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
          { id: 'e2', type: 'expense', date: '2024-01-10', amount: 400, description: 'Groceries', category: 'GROCERIES', expenseType: 'NEED' },
        ],
        budgets: [],
      },
      {
        year: 2024,
        month: 2,
        incomes: [],
        expenses: [
          { id: 'e3', type: 'expense', date: '2024-02-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
          { id: 'e4', type: 'expense', date: '2024-02-10', amount: 350, description: 'Groceries', category: 'GROCERIES', expenseType: 'NEED' },
        ],
        budgets: [],
      },
    ];

    it('should return trend data for each month', () => {
      const trends = calculateCategoryTrends(monthsData);
      expect(trends).toHaveLength(2);
    });

    it('should include amounts for each category', () => {
      const trends = calculateCategoryTrends(monthsData);
      expect(trends[0].HOUSING).toBe(1500);
      expect(trends[0].GROCERIES).toBe(400);
      expect(trends[1].GROCERIES).toBe(350);
    });

    it('should format month labels', () => {
      const trends = calculateCategoryTrends(monthsData);
      expect(trends[0].month).toBe('Jan 2024');
    });
  });

  describe('calculateYearToDateAverage', () => {
    const monthsData: MonthData[] = [
      {
        year: 2024,
        month: 1,
        incomes: [],
        expenses: [
          { id: 'e1', type: 'expense', date: '2024-01-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
          { id: 'e2', type: 'expense', date: '2024-01-10', amount: 400, description: 'Groceries', category: 'GROCERIES', expenseType: 'NEED' },
        ],
        budgets: [],
      },
      {
        year: 2024,
        month: 2,
        incomes: [],
        expenses: [
          { id: 'e3', type: 'expense', date: '2024-02-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
          { id: 'e4', type: 'expense', date: '2024-02-10', amount: 300, description: 'Groceries', category: 'GROCERIES', expenseType: 'NEED' },
        ],
        budgets: [],
      },
    ];

    it('should calculate average expenses per category', () => {
      const averages = calculateYearToDateAverage(monthsData);
      const housing = averages.find(a => a.category === 'HOUSING');
      expect(housing?.totalAmount).toBe(1500); // Average of 1500 + 1500 = 1500
    });

    it('should calculate average for categories with different amounts', () => {
      const averages = calculateYearToDateAverage(monthsData);
      const groceries = averages.find(a => a.category === 'GROCERIES');
      // Average of 400 + 300 = 350
      expect(groceries?.totalAmount).toBe(350);
    });
  });

  describe('calculateQuarterlyBreakdown', () => {
    const monthsData: MonthData[] = [
      {
        year: 2024,
        month: 1,
        incomes: [{ id: 'i1', type: 'income', date: '2024-01-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [
          { id: 'e1', type: 'expense', date: '2024-01-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
        ],
        budgets: [],
      },
      {
        year: 2024,
        month: 2,
        incomes: [{ id: 'i2', type: 'income', date: '2024-02-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [
          { id: 'e2', type: 'expense', date: '2024-02-05', amount: 1500, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
        ],
        budgets: [],
      },
      {
        year: 2024,
        month: 4,
        incomes: [{ id: 'i3', type: 'income', date: '2024-04-15', amount: 6000, description: 'Salary', source: 'SALARY' }],
        expenses: [
          { id: 'e3', type: 'expense', date: '2024-04-05', amount: 2000, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
        ],
        budgets: [],
      },
    ];

    it('should calculate Q1 breakdown correctly', () => {
      const result = calculateQuarterlyBreakdown(monthsData, 1);
      expect(result.totalIncome).toBe(10000); // 5000 + 5000
      expect(result.totalExpenses).toBe(3000); // 1500 + 1500
      expect(result.expenses.length).toBe(1);
      expect(result.expenses[0].totalAmount).toBe(3000);
    });

    it('should calculate Q2 breakdown correctly', () => {
      const result = calculateQuarterlyBreakdown(monthsData, 2);
      expect(result.totalIncome).toBe(6000);
      expect(result.totalExpenses).toBe(2000);
    });

    it('should return empty results for quarters with no data', () => {
      const result = calculateQuarterlyBreakdown(monthsData, 3);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.expenses.length).toBe(0);
    });
  });

  describe('calculateYearToDateBreakdown', () => {
    const monthsData: MonthData[] = [
      {
        year: 2024,
        month: 1,
        incomes: [{ id: 'i1', type: 'income', date: '2024-01-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [
          { id: 'e1', type: 'expense', date: '2024-01-05', amount: 1000, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
        ],
        budgets: [],
      },
      {
        year: 2024,
        month: 2,
        incomes: [{ id: 'i2', type: 'income', date: '2024-02-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [
          { id: 'e2', type: 'expense', date: '2024-02-05', amount: 2000, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
        ],
        budgets: [],
      },
      {
        year: 2024,
        month: 3,
        incomes: [{ id: 'i3', type: 'income', date: '2024-03-15', amount: 5000, description: 'Salary', source: 'SALARY' }],
        expenses: [
          { id: 'e3', type: 'expense', date: '2024-03-05', amount: 3000, description: 'Rent', category: 'HOUSING', expenseType: 'NEED' },
        ],
        budgets: [],
      },
    ];

    it('should calculate YTD totals up to specified month', () => {
      const result = calculateYearToDateBreakdown(monthsData, 2);
      expect(result.totalIncome).toBe(10000); // Jan + Feb
      expect(result.totalExpenses).toBe(3000); // 1000 + 2000
    });

    it('should calculate YTD averages correctly', () => {
      const result = calculateYearToDateBreakdown(monthsData, 2);
      const housingAvg = result.average.find(a => a.category === 'HOUSING');
      expect(housingAvg?.totalAmount).toBe(1500); // (1000 + 2000) / 2
    });

    it('should include all months up to the specified month', () => {
      const result = calculateYearToDateBreakdown(monthsData, 3);
      expect(result.totalIncome).toBe(15000); // Jan + Feb + Mar
      expect(result.totalExpenses).toBe(6000); // 1000 + 2000 + 3000
    });
  });
});
