import { describe, expect, it } from 'vitest';
import { generateDemoExpenseData } from '../../src/utils/demoExpenseData';

describe('generateDemoExpenseData', () => {
  it('should generate expense tracker data with current year', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const data = generateDemoExpenseData();
    
    expect(data.currentYear).toBe(currentYear);
    expect(data.currentMonth).toBe(currentMonth);
    expect(data.currency).toBe('EUR');
  });

  it('should generate data for a specific year when provided', () => {
    const targetYear = 2023;
    const data = generateDemoExpenseData(targetYear);
    
    expect(data.years).toHaveLength(1);
    expect(data.years[0].year).toBe(targetYear);
    expect(data.years[0].months).toHaveLength(12);
    
    // Verify all transactions are dated in the target year
    data.years[0].months.forEach(month => {
      month.incomes.forEach(income => {
        expect(income.date.startsWith(`${targetYear}-`)).toBe(true);
      });
      month.expenses.forEach(expense => {
        expect(expense.date.startsWith(`${targetYear}-`)).toBe(true);
      });
    });
  });

  it('should generate a full year of data with 12 months', () => {
    const data = generateDemoExpenseData();
    
    expect(data.years).toHaveLength(1);
    expect(data.years[0].months).toHaveLength(12);
    
    // Verify months are numbered 1-12
    const monthNumbers = data.years[0].months.map(m => m.month);
    expect(monthNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('should generate monthly income for each month', () => {
    const data = generateDemoExpenseData();
    
    // Each month should have income entries
    data.years[0].months.forEach(month => {
      expect(month.incomes.length).toBeGreaterThan(0);
      
      // Verify income entries have required fields
      month.incomes.forEach(income => {
        expect(income.type).toBe('income');
        expect(income.id).toBeTruthy();
        expect(income.date).toBeTruthy();
        expect(income.amount).toBeGreaterThan(0);
        expect(income.description).toBeTruthy();
        expect(income.source).toBeTruthy();
      });
    });
    
    // Total annual income should be around €60,000 (default income)
    const totalIncome = data.years[0].months.reduce((sum, month) => {
      return sum + month.incomes.reduce((monthSum, inc) => monthSum + inc.amount, 0);
    }, 0);
    expect(totalIncome).toBeGreaterThan(55000);
    expect(totalIncome).toBeLessThan(65000);
  });

  it('should generate monthly expenses for each month', () => {
    // Use seeded data for deterministic testing
    const data = generateDemoExpenseData(2024, true);
    
    // Each month should have expense entries
    data.years[0].months.forEach(month => {
      expect(month.expenses.length).toBeGreaterThan(0);
      
      // Verify expense entries have required fields
      month.expenses.forEach(expense => {
        expect(expense.type).toBe('expense');
        expect(expense.id).toBeTruthy();
        expect(expense.date).toBeTruthy();
        expect(expense.amount).toBeGreaterThan(0);
        expect(expense.description).toBeTruthy();
        expect(expense.category).toBeTruthy();
        expect(expense.expenseType).toBeTruthy();
        expect(['NEED', 'WANT']).toContain(expense.expenseType);
      });
    });
    
    // Total annual expenses should be around €40,000 (default expenses)
    // With seeded data, the total should be consistent
    const totalExpenses = data.years[0].months.reduce((sum, month) => {
      return sum + month.expenses.reduce((monthSum, exp) => monthSum + exp.amount, 0);
    }, 0);
    expect(totalExpenses).toBeGreaterThan(35000);
    expect(totalExpenses).toBeLessThan(45000);
  });

  it('should include variety of expense categories', () => {
    const data = generateDemoExpenseData();
    
    // Collect all categories used across the year
    const categoriesUsed = new Set<string>();
    data.years[0].months.forEach(month => {
      month.expenses.forEach(expense => {
        categoriesUsed.add(expense.category);
      });
    });
    
    // Should have multiple different categories (at least 5)
    expect(categoriesUsed.size).toBeGreaterThanOrEqual(5);
    
    // Should include some common categories
    expect(categoriesUsed.has('HOUSING')).toBe(true);
    expect(categoriesUsed.has('GROCERIES')).toBe(true);
  });
});
