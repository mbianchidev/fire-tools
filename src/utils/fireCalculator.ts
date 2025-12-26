import { CalculatorInputs, YearProjection, CalculationResult } from '../types/calculator';

/**
 * Calculate FIRE projection based on inputs
 */
export function calculateFIRE(inputs: CalculatorInputs): CalculationResult {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - inputs.yearOfBirth;
  const projections: YearProjection[] = [];
  
  // Calculate FIRE target based on desired withdrawal rate
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
    
    // Determine if still working
    const isWorking = !isFIREAchieved || !inputs.stopWorkingAtFIRE;
    
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
    const totalIncome = currentLaborIncome + investmentYield + pensionIncome + inputs.otherIncome;
    
    // Calculate expenses
    const expenses = isFIREAchieved ? inputs.fireAnnualExpenses : inputs.currentAnnualExpenses;
    
    // Calculate net savings
    const netSavings = isWorking ? 
      (laborIncome * (inputs.savingsRate / 100)) : 
      (totalIncome - expenses);
    
    // Store projection
    projections.push({
      year,
      age,
      laborIncome: currentLaborIncome,
      investmentYield,
      totalIncome,
      expenses,
      netSavings,
      portfolioValue,
      fireTarget,
      isFIRE: isFIREAchieved,
    });
    
    // Update portfolio for next year
    // When working: add savings from labor income + investment yield
    // When not working: netSavings already includes investment yield (via totalIncome)
    portfolioValue = isWorking ? 
      portfolioValue + netSavings + investmentYield : 
      portfolioValue + netSavings;
    
    // Grow labor income
    if (isWorking) {
      laborIncome = laborIncome * (1 + inputs.laborIncomeGrowthRate / 100);
    }
    
    // Stop if portfolio is depleted
    if (portfolioValue < 0) {
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
