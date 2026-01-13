import { describe, expect, it } from 'vitest';
import { DEFAULT_INPUTS, getDemoNetWorthData, generateDemoNetWorthDataForYear, getDemoAssetAllocationData, getDemoCashflowData } from '../../src/utils/defaults';

describe('DEFAULT_INPUTS', () => {
  it('should have initialSavings consistent with Asset Allocation demo (~€70k)', () => {
    // The FIRE Calculator initial savings should match the Asset Allocation portfolio value
    expect(DEFAULT_INPUTS.initialSavings).toBe(70000);
  });

  it('should have consistent income and expenses for ~33% savings rate', () => {
    // Income: €60,000, Expenses: €40,000, Savings: €20,000 (33.33%)
    expect(DEFAULT_INPUTS.annualLaborIncome).toBe(60000);
    expect(DEFAULT_INPUTS.currentAnnualExpenses).toBe(40000);
    const expectedSavingsRate = ((60000 - 40000) / 60000) * 100;
    expect(DEFAULT_INPUTS.savingsRate).toBeCloseTo(expectedSavingsRate, 2);
  });
});

describe('getDemoAssetAllocationData', () => {
  it('should have total portfolio value of ~€70,000', () => {
    const { assets } = getDemoAssetAllocationData();
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    // Should be approximately €70,000 (€35k stocks + €30k bonds + €5k cash)
    expect(totalValue).toBeGreaterThan(69000);
    expect(totalValue).toBeLessThan(71000);
  });

  it('should have stocks worth ~€35,000', () => {
    const { assets } = getDemoAssetAllocationData();
    const stocksValue = assets
      .filter(a => a.assetClass === 'STOCKS')
      .reduce((sum, a) => sum + a.currentValue, 0);
    expect(stocksValue).toBeGreaterThan(34000);
    expect(stocksValue).toBeLessThan(36000);
  });

  it('should have bonds worth ~€30,000', () => {
    const { assets } = getDemoAssetAllocationData();
    const bondsValue = assets
      .filter(a => a.assetClass === 'BONDS')
      .reduce((sum, a) => sum + a.currentValue, 0);
    expect(bondsValue).toBeGreaterThan(29000);
    expect(bondsValue).toBeLessThan(31000);
  });

  it('should have cash worth ~€5,000', () => {
    const { assets } = getDemoAssetAllocationData();
    const cashValue = assets
      .filter(a => a.assetClass === 'CASH')
      .reduce((sum, a) => sum + a.currentValue, 0);
    expect(cashValue).toBe(5000);
  });
});

describe('getDemoCashflowData', () => {
  it('should have monthly income of €5,000 (annual €60,000)', () => {
    const data = getDemoCashflowData();
    const currentYearData = data.years.find(y => y.year === data.currentYear);
    if (currentYearData && currentYearData.months.length > 0) {
      const monthIncome = currentYearData.months[0].incomes.reduce((sum, i) => sum + i.amount, 0);
      // Monthly income should be around €5,000 (some months may have freelance bonuses)
      expect(monthIncome).toBeGreaterThanOrEqual(5000);
    }
  });
});

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
        // Assets can have different currencies (EUR or USD)
        expect(['EUR', 'USD']).toContain(asset.currency);
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
    
    // Pensions are now optional (empty array by default - no State Pension)
    months.forEach(month => {
      expect(month.pensions).toBeDefined();
      expect(Array.isArray(month.pensions)).toBe(true);
      // If there are pensions, validate their structure
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
