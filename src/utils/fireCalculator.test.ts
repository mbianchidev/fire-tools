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
    maxAge: 100,
  };

  describe('Projection timeline', () => {
    it('should project from current age to maxAge', () => {
      // ARRANGE & ACT
      const currentYear = new Date().getFullYear();
      const currentAge = currentYear - baseInputs.yearOfBirth;
      const result = calculateFIRE(baseInputs);
      
      // ASSERT
      expect(result.projections.length).toBeGreaterThan(0);
      
      // First projection should start at current age
      const firstProjection = result.projections[0];
      expect(firstProjection.age).toBe(currentAge);
      expect(firstProjection.year).toBe(currentYear);
      
      // Last projection should be at maxAge
      const lastProjection = result.projections[result.projections.length - 1];
      expect(lastProjection.age).toBe(baseInputs.maxAge);
      expect(lastProjection.year).toBe(currentYear + (baseInputs.maxAge - currentAge));
      
      // Should have correct number of projections
      const expectedProjections = baseInputs.maxAge - currentAge + 1;
      expect(result.projections.length).toBe(expectedProjections);
    });

    it('should handle withdrawal rate of 0 without crashing', () => {
      // ARRANGE
      const inputs = { ...baseInputs, desiredWithdrawalRate: 0 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.fireTarget).toBe(0);
      expect(result.yearsToFIRE).toBe(0);
      expect(result.projections.length).toBeGreaterThan(0);
      expect(result.projections[0].portfolioValue).toBe(inputs.initialSavings);
    });
  });
});
