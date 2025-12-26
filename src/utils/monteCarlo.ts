import { 
  CalculatorInputs, 
  MonteCarloInputs, 
  MonteCarloResult, 
  SimulationRun
} from '../types/calculator';

/**
 * Generate a random return based on expected return and volatility
 */
function generateRandomReturn(expectedReturn: number, volatility: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  return expectedReturn + (volatility * z);
}

/**
 * Run a single Monte Carlo simulation
 */
function runSingleSimulation(
  inputs: CalculatorInputs,
  mcInputs: MonteCarloInputs,
  simulationId: number
): SimulationRun {
  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - inputs.yearOfBirth;
  
  const fireTarget = inputs.fireAnnualExpenses / (inputs.desiredWithdrawalRate / 100);
  
  let portfolioValue = inputs.initialSavings;
  let laborIncome = inputs.annualLaborIncome;
  let isFIREAchieved = false;
  let yearsToFIRE: number | null = null;
  
  const maxYears = Math.min(50, 100 - currentAge);
  
  for (let i = 0; i < maxYears; i++) {
    const age = currentAge + i;
    
    // Check for Black Swan event
    const isBlackSwan = Math.random() < (mcInputs.blackSwanProbability / 100);
    
    // Generate random returns
    const stockReturn = isBlackSwan ? 
      mcInputs.blackSwanImpact / 100 :
      generateRandomReturn(inputs.expectedStockReturn / 100, mcInputs.stockVolatility / 100);
    
    const bondReturn = isBlackSwan ?
      mcInputs.blackSwanImpact / 200 : // bonds less affected
      generateRandomReturn(inputs.expectedBondReturn / 100, mcInputs.bondVolatility / 100);
    
    const cashReturn = inputs.expectedCashReturn / 100;
    
    // Calculate portfolio return
    const portfolioReturn = (
      (inputs.stocksPercent / 100) * stockReturn +
      (inputs.bondsPercent / 100) * bondReturn +
      (inputs.cashPercent / 100) * cashReturn
    );
    
    // Check if FIRE is achieved
    if (!isFIREAchieved && portfolioValue >= fireTarget) {
      isFIREAchieved = true;
      yearsToFIRE = i;
    }
    
    // Determine if still working
    const isWorking = !isFIREAchieved || !inputs.stopWorkingAtFIRE;
    
    // Calculate investment yield
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
    
    // Update portfolio
    // When working: add savings from labor income + investment yield
    // When not working: netSavings already includes investment yield (via totalIncome)
    portfolioValue = isWorking ? 
      portfolioValue + netSavings + investmentYield : 
      portfolioValue + netSavings;
    
    // Grow labor income
    if (isWorking) {
      laborIncome = laborIncome * (1 + inputs.laborIncomeGrowthRate / 100);
    }
    
    // Check for failure (portfolio depleted)
    if (portfolioValue < 0) {
      return {
        simulationId,
        success: false,
        yearsToFIRE: null,
        finalPortfolio: 0,
      };
    }
  }
  
  return {
    simulationId,
    success: isFIREAchieved,
    yearsToFIRE,
    finalPortfolio: portfolioValue,
  };
}

/**
 * Run Monte Carlo simulations
 */
export function runMonteCarloSimulation(
  inputs: CalculatorInputs,
  mcInputs: MonteCarloInputs
): MonteCarloResult {
  const simulations: SimulationRun[] = [];
  
  for (let i = 0; i < mcInputs.numSimulations; i++) {
    const result = runSingleSimulation(inputs, mcInputs, i + 1);
    simulations.push(result);
  }
  
  const successCount = simulations.filter(s => s.success).length;
  const failureCount = simulations.length - successCount;
  const successRate = (successCount / simulations.length) * 100;
  
  // Calculate median years to FIRE for successful simulations
  const successfulYears = simulations
    .filter(s => s.yearsToFIRE !== null)
    .map(s => s.yearsToFIRE as number)
    .sort((a, b) => a - b);
  
  const medianYearsToFIRE = successfulYears.length > 0 ?
    successfulYears[Math.floor(successfulYears.length / 2)] : 0;
  
  return {
    successCount,
    failureCount,
    successRate,
    medianYearsToFIRE,
    simulations,
  };
}
