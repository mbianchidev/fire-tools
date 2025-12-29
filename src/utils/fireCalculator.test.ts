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

  describe('Withdrawal rate validation', () => {
    it('should reject negative withdrawal rate', () => {
      // ARRANGE
      const inputs = { ...baseInputs, desiredWithdrawalRate: -1 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Withdrawal rate cannot be negative');
      expect(result.projections).toHaveLength(0);
      expect(result.yearsToFIRE).toBe(-1);
    });

    it('should reject negative withdrawal rate with extreme value', () => {
      // ARRANGE
      const inputs = { ...baseInputs, desiredWithdrawalRate: -100 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Withdrawal rate cannot be negative');
      expect(result.projections).toHaveLength(0);
    });
  });

  describe('Edge case handling', () => {
    it('should reject negative expenses', () => {
      // ARRANGE
      const inputs = { ...baseInputs, currentAnnualExpenses: -10000 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Current annual expenses cannot be negative');
      expect(result.projections).toHaveLength(0);
    });

    it('should reject negative FIRE expenses', () => {
      // ARRANGE
      const inputs = { ...baseInputs, fireAnnualExpenses: -5000 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('FIRE annual expenses cannot be negative');
      expect(result.projections).toHaveLength(0);
    });

    it('should reject negative labor income', () => {
      // ARRANGE
      const inputs = { ...baseInputs, annualLaborIncome: -30000 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Annual labor income cannot be negative');
      expect(result.projections).toHaveLength(0);
    });

    it('should reject maxAge less than current age', () => {
      // ARRANGE
      const currentYear = new Date().getFullYear();
      const currentAge = currentYear - baseInputs.yearOfBirth;
      const inputs = { ...baseInputs, maxAge: currentAge - 1 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Maximum age must be greater than or equal to current age');
      expect(result.projections).toHaveLength(0);
    });

    it('should reject maxAge greater than 150', () => {
      // ARRANGE
      const inputs = { ...baseInputs, maxAge: 200 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Maximum age must be 150 or less');
      expect(result.projections).toHaveLength(0);
    });

    it('should handle extremely large initial savings', () => {
      // ARRANGE
      const inputs = { ...baseInputs, initialSavings: Number.MAX_SAFE_INTEGER };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Input values are too large for calculation');
      expect(result.projections).toHaveLength(0);
    });

    it('should handle extremely large expenses', () => {
      // ARRANGE
      const inputs = { ...baseInputs, currentAnnualExpenses: Number.MAX_SAFE_INTEGER };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.validationErrors).toBeDefined();
      expect(result.validationErrors).toContain('Input values are too large for calculation');
      expect(result.projections).toHaveLength(0);
    });

    it('should handle very small withdrawal rate without division issues', () => {
      // ARRANGE
      const inputs = { ...baseInputs, desiredWithdrawalRate: 0.001 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      // Should not have validation errors, but FIRE target will be very large
      expect(result.validationErrors).toBeUndefined();
      expect(result.projections.length).toBeGreaterThan(0);
      expect(isFinite(result.fireTarget)).toBe(true);
    });

    it('should handle zero initial savings', () => {
      // ARRANGE
      const inputs = { ...baseInputs, initialSavings: 0 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.projections.length).toBeGreaterThan(0);
      expect(result.projections[0].portfolioValue).toBe(0);
    });

    it('should handle zero labor income', () => {
      // ARRANGE
      const inputs = { ...baseInputs, annualLaborIncome: 0 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.projections.length).toBeGreaterThan(0);
      expect(result.projections[0].laborIncome).toBe(0);
    });
  });
});
