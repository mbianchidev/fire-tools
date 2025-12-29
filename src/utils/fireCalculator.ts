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
  
  let portfolioValue = 0; // Start with 0 at birth
  let laborIncome = inputs.annualLaborIncome;
  let isFIREAchieved = false;
  let yearsToFIRE = -1;
  
  // Project from birth (age 0) to age 100
  const birthYear = inputs.yearOfBirth;
  const maxYears = 101; // Age 0 through 100 inclusive
  
  for (let i = 0; i < maxYears; i++) {
    const age = i; // Age starts at 0
    const year = birthYear + i;
    
    // Determine if person has reached current age yet
    const hasReachedCurrentAge = age >= currentAge;
    
    // At current age, initialize the portfolio with initial savings
    if (age === currentAge) {
      portfolioValue = inputs.initialSavings;
    }
    
    // Check if FIRE is achieved (only after reaching current age)
    const justAchievedFIRE = hasReachedCurrentAge && !isFIREAchieved && portfolioValue >= fireTarget;
    if (justAchievedFIRE) {
      isFIREAchieved = true;
      yearsToFIRE = age - currentAge; // Years from current age to FIRE
    }
    
    // If stopWorkingAtFIRE is enabled, stop working once FIRE is achieved.
    // Otherwise, keep working regardless of FIRE status.
    // Only work after reaching current age
    const isWorking = hasReachedCurrentAge && (inputs.stopWorkingAtFIRE ? !isFIREAchieved : true);
    
    // Calculate investment yield based on asset allocation
    const portfolioReturn = (
      (inputs.stocksPercent / 100) * (inputs.expectedStockReturn / 100) +
      (inputs.bondsPercent / 100) * (inputs.expectedBondReturn / 100) +
      (inputs.cashPercent / 100) * (inputs.expectedCashReturn / 100)
    );
    const investmentYield = hasReachedCurrentAge ? portfolioValue * portfolioReturn : 0;
    
    // Calculate income (only after reaching current age)
    const currentLaborIncome = isWorking ? laborIncome : 0;
    const pensionIncome = hasReachedCurrentAge && age >= inputs.retirementAge ? 
      inputs.statePensionIncome + inputs.privatePensionIncome : 0;
    const otherIncomeTotal = hasReachedCurrentAge ? pensionIncome + inputs.otherIncome : 0;
    const totalIncome = currentLaborIncome + investmentYield + otherIncomeTotal;
    
    // Calculate expenses (only after reaching current age)
    const expenses = hasReachedCurrentAge ? (isFIREAchieved ? inputs.fireAnnualExpenses : inputs.currentAnnualExpenses) : 0;
    
    // Calculate net change in portfolio
    let portfolioChange: number;
    if (!hasReachedCurrentAge) {
      // Before current age: no portfolio changes
      portfolioChange = 0;
    } else if (isWorking) {
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
    
    // Grow labor income (only after current age)
    if (isWorking && hasReachedCurrentAge) {
      laborIncome = laborIncome * (1 + inputs.laborIncomeGrowthRate / 100);
    }
    
    // Stop if portfolio is significantly depleted (only after current age)
    if (hasReachedCurrentAge && portfolioValue < -1000) {
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
