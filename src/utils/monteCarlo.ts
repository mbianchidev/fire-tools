import { 
  CalculatorInputs, 
  MonteCarloInputs, 
  MonteCarloResult, 
  SimulationRun
} from '../types/calculator';

// Cache for the second normal variate produced by the Box-Muller transform
let cachedNormal: number | null = null;

/**
 * Generate a random return based on expected return and volatility
 */
function generateRandomReturn(expectedReturn: number, volatility: number): number {
  let z: number;

  if (cachedNormal !== null) {
    // Use the cached normal variate from the previous call
    z = cachedNormal;
    cachedNormal = null;
  } else {
    // Box-Muller transform for normal distribution
    // Ensure u1 is never 0 to avoid Math.log(0)
    const u1 = Math.random() || 1e-10;
    const u2 = Math.random();

    const radius = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;

    const z0 = radius * Math.cos(theta);
    const z1 = radius * Math.sin(theta);

    z = z0;
    // Cache the second independent normal variate for the next call
    cachedNormal = z1;
  }
  
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
  
  // Validate asset allocation
  const allocationSum = inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent;
  if (Math.abs(allocationSum - 100) > 0.01) {
    throw new Error(`Asset allocation must sum to 100%, currently ${allocationSum.toFixed(2)}%`);
  }
  
  if (inputs.desiredWithdrawalRate <= 0) {
    throw new Error('desiredWithdrawalRate must be greater than 0');
  }
  
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
    
    // If stopWorkingAtFIRE is enabled, stop working once FIRE is achieved.
    // Otherwise, keep working regardless of FIRE status.
    const isWorking = inputs.stopWorkingAtFIRE ? !isFIREAchieved : true;
    
    // Calculate investment yield
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
    
    // Update portfolio
    portfolioValue = portfolioValue + portfolioChange;
    
    // Grow labor income
    if (isWorking) {
      laborIncome = laborIncome * (1 + inputs.laborIncomeGrowthRate / 100);
    }
    
    // Check for failure (portfolio significantly depleted)
    if (portfolioValue < -1000) {
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
  
  let medianYearsToFIRE = 0;
  if (successfulYears.length > 0) {
    const midIndex = Math.floor(successfulYears.length / 2);
    if (successfulYears.length % 2 === 0) {
      medianYearsToFIRE = (successfulYears[midIndex - 1] + successfulYears[midIndex]) / 2;
    } else {
      medianYearsToFIRE = successfulYears[midIndex];
    }
  }
  
  return {
    successCount,
    failureCount,
    successRate,
    medianYearsToFIRE,
    simulations,
  };
}
