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
  
  // Calculate FIRE target based on desired withdrawal rate
  if (inputs.desiredWithdrawalRate <= 0) {
    throw new Error('desiredWithdrawalRate must be greater than 0');
  }
  const fireTarget = inputs.fireAnnualExpenses / (inputs.desiredWithdrawalRate / 100);
  
  let portfolioValue = inputs.initialSavings;
  let laborIncome = inputs.annualLaborIncome;
  let isFIREAchieved = false;
  let yearsToFIRE = -1;
  
  // Project up to 50 years or until age 100
  const maxYears = Math.min(50, 100 - currentAge);
  
  for (let i = 0; i < maxYears; i++) {
    const year = currentYear + i;
    const age = currentAge + i;
    
    // Check if FIRE is achieved
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
    const pensionIncome = age >= inputs.retirementAge ? 
      inputs.statePensionIncome + inputs.privatePensionIncome : 0;
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
    });
    
    // Update portfolio for next year
    portfolioValue = portfolioValue + portfolioChange;
    
    // Grow labor income
    if (isWorking) {
      laborIncome = laborIncome * (1 + inputs.laborIncomeGrowthRate / 100);
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
