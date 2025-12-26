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
    const otherIncomeTotal = pensionIncome + inputs.otherIncome;
    const totalIncome = currentLaborIncome + investmentYield + otherIncomeTotal;
    
    // Calculate expenses
    const expenses = isFIREAchieved ? inputs.fireAnnualExpenses : inputs.currentAnnualExpenses;
    
    // Calculate net change in portfolio
    let portfolioChange: number;
    if (isWorking) {
      // While working: save a percentage of labor income, plus all investment returns
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
