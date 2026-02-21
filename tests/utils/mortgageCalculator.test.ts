import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyPayment,
  calculatePaymentBreakdown,
  calculateRemainingBalance,
  calculateTotalInterest,
  calculateEquity,
  calculateLTV,
  generateAmortizationSchedule,
  calculateRemainingYears,
  applyMonthlyPayment,
  calculateNetPropertyValue,
} from '../../src/utils/mortgageCalculator';
import { MortgageInfo } from '../../src/types/netWorthTracker';

describe('Mortgage Calculator', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate monthly payment correctly', () => {
      // $300,000 loan at 3.5% for 30 years
      const payment = calculateMonthlyPayment(300000, 3.5, 30);
      
      // Expected: ~$1347.13
      expect(payment).toBeCloseTo(1347.13, 1);
    });

    it('should handle zero interest rate', () => {
      const payment = calculateMonthlyPayment(300000, 0, 30);
      
      // Expected: 300000 / (30 * 12) = 833.33
      expect(payment).toBeCloseTo(833.33, 2);
    });

    it('should return 0 for zero principal', () => {
      const payment = calculateMonthlyPayment(0, 3.5, 30);
      expect(payment).toBe(0);
    });

    it('should return 0 for zero term', () => {
      const payment = calculateMonthlyPayment(300000, 3.5, 0);
      expect(payment).toBe(0);
    });
  });

  describe('calculatePaymentBreakdown', () => {
    it('should calculate interest and principal correctly', () => {
      const breakdown = calculatePaymentBreakdown(300000, 3.5, 1347.13);
      
      // First month interest: 300000 * (3.5/100/12) = 875
      expect(breakdown.interest).toBeCloseTo(875, 0);
      
      // First month principal: 1347.13 - 875 = 472.13
      expect(breakdown.principal).toBeCloseTo(472.13, 0);
    });

    it('should not exceed remaining balance', () => {
      const breakdown = calculatePaymentBreakdown(500, 3.5, 1347.13);
      
      // Principal should not exceed balance
      expect(breakdown.principal).toBeLessThanOrEqual(500);
    });

    it('should handle zero balance', () => {
      const breakdown = calculatePaymentBreakdown(0, 3.5, 1347.13);
      
      expect(breakdown.interest).toBe(0);
      expect(breakdown.principal).toBe(0);
    });
  });

  describe('calculateRemainingBalance', () => {
    it('should calculate remaining balance correctly', () => {
      const remaining = calculateRemainingBalance(300000, 472.13);
      expect(remaining).toBeCloseTo(299527.87, 2);
    });

    it('should not go below zero', () => {
      const remaining = calculateRemainingBalance(500, 1000);
      expect(remaining).toBe(0);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest over loan life', () => {
      const totalInterest = calculateTotalInterest(300000, 3.5, 30);
      
      // Expected: ~$184,968
      expect(totalInterest).toBeGreaterThan(180000);
      expect(totalInterest).toBeLessThan(190000);
    });
  });

  describe('calculateEquity', () => {
    it('should calculate equity correctly', () => {
      const equity = calculateEquity(400000, 250000);
      expect(equity).toBe(150000);
    });

    it('should return 0 for negative equity', () => {
      const equity = calculateEquity(200000, 250000);
      expect(equity).toBe(0);
    });
  });

  describe('calculateLTV', () => {
    it('should calculate loan-to-value ratio correctly', () => {
      const ltv = calculateLTV(250000, 400000);
      expect(ltv).toBe(62.5);
    });

    it('should return 0 for zero property value', () => {
      const ltv = calculateLTV(250000, 0);
      expect(ltv).toBe(0);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate amortization schedule', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule.length).toBeLessThanOrEqual(120); // 10 years * 12 months
      
      // First payment
      expect(schedule[0].month).toBe(1);
      expect(schedule[0].payment).toBeGreaterThan(0);
      expect(schedule[0].interest).toBeGreaterThan(0);
      expect(schedule[0].principal).toBeGreaterThan(0);
      
      // Balance should decrease over time
      expect(schedule[schedule.length - 1].balance).toBeLessThan(schedule[0].balance);
      expect(schedule[schedule.length - 1].balance).toBeCloseTo(0, 0);
    });

    it('should respect maxMonths parameter', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10, 12);
      expect(schedule.length).toBeLessThanOrEqual(12);
    });
  });

  describe('calculateRemainingYears', () => {
    it('should calculate remaining years correctly', () => {
      const monthlyPayment = calculateMonthlyPayment(300000, 3.5, 30);
      const remainingYears = calculateRemainingYears(300000, monthlyPayment, 3.5);
      
      expect(remainingYears).toBeCloseTo(30, 0);
    });

    it('should return 0 for zero balance', () => {
      const remainingYears = calculateRemainingYears(0, 1347.13, 3.5);
      expect(remainingYears).toBe(0);
    });

    it('should return Infinity for insufficient payment', () => {
      const remainingYears = calculateRemainingYears(300000, 500, 3.5);
      expect(remainingYears).toBe(Infinity);
    });

    it('should handle zero interest rate', () => {
      const remainingYears = calculateRemainingYears(120000, 1000, 0);
      expect(remainingYears).toBe(10); // 120000 / 1000 / 12 = 10
    });
  });

  describe('applyMonthlyPayment', () => {
    it('should update mortgage info after payment', () => {
      const mortgageInfo: MortgageInfo = {
        principalAmount: 300000,
        currentBalance: 300000,
        interestRate: 3.5,
        termYears: 30,
        remainingYears: 30,
        monthlyPayment: 1347.13,
        startDate: '2020-01-01',
      };

      const updated = applyMonthlyPayment(mortgageInfo);
      
      expect(updated.currentBalance).toBeLessThan(300000);
      expect(updated.remainingYears).toBeLessThan(30);
      expect(updated.principalAmount).toBe(300000); // Principal should not change
    });
  });

  describe('calculateNetPropertyValue', () => {
    it('should calculate net property value correctly', () => {
      const netValue = calculateNetPropertyValue(400000, 250000);
      expect(netValue).toBe(150000);
    });

    it('should return 0 for underwater property', () => {
      const netValue = calculateNetPropertyValue(200000, 250000);
      expect(netValue).toBe(0);
    });
  });
});
