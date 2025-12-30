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
    yearsOfExpenses: 100 / 3, // ~33.33 years
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

  describe('Years of expenses for FIRE target', () => {
    it('should calculate FIRE target based on yearsOfExpenses', () => {
      // ARRANGE
      const inputs = { ...baseInputs, yearsOfExpenses: 25, fireAnnualExpenses: 40000 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      // FIRE target = fireAnnualExpenses * yearsOfExpenses = 40000 * 25 = 1,000,000
      expect(result.fireTarget).toBe(1000000);
    });

    it('should use custom yearsOfExpenses value', () => {
      // ARRANGE
      const inputs = { ...baseInputs, yearsOfExpenses: 30, fireAnnualExpenses: 50000 };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      // FIRE target = fireAnnualExpenses * yearsOfExpenses = 50000 * 30 = 1,500,000
      expect(result.fireTarget).toBe(1500000);
    });
  });

  describe('Other income and pension calculations', () => {
    it('should include otherIncome in pre-FIRE savings', () => {
      // ARRANGE
      const inputsWithOther = { ...baseInputs, otherIncome: 10000 };
      const inputsWithoutOther = { ...baseInputs, otherIncome: 0 };
      
      // ACT
      const resultWithOther = calculateFIRE(inputsWithOther);
      const resultWithoutOther = calculateFIRE(inputsWithoutOther);
      
      // ASSERT
      // First year net savings should be higher with other income
      const firstYearWithOther = resultWithOther.projections[0];
      const firstYearWithoutOther = resultWithoutOther.projections[0];
      
      // The difference should be exactly the otherIncome amount
      expect(firstYearWithOther.netSavings - firstYearWithoutOther.netSavings).toBeCloseTo(10000, 2);
    });

    it('should include pension income after retirement age', () => {
      // ARRANGE
      const currentYear = new Date().getFullYear();
      const retirementAge = 67;
      // Use a year of birth that makes current age exactly 66 (one year before retirement)
      const yearOfBirth = currentYear - 66;
      
      const inputs = { 
        ...baseInputs, 
        yearOfBirth,
        retirementAge,
        statePensionIncome: 12000,
        privatePensionIncome: 6000,
        stopWorkingAtFIRE: false, // Keep working to test pension inclusion
      };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      // Year 0: age 66, no pension
      // Year 1: age 67, pension should kick in
      const beforeRetirement = result.projections[0]; // age 66
      const atRetirement = result.projections[1]; // age 67
      
      expect(beforeRetirement.age).toBe(66);
      expect(atRetirement.age).toBe(67);
      
      // Total income at retirement should include pension (18000)
      // Both should have the same labor income if still working
      // The difference should account for pension plus investment yield changes
      // We just check that pension is reflected in net savings
      expect(atRetirement.netSavings).toBeGreaterThan(beforeRetirement.netSavings);
    });

    it('should include otherIncome in post-FIRE calculations', () => {
      // ARRANGE: Start with already FIRE'd situation
      const inputs = { 
        ...baseInputs, 
        initialSavings: 2000000, // Already at FIRE target
        yearsOfExpenses: 25,
        fireAnnualExpenses: 40000, // FIRE target = 1,000,000
        otherIncome: 5000,
        stopWorkingAtFIRE: true,
      };
      
      // ACT
      const result = calculateFIRE(inputs);
      
      // ASSERT
      expect(result.yearsToFIRE).toBe(0); // Already FIRE'd
      
      // After FIRE, the portfolio change should be: totalIncome - expenses
      // totalIncome = 0 (no labor) + investmentYield + otherIncome (5000)
      // The otherIncome should help reduce portfolio drawdown
      const firstProjection = result.projections[0];
      expect(firstProjection.isFIRE).toBe(true);
      expect(firstProjection.totalIncome).toBeGreaterThan(0);
    });
  });
});
