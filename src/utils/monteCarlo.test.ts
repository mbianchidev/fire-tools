import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation } from './monteCarlo';
import { CalculatorInputs, MonteCarloInputs } from '../types/calculator';

describe('Monte Carlo Simulation', () => {
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
    yearsOfExpenses: 100 / 3,
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
    useAssetAllocationValue: false,
    useExpenseTrackerExpenses: false,
    useExpenseTrackerIncome: false,
  };

  const baseMcInputs: MonteCarloInputs = {
    numSimulations: 100,
    stockVolatility: 15,
    bondVolatility: 5,
    blackSwanProbability: 2,
    blackSwanImpact: -40,
  };

  describe('Black Swan Impact Validation', () => {
    it('should accept black swan impact of 0%', () => {
      const mcInputs = { ...baseMcInputs, blackSwanImpact: 0 };
      const result = runMonteCarloSimulation(baseInputs, mcInputs);
      
      expect(result).toBeDefined();
      expect(result.simulations.length).toBe(100);
    });

    it('should accept black swan impact of -50%', () => {
      const mcInputs = { ...baseMcInputs, blackSwanImpact: -50 };
      const result = runMonteCarloSimulation(baseInputs, mcInputs);
      
      expect(result).toBeDefined();
      expect(result.simulations.length).toBe(100);
    });

    it('should accept black swan impact of -40% (default)', () => {
      const mcInputs = { ...baseMcInputs, blackSwanImpact: -40 };
      const result = runMonteCarloSimulation(baseInputs, mcInputs);
      
      expect(result).toBeDefined();
      expect(result.simulations.length).toBe(100);
    });

    it('should accept black swan impact of -25%', () => {
      const mcInputs = { ...baseMcInputs, blackSwanImpact: -25 };
      const result = runMonteCarloSimulation(baseInputs, mcInputs);
      
      expect(result).toBeDefined();
      expect(result.simulations.length).toBe(100);
    });

    it('should handle black swan impact of -49.99%', () => {
      const mcInputs = { ...baseMcInputs, blackSwanImpact: -49.99 };
      const result = runMonteCarloSimulation(baseInputs, mcInputs);
      
      expect(result).toBeDefined();
      expect(result.simulations.length).toBe(100);
    });

    // Note: Validation is in the UI component (MonteCarloSimulator.tsx)
    // The monteCarlo.ts utility doesn't validate input constraints
    // These tests verify that the simulation runs with various impact values
  });

  describe('Basic Simulation Functionality', () => {
    it('should run simulations and return results', () => {
      const result = runMonteCarloSimulation(baseInputs, baseMcInputs);
      
      expect(result).toBeDefined();
      expect(result.simulations.length).toBe(100);
      expect(result.successCount).toBeGreaterThanOrEqual(0);
      expect(result.failureCount).toBeGreaterThanOrEqual(0);
      expect(result.successCount + result.failureCount).toBe(100);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(100);
    });

    it('should handle very optimistic scenarios with high success rates', () => {
      const optimisticInputs = {
        ...baseInputs,
        initialSavings: 500000,
        savingsRate: 50,
        currentAnnualExpenses: 30000,
        fireAnnualExpenses: 30000,
      };
      
      const mcInputs = { ...baseMcInputs, blackSwanProbability: 0.1 };
      const result = runMonteCarloSimulation(optimisticInputs, mcInputs);
      
      expect(result.successCount).toBeGreaterThan(0);
      expect(result.successRate).toBeGreaterThan(0);
    });

    it('should calculate median years to FIRE for successful simulations', () => {
      const result = runMonteCarloSimulation(baseInputs, baseMcInputs);
      
      if (result.successCount > 0) {
        expect(result.medianYearsToFIRE).toBeGreaterThanOrEqual(0);
      } else {
        expect(result.medianYearsToFIRE).toBe(0);
      }
    });
  });

  describe('Asset Allocation Validation', () => {
    it('should throw error if asset allocation does not sum to 100%', () => {
      const invalidInputs = {
        ...baseInputs,
        stocksPercent: 70,
        bondsPercent: 20,
        cashPercent: 5, // Should be 10 to sum to 100
      };
      
      expect(() => {
        runMonteCarloSimulation(invalidInputs, baseMcInputs);
      }).toThrow('Asset allocation must sum to 100%');
    });

    it('should throw error if desired withdrawal rate is 0 or negative', () => {
      const invalidInputs = {
        ...baseInputs,
        desiredWithdrawalRate: 0,
      };
      
      expect(() => {
        runMonteCarloSimulation(invalidInputs, baseMcInputs);
      }).toThrow('desiredWithdrawalRate must be greater than 0');
    });
  });
});
