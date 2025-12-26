/**
 * FIRE Calculator Types
 */

export interface CalculatorInputs {
  // Initial Values
  initialSavings: number;
  
  // Asset Allocation (must sum to 100)
  stocksPercent: number;
  bondsPercent: number;
  cashPercent: number;
  
  // Expenses
  currentAnnualExpenses: number;
  fireAnnualExpenses: number;
  
  // Income
  annualLaborIncome: number;
  laborIncomeGrowthRate: number;
  
  // Savings
  savingsRate: number;
  
  // FIRE Target
  desiredWithdrawalRate: number;
  
  // Expected Returns
  expectedStockReturn: number;
  expectedBondReturn: number;
  expectedCashReturn: number; // typically negative (inflation)
  
  // Personal Info
  yearOfBirth: number;
  retirementAge: number;
  
  // Other Income
  statePensionIncome: number;
  privatePensionIncome: number;
  otherIncome: number;
  
  // Options
  stopWorkingAtFIRE: boolean;
}

export interface YearProjection {
  year: number;
  age: number;
  laborIncome: number;
  investmentYield: number;
  totalIncome: number;
  expenses: number;
  netSavings: number;
  portfolioValue: number;
  fireTarget: number;
  isFIRE: boolean;
}

export interface CalculationResult {
  projections: YearProjection[];
  yearsToFIRE: number;
  fireTarget: number;
  finalPortfolioValue: number;
}

export interface MonteCarloInputs {
  numSimulations: number;
  stockVolatility: number;
  bondVolatility: number;
  blackSwanProbability: number;
  blackSwanImpact: number;
}

export interface MonteCarloResult {
  successCount: number;
  failureCount: number;
  successRate: number;
  medianYearsToFIRE: number;
  simulations: SimulationRun[];
}

export interface SimulationRun {
  simulationId: number;
  success: boolean;
  yearsToFIRE: number | null;
  finalPortfolio: number;
}
