import { describe, it, expect } from 'vitest';
import { calculateFIRE } from './fireCalculator';
import { CalculatorInputs } from '../types/calculator';

describe('FIRE Calculator', () => {
  const baseInputs: CalculatorInputs = {
    initialSavings: 50000,
    stocksPercent: 70,
    bondsPercent: 20,
    cashPercent: 10,
    currentAnnualExpenses: 40000,
    fireAnnualExpenses: 40000,
    annualLaborIncome: 60000,
    laborIncomeGrowthRate: 3,
    savingsRate: 33.33,
    desiredWithdrawalRate: 3,
    expectedStockReturn: 7,
    expectedBondReturn: 2,
    expectedCashReturn: -2,
    yearOfBirth: 1990,
    retirementAge: 67,
    statePensionIncome: 0,
    privatePensionIncome: 0,
    otherIncome: 0,
    stopWorkingAtFIRE: true,
  };

  describe('Projection timeline', () => {
    it('should project from birth (age 0) to age 100', () => {
      // ARRANGE & ACT
      const result = calculateFIRE(baseInputs);
      
      // ASSERT
      expect(result.projections.length).toBeGreaterThan(0);
      
      // First projection should start at age 0
      const firstProjection = result.projections[0];
      expect(firstProjection.age).toBe(0);
      expect(firstProjection.year).toBe(baseInputs.yearOfBirth);
      
      // Last projection should be at age 100
      const lastProjection = result.projections[result.projections.length - 1];
      expect(lastProjection.age).toBe(100);
      expect(lastProjection.year).toBe(baseInputs.yearOfBirth + 100);
      
      // Should have 101 projections (age 0 through 100 inclusive)
      expect(result.projections.length).toBe(101);
    });
  });
});
