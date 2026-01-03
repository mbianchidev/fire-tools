import { CalculatorInputs, YearProjection, CalculationResult } from '../types/calculator';
import { 
  calculateAnnualExpensesFromTracker, 
  calculateAnnualIncomeFromTracker 
} from './expenseTrackerIntegration';

/**
 * Get effective calculator inputs with values from expense tracker if enabled
 */
export function getEffectiveInputs(inputs: CalculatorInputs): CalculatorInputs {
  const effectiveInputs = { ...inputs };
  
  // Replace currentAnnualExpenses if using expense tracker
  if (inputs.useExpenseTrackerExpenses) {
    effectiveInputs.currentAnnualExpenses = calculateAnnualExpensesFromTracker(
      undefined,
      Math.abs(inputs.expectedCashReturn)
    );
  }
  
  // Replace annualLaborIncome if using expense tracker
  if (inputs.useExpenseTrackerIncome) {
    effectiveInputs.annualLaborIncome = calculateAnnualIncomeFromTracker(
      undefined,
      inputs.laborIncomeGrowthRate
    );
  }
  
  return effectiveInputs;
}

/**
 * Calculate years of expenses from withdrawal rate
 * Formula: yearsOfExpenses = 100 / withdrawalRate
 * Returns value rounded to 2 decimal places
 * Returns 0 if withdrawalRate is 0 (FIRE is achieved with any amount)
 */
