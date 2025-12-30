import { CalculatorInputs, YearProjection, CalculationResult } from '../types/calculator';

/**
 * Calculate FIRE projection based on inputs
 */
export function calculateFIRE(inputs: CalculatorInputs): CalculationResult {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - inputs.yearOfBirth;
  const projections: YearProjection[] = [];
  const validationErrors: string[] = [];
  
  // Validate asset allocation
  const allocationSum = inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent;
  if (Math.abs(allocationSum - 100) > 0.01) {
    validationErrors.push(`Asset allocation must sum to 100%, currently ${allocationSum.toFixed(2)}%`);
  }
  
  // Validate withdrawal rate (must not be negative)
  if (inputs.desiredWithdrawalRate < 0) {
    validationErrors.push('Withdrawal rate cannot be negative');
  }
  
  // Validate reasonable ranges for inputs to prevent calculation errors
  if (inputs.currentAnnualExpenses < 0) {
    validationErrors.push('Current annual expenses cannot be negative');
  }
  
  if (inputs.fireAnnualExpenses < 0) {
    validationErrors.push('FIRE annual expenses cannot be negative');
  }
  
  if (inputs.annualLaborIncome < 0) {
    validationErrors.push('Annual labor income cannot be negative');
  }
  
  if (inputs.maxAge < currentAge) {
    validationErrors.push('Maximum age must be greater than or equal to current age');
  }
  
  if (inputs.maxAge > 150) {
    validationErrors.push('Maximum age must be 150 or less');
  }
  
  // Check for extreme values that could cause calculation issues
  const MAX_SAFE_VALUE = Number.MAX_SAFE_INTEGER / 1000; // Conservative limit
  if (inputs.initialSavings > MAX_SAFE_VALUE || 
      inputs.currentAnnualExpenses > MAX_SAFE_VALUE ||
      inputs.fireAnnualExpenses > MAX_SAFE_VALUE ||
      inputs.annualLaborIncome > MAX_SAFE_VALUE) {
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
  if (inputs.desiredWithdrawalRate === 0) {
    fireTarget = 0; // FIRE is achieved with any amount if withdrawal rate is 0
  } else {
    // Use yearsOfExpenses directly to calculate FIRE target
    fireTarget = inputs.fireAnnualExpenses * inputs.yearsOfExpenses;
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
  
  let portfolioValue = inputs.initialSavings;
  let laborIncome = inputs.annualLaborIncome;
  let isFIREAchieved = inputs.desiredWithdrawalRate === 0; // FIRE achieved immediately if withdrawal rate is 0
  let yearsToFIRE = inputs.desiredWithdrawalRate === 0 ? 0 : -1;
  
  // Project from current age to maxAge
  const maxYears = Math.max(0, inputs.maxAge - currentAge + 1);
  
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
    const isWorking = inputs.stopWorkingAtFIRE ? !isFIREAchieved : true;
    
    // Calculate investment yield based on asset allocation
    const portfolioReturn = (
      (inputs.stocksPercent / 100) * (inputs.expectedStockReturn / 100) +
      (inputs.bondsPercent / 100) * (inputs.expectedBondReturn / 100) +
      (inputs.cashPercent / 100) * (inputs.expectedCashReturn / 100)
    );
    const investmentYield = portfolioValue * portfolioReturn;
    
    // Calculate income
    const currentLaborIncome = isWorking ? laborIncome : 0;
    // Pension income only starts at retirement age
    const currentStatePension = age >= inputs.retirementAge ? inputs.statePensionIncome : 0;
    const currentPrivatePension = age >= inputs.retirementAge ? inputs.privatePensionIncome : 0;
    const pensionIncome = currentStatePension + currentPrivatePension;
    const otherIncomeTotal = pensionIncome + inputs.otherIncome;
    const totalIncome = currentLaborIncome + investmentYield + otherIncomeTotal;
    
    // Calculate expenses
    const expenses = isFIREAchieved ? inputs.fireAnnualExpenses : inputs.currentAnnualExpenses;
    
    // Calculate net change in portfolio
    let portfolioChange: number;
    if (isWorking) {
      // While working: save a percentage of labor income, plus all investment returns
      // The savings rate already accounts for expenses (if you save 30%, you spend 70%)
      const laborSavings = laborIncome * (inputs.savingsRate / 100);
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
      otherIncome: inputs.otherIncome,
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
      laborIncome = laborIncome * (1 + inputs.laborIncomeGrowthRate / 100);
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
