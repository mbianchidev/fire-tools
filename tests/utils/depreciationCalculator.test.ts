import { describe, expect, it } from 'vitest';
import {
  calculateDepreciatedValue,
  calculateAccumulatedDepreciation,
  calculateAnnualDepreciation,
  getDepreciationSchedule,
} from '../../src/utils/depreciationCalculator';
import { VehicleDepreciation } from '../../src/types/netWorthTracker';

describe('Depreciation Calculator', () => {
  describe('calculateDepreciatedValue', () => {
    it('should calculate straight-line depreciation correctly', () => {
      const depreciation: VehicleDepreciation = {
        method: 'STRAIGHT_LINE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        purchaseDate: '2020-01-01',
      };

      // After 5 years: 30000 - ((30000-5000)/10 * 5) = 30000 - 12500 = 17500
      const value = calculateDepreciatedValue(depreciation, '2025-01-01');
      // Allow for slight variance due to leap year calculations
      expect(value).toBeGreaterThan(17450);
      expect(value).toBeLessThan(17550);
    });

    it('should not depreciate below salvage value', () => {
      const depreciation: VehicleDepreciation = {
        method: 'STRAIGHT_LINE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        purchaseDate: '2020-01-01',
      };

      // After 15 years (beyond useful life)
      const value = calculateDepreciatedValue(depreciation, '2035-01-01');
      expect(value).toBe(5000);
    });

    it('should calculate declining balance depreciation correctly', () => {
      const depreciation: VehicleDepreciation = {
        method: 'DECLINING_BALANCE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        annualDepreciationRate: 20, // 20% per year
        purchaseDate: '2020-01-01',
      };

      // After 1 year: 30000 * 0.8 = 24000
      const value1 = calculateDepreciatedValue(depreciation, '2021-01-01');
      expect(value1).toBeGreaterThan(23950);
      expect(value1).toBeLessThan(24050);

      // After 2 years: 24000 * 0.8 = 19200
      const value2 = calculateDepreciatedValue(depreciation, '2022-01-01');
      expect(value2).toBeGreaterThan(19150);
      expect(value2).toBeLessThan(19250);
    });

    it('should handle manual depreciation when currentDepreciation is provided', () => {
      const depreciation: VehicleDepreciation = {
        method: 'MANUAL',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        purchaseDate: '2020-01-01',
        currentDepreciation: 10000,
      };

      const value = calculateDepreciatedValue(depreciation, '2023-01-01');
      expect(value).toBe(20000); // 30000 - 10000
    });

    it('should return purchase price for future dates', () => {
      const depreciation: VehicleDepreciation = {
        method: 'STRAIGHT_LINE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        purchaseDate: '2025-01-01',
      };

      const value = calculateDepreciatedValue(depreciation, '2020-01-01');
      expect(value).toBe(30000);
    });
  });

  describe('calculateAccumulatedDepreciation', () => {
    it('should calculate accumulated depreciation correctly', () => {
      const depreciation: VehicleDepreciation = {
        method: 'STRAIGHT_LINE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        purchaseDate: '2020-01-01',
      };

      const accumulated = calculateAccumulatedDepreciation(depreciation, '2025-01-01');
      expect(accumulated).toBeGreaterThan(12450);
      expect(accumulated).toBeLessThan(12550);
    });
  });

  describe('calculateAnnualDepreciation', () => {
    it('should calculate annual straight-line depreciation', () => {
      const depreciation: VehicleDepreciation = {
        method: 'STRAIGHT_LINE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        purchaseDate: '2020-01-01',
      };

      const annual = calculateAnnualDepreciation(depreciation);
      expect(annual).toBe(2500); // (30000 - 5000) / 10
    });

    it('should calculate annual declining balance depreciation', () => {
      const depreciation: VehicleDepreciation = {
        method: 'DECLINING_BALANCE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 10,
        annualDepreciationRate: 20,
        purchaseDate: '2020-01-01',
      };

      const annual = calculateAnnualDepreciation(depreciation);
      expect(annual).toBe(6000); // 30000 * 0.2
    });
  });

  describe('getDepreciationSchedule', () => {
    it('should generate depreciation schedule for straight-line method', () => {
      const depreciation: VehicleDepreciation = {
        method: 'STRAIGHT_LINE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 5,
        purchaseDate: '2020-01-01',
      };

      const schedule = getDepreciationSchedule(depreciation);
      
      expect(schedule).toHaveLength(6); // Year 0 to 5
      expect(schedule[0].value).toBe(30000);
      expect(schedule[0].depreciation).toBe(0);
      expect(schedule[1].value).toBeGreaterThan(24950);
      expect(schedule[1].value).toBeLessThan(25050);
      expect(schedule[5].value).toBeGreaterThan(4950);
      expect(schedule[5].value).toBeLessThan(5050);
    });

    it('should generate depreciation schedule for declining balance method', () => {
      const depreciation: VehicleDepreciation = {
        method: 'DECLINING_BALANCE',
        purchasePrice: 30000,
        salvageValue: 5000,
        usefulLifeYears: 5,
        annualDepreciationRate: 20,
        purchaseDate: '2020-01-01',
      };

      const schedule = getDepreciationSchedule(depreciation);
      
      expect(schedule).toHaveLength(6); // Year 0 to 5
      expect(schedule[0].value).toBe(30000);
      expect(schedule[1].value).toBeGreaterThan(23950);
      expect(schedule[1].value).toBeLessThan(24050);
      expect(schedule[2].value).toBeGreaterThan(19150);
      expect(schedule[2].value).toBeLessThan(19250);
    });
  });
});
