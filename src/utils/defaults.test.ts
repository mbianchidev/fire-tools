import { describe, expect, it } from 'vitest';
import { getDemoNetWorthData, generateDemoNetWorthDataForYear } from './defaults';

describe('getDemoNetWorthData', () => {
  it('should generate net worth data for the current year', () => {
    const currentYear = new Date().getFullYear();
    const data = getDemoNetWorthData();
    
    expect(data.currentYear).toBe(currentYear);
    expect(data.years).toHaveLength(1);
    expect(data.years[0].year).toBe(currentYear);
    expect(data.years[0].months).toHaveLength(12);
    expect(data.defaultCurrency).toBe('EUR');
  });

  it('should generate data with correct structure', () => {
    const data = getDemoNetWorthData();
    
    expect(data.years[0].months[0]).toHaveProperty('assets');
    expect(data.years[0].months[0]).toHaveProperty('cashEntries');
    expect(data.years[0].months[0]).toHaveProperty('pensions');
    expect(data.years[0].months[0]).toHaveProperty('operations');
  });
});

describe('generateDemoNetWorthDataForYear', () => {
  it('should generate demo data for a specific year', () => {
    const targetYear = 2023;
    const months = generateDemoNetWorthDataForYear(targetYear);
    
    expect(months).toHaveLength(12);
    expect(months[0].year).toBe(targetYear);
    expect(months[11].year).toBe(targetYear);
  });

  it('should generate 12 months of data', () => {
    const targetYear = 2025;
    const months = generateDemoNetWorthDataForYear(targetYear);
    
    expect(months).toHaveLength(12);
    
    // Verify months are numbered 1-12
    const monthNumbers = months.map(m => m.month);
    expect(monthNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('should generate assets for each month', () => {
    const months = generateDemoNetWorthDataForYear(2024);
    
    months.forEach(month => {
      expect(month.assets.length).toBeGreaterThan(0);
      month.assets.forEach(asset => {
        expect(asset.ticker).toBeTruthy();
        expect(asset.name).toBeTruthy();
        expect(asset.shares).toBeGreaterThan(0);
        expect(asset.pricePerShare).toBeGreaterThan(0);
        expect(asset.currency).toBe('EUR');
      });
    });
  });

  it('should generate cash entries for each month', () => {
    const months = generateDemoNetWorthDataForYear(2024);
    
    months.forEach(month => {
      expect(month.cashEntries.length).toBeGreaterThan(0);
      month.cashEntries.forEach(cash => {
        expect(cash.accountName).toBeTruthy();
        expect(cash.balance).toBeGreaterThan(0);
        expect(cash.currency).toBe('EUR');
      });
    });
  });

  it('should generate pensions for each month', () => {
    const months = generateDemoNetWorthDataForYear(2024);
    
    months.forEach(month => {
      expect(month.pensions.length).toBeGreaterThan(0);
      month.pensions.forEach(pension => {
        expect(pension.name).toBeTruthy();
        expect(pension.currentValue).toBeGreaterThan(0);
        expect(pension.currency).toBe('EUR');
      });
    });
  });

  it('should generate operations for each month', () => {
    const months = generateDemoNetWorthDataForYear(2024);
    
    months.forEach(month => {
      expect(month.operations.length).toBeGreaterThan(0);
      month.operations.forEach(op => {
        expect(op.date).toBeTruthy();
        expect(op.date.startsWith('2024-')).toBe(true);
        expect(op.description).toBeTruthy();
        expect(op.amount).toBeGreaterThan(0);
        expect(op.currency).toBe('EUR');
      });
    });
  });

  it('should generate unique IDs for entries', () => {
    const months = generateDemoNetWorthDataForYear(2024);
    
    const allIds = new Set<string>();
    months.forEach(month => {
      month.assets.forEach(a => allIds.add(a.id));
      month.cashEntries.forEach(c => allIds.add(c.id));
      month.pensions.forEach(p => allIds.add(p.id));
      month.operations.forEach(o => allIds.add(o.id));
    });
    
    // With 12 months, each having at least 2 assets, 2 cash entries, 1 pension, and 1 operation
    // we should have at least 12 * (2 + 2 + 1 + 1) = 72 unique IDs
    expect(allIds.size).toBeGreaterThanOrEqual(72);
  });

  it('should use deterministic seeded random for consistent values', () => {
    const year = 2024;
    const months1 = generateDemoNetWorthDataForYear(year);
    const months2 = generateDemoNetWorthDataForYear(year);
    
    // Same year should produce same values (deterministic)
    expect(months1[0].assets[0].pricePerShare).toBe(months2[0].assets[0].pricePerShare);
    expect(months1[5].cashEntries[0].balance).toBe(months2[5].cashEntries[0].balance);
  });
});
