/**
 * Mortgage Calculator
 * Functions for calculating mortgage payments, interest, and principal breakdown
 */

import { MortgageInfo } from '../types/netWorthTracker';
import { MortgageData } from '../types/assetAllocation';

/**
 * Calculate monthly mortgage payment using the standard amortization formula
 * M = P [ i(1 + i)^n ] / [ (1 + i)^n - 1 ]
 * where:
 * M = Monthly payment
 * P = Principal loan amount
 * i = Monthly interest rate (annual rate / 12)
 * n = Total number of payments (years * 12)
 * 
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate (e.g., 3.5 for 3.5%)
 * @param termYears - Loan term in years
 * @returns Monthly payment amount
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) {
    return 0;
  }
  
  if (annualRate === 0) {
    // No interest - simple division
    return principal / (termYears * 12);
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = termYears * 12;
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Calculate the interest and principal portions of a mortgage payment
 * 
 * @param currentBalance - Current outstanding loan balance
 * @param annualRate - Annual interest rate (e.g., 3.5 for 3.5%)
 * @param monthlyPayment - Monthly payment amount
 * @returns Object with interest and principal amounts
 */
export function calculatePaymentBreakdown(
  currentBalance: number,
  annualRate: number,
  monthlyPayment: number
): { interest: number; principal: number } {
  if (currentBalance <= 0) {
    return { interest: 0, principal: 0 };
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const interest = currentBalance * monthlyRate;
  const principal = Math.min(monthlyPayment - interest, currentBalance);
  
  return {
    interest: Math.round(interest * 100) / 100,
    principal: Math.round(principal * 100) / 100,
  };
}

/**
 * Calculate remaining balance after a payment
 * 
 * @param currentBalance - Current outstanding loan balance
 * @param principalPaid - Principal portion of the payment
 * @returns New balance after payment
 */
export function calculateRemainingBalance(
  currentBalance: number,
  principalPaid: number
): number {
  return Math.max(0, currentBalance - principalPaid);
}

/**
 * Calculate total interest paid over the life of the loan
 * 
 * @param principal - Original loan amount
 * @param annualRate - Annual interest rate (e.g., 3.5 for 3.5%)
 * @param termYears - Loan term in years
 * @returns Total interest paid
 */
export function calculateTotalInterest(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const totalPaid = monthlyPayment * termYears * 12;
  return Math.round((totalPaid - principal) * 100) / 100;
}

/**
 * Calculate equity in a property (property value - remaining mortgage balance)
 * 
 * @param propertyValue - Current property value
 * @param mortgageBalance - Current outstanding mortgage balance
 * @returns Equity amount
 */
export function calculateEquity(
  propertyValue: number,
  mortgageBalance: number
): number {
  return Math.max(0, propertyValue - mortgageBalance);
}

/**
 * Calculate loan-to-value ratio (LTV)
 * 
 * @param mortgageBalance - Current outstanding mortgage balance
 * @param propertyValue - Current property value
 * @returns LTV ratio as a percentage (e.g., 80 for 80%)
 */
export function calculateLTV(
  mortgageBalance: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) {
    return 0;
  }
  return Math.round((mortgageBalance / propertyValue) * 10000) / 100;
}

/**
 * Generate amortization schedule for a mortgage
 * Returns payment breakdown for each month
 * 
 * @param principal - Original loan amount
 * @param annualRate - Annual interest rate (e.g., 3.5 for 3.5%)
 * @param termYears - Loan term in years
 * @param maxMonths - Maximum number of months to generate (default: full term)
 * @returns Array of monthly payment details
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termYears: number,
  maxMonths?: number
): Array<{
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> = [];
  
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  let balance = principal;
  const totalMonths = maxMonths || termYears * 12;
  
  for (let month = 1; month <= totalMonths && balance > 0.01; month++) {
    const breakdown = calculatePaymentBreakdown(balance, annualRate, monthlyPayment);
    balance = calculateRemainingBalance(balance, breakdown.principal);
    
    schedule.push({
      month,
      payment: monthlyPayment,
      principal: breakdown.principal,
      interest: breakdown.interest,
      balance: Math.round(balance * 100) / 100,
    });
  }
  
  return schedule;
}

/**
 * Calculate remaining years on a mortgage based on current balance
 * 
 * @param currentBalance - Current outstanding loan balance
 * @param monthlyPayment - Monthly payment amount
 * @param annualRate - Annual interest rate (e.g., 3.5 for 3.5%)
 * @returns Remaining years (rounded to 1 decimal place)
 */
export function calculateRemainingYears(
  currentBalance: number,
  monthlyPayment: number,
  annualRate: number
): number {
  if (currentBalance <= 0 || monthlyPayment <= 0) {
    return 0;
  }
  
  if (annualRate === 0) {
    return Math.round((currentBalance / monthlyPayment / 12) * 10) / 10;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  
  // If payment is less than interest, loan will never be paid off
  const monthlyInterest = currentBalance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) {
    return Infinity;
  }
  
  // Calculate number of payments using amortization formula
  const numberOfPayments = Math.log(monthlyPayment / (monthlyPayment - currentBalance * monthlyRate)) / 
                          Math.log(1 + monthlyRate);
  
  return Math.round((numberOfPayments / 12) * 10) / 10;
}

/**
 * Update mortgage info with current month's payment breakdown
 * Useful for tracking monthly changes in a net worth tracker
 * 
 * @param mortgageInfo - Current mortgage information
 * @returns Updated mortgage info after one payment
 */
export function applyMonthlyPayment(mortgageInfo: MortgageInfo): MortgageInfo {
  const breakdown = calculatePaymentBreakdown(
    mortgageInfo.currentBalance,
    mortgageInfo.interestRate,
    mortgageInfo.monthlyPayment
  );
  
  const newBalance = calculateRemainingBalance(mortgageInfo.currentBalance, breakdown.principal);
  const remainingYears = calculateRemainingYears(
    newBalance,
    mortgageInfo.monthlyPayment,
    mortgageInfo.interestRate
  );
  
  return {
    ...mortgageInfo,
    currentBalance: newBalance,
    remainingYears,
  };
}

/**
 * Calculate net property value (property value minus mortgage balance)
 * This is the actual asset value for net worth calculations
 * 
 * @param propertyValue - Current property value
 * @param mortgageBalance - Current outstanding mortgage balance
 * @returns Net property value
 */
export function calculateNetPropertyValue(
  propertyValue: number,
  mortgageBalance: number
): number {
  return calculateEquity(propertyValue, mortgageBalance);
}

/**
 * Convert MortgageData to MortgageInfo (Asset Allocation format to Net Worth format)
 */
export function convertMortgageDataToInfo(data: MortgageData): MortgageInfo {
  return {
    principalAmount: data.principalAmount,
    currentBalance: data.currentBalance,
    interestRate: data.interestRate,
    termYears: data.termYears,
    remainingYears: data.remainingYears,
    monthlyPayment: data.monthlyPayment,
    startDate: data.startDate,
    lender: data.lender,
  };
}

/**
 * Convert MortgageInfo to MortgageData (Net Worth format to Asset Allocation format)
 */
export function convertMortgageInfoToData(info: MortgageInfo, propertyValue: number): MortgageData {
  return {
    principalAmount: info.principalAmount,
    currentBalance: info.currentBalance,
    interestRate: info.interestRate,
    termYears: info.termYears,
    remainingYears: info.remainingYears,
    monthlyPayment: info.monthlyPayment,
    startDate: info.startDate,
    propertyValue,
    lender: info.lender,
  };
}