export function calculateYearsOfExpenses(withdrawalRate: number): number {
  if (withdrawalRate === 0) {
    return 0;
  }
  const years = 100 / withdrawalRate;
  return Math.round(years * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate FIRE projection based on inputs
 */
export function calculateFIRE(inputs: CalculatorInputs): CalculationResult {
  // Get effective inputs with expense tracker values if enabled
  const effectiveInputs = getEffectiveInputs(inputs);
  
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - effectiveInputs.yearOfBirth;
  const projections: YearProjection[] = [];
  const validationErrors: string[] = [];
  
  // Validate asset allocation
  const allocationSum = effectiveInputs.stocksPercent + effectiveInputs.bondsPercent + effectiveInputs.cashPercent;
  if (Math.abs(allocationSum - 100) > 0.01) {
    validationErrors.push(`Asset allocation must sum to 100%, currently ${allocationSum.toFixed(2)}%`);
  }
  
  // Validate withdrawal rate (must not be negative)
  if (effectiveInputs.desiredWithdrawalRate < 0) {
    validationErrors.push('Withdrawal rate cannot be negative');
  }
  
  // Validate reasonable ranges for inputs to prevent calculation errors
  if (effectiveInputs.currentAnnualExpenses < 0) {
    validationErrors.push('Current annual expenses cannot be negative');
  }
  
  if (effectiveInputs.fireAnnualExpenses < 0) {
    validationErrors.push('FIRE annual expenses cannot be negative');
  }
  
  if (effectiveInputs.annualLaborIncome < 0) {
    validationErrors.push('Annual labor income cannot be negative');
  }
  
  if (effectiveInputs.maxAge < currentAge) {
    validationErrors.push('Maximum age must be greater than or equal to current age');
  }
  
  if (effectiveInputs.maxAge > 150) {
    validationErrors.push('Maximum age must be 150 or less');
  }
  
  // Check for extreme values that could cause calculation issues
  const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 1000; // Conservative limit
  if (effectiveInputs.initialSavings > MAX_SAFE_VALUE || 
      effectiveInputs.currentAnnualExpenses > MAX_SAFE_VALUE ||
      effectiveInputs.fireAnnualExpenses > MAX_SAFE_VALUE ||
      effectiveInputs.annualLaborIncome > MAX_SAFE_VALUE) {
    validationErrors.push('Input values are too large for calculation');
  }
  
  // If there are validation errors, return early with empty projections
  if (validationErrors.length > 0) {
    return {
      projections: [],
      yearsToFIRE: -1,
      fireTarget: 0,
      finalPortfolioValue: 0,
      validationErrors,
    };
  }
  
  // Calculate FIRE target based on years of expenses parameter
  // Special case: if withdrawal rate is 0, FIRE is achieved immediately (no savings needed)
  // Otherwise, FIRE target = annual expenses × years of expenses needed
  let fireTarget: number;
  if (effectiveInputs.desiredWithdrawalRate === 0) {
    fireTarget = 0; // FIRE is achieved with any amount if withdrawal rate is 0
  } else {
    // Use yearsOfExpenses directly to calculate FIRE target
    fireTarget = effectiveInputs.fireAnnualExpenses * effectiveInputs.yearsOfExpenses;
    // Check if fireTarget is reasonable
    if (!isFinite(fireTarget) || fireTarget > MAX_SAFE_VALUE) {
      validationErrors.push('FIRE target calculation resulted in an invalid value');
      return {
        projections: [],
        yearsToFIRE: -1,
        fireTarget: 0,
        finalPortfolioValue: 0,
        validationErrors,
      };
    }
  }
  
  let portfolioValue = effectiveInputs.initialSavings;
  let laborIncome = effectiveInputs.annualLaborIncome;
  let isFIREAchieved = effectiveInputs.desiredWithdrawalRate === 0; // FIRE achieved immediately if withdrawal rate is 0
  let yearsToFIRE = effectiveInputs.desiredWithdrawalRate === 0 ? 0 : -1;
  
  // Project from current age to maxAge
  const maxYears = Math.max(0, effectiveInputs.maxAge - currentAge + 1);
  
  for (let i = 0; i < maxYears; i++) {
    const year = currentYear + i;
    const age = currentAge + i;
    
    // Check if FIRE is achieved (skip if already achieved at start due to withdrawal rate = 0)
    const justAchievedFIRE = !isFIREAchieved && portfolioValue >= fireTarget;
    if (justAchievedFIRE) {
      isFIREAchieved = true;
      yearsToFIRE = i;
    }
    
    // If stopWorkingAtFIRE is enabled, stop working once FIRE is achieved.
    // Otherwise, keep working regardless of FIRE status.
    const isWorking = effectiveInputs.stopWorkingAtFIRE ? !isFIREAchieved : true;
    
    // Calculate investment yield based on asset allocation
    const portfolioReturn = (
      (effectiveInputs.stocksPercent / 100) * (effectiveInputs.expectedStockReturn / 100) +
      (effectiveInputs.bondsPercent / 100) * (effectiveInputs.expectedBondReturn / 100) +
      (effectiveInputs.cashPercent / 100) * (effectiveInputs.expectedCashReturn / 100)
    );
    const investmentYield = portfolioValue * portfolioReturn;
    
    // Calculate income
    const currentLaborIncome = isWorking ? laborIncome : 0;
    // Pension income only starts at retirement age
    const currentStatePension = age >= effectiveInputs.retirementAge ? effectiveInputs.statePensionIncome : 0;
    const currentPrivatePension = age >= effectiveInputs.retirementAge ? effectiveInputs.privatePensionIncome : 0;
    const pensionIncome = currentStatePension + currentPrivatePension;
    const otherIncomeTotal = pensionIncome + effectiveInputs.otherIncome;
    const totalIncome = currentLaborIncome + investmentYield + otherIncomeTotal;
    
    // Calculate expenses
    const expenses = isFIREAchieved ? effectiveInputs.fireAnnualExpenses : effectiveInputs.currentAnnualExpenses;
    
    // Calculate net change in portfolio
    let portfolioChange: number;
    if (isWorking) {
      // While working: save a percentage of labor income, plus all investment returns
      // The savings rate already accounts for expenses (if you save 30%, you spend 70%)
      const laborSavings = laborIncome * (effectiveInputs.savingsRate / 100);
      portfolioChange = laborSavings + investmentYield;
    } else {
      // Not working: live off portfolio (income - expenses, including investment returns)
      portfolioChange = totalIncome - expenses;
    }
    
    // Store projection (netSavings is the change for display purposes)
    projections.push({
      year,
      age,
      laborIncome: currentLaborIncome,
      investmentYield,
      totalIncome,
      expenses,
      netSavings: portfolioChange,
      portfolioValue,
      fireTarget,
      isFIRE: isFIREAchieved,
      statePensionIncome: currentStatePension,
      privatePensionIncome: currentPrivatePension,
      otherIncome: effectiveInputs.otherIncome,
    });
    
    // Update portfolio for next year
    portfolioValue = portfolioValue + portfolioChange;
    
    // Safety check: if portfolio value becomes too large or invalid, stop calculation
    const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 1000;
    if (!isFinite(portfolioValue) || Math.abs(portfolioValue) > MAX_SAFE_VALUE) {
      break;
    }
    
    // Grow labor income
    if (isWorking) {
      laborIncome = laborIncome * (1 + effectiveInputs.laborIncomeGrowthRate / 100);
      // Safety check for labor income growth
      if (!isFinite(laborIncome) || laborIncome > MAX_SAFE_VALUE) {
        laborIncome = MAX_SAFE_VALUE;
      }
    }
    
    // Stop if portfolio is significantly depleted
    if (portfolioValue < -1000) {
      break;
    }
  }
  
  return {
    projections,
    yearsToFIRE: yearsToFIRE >= 0 ? yearsToFIRE : -1,
    fireTarget,
    finalPortfolioValue: projections[projections.length - 1]?.portfolioValue || 0,
  };
}
