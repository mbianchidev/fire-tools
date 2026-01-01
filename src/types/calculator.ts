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
  yearsOfExpenses: number; // Years of expenses needed for FIRE (default: ~33.33, equivalent to 3% withdrawal rate)
  
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
  maxAge: number; // Maximum age for projections (default 100)
  useAssetAllocationValue: boolean; // When true, use asset allocation total as portfolio value
  useExpenseTrackerExpenses: boolean; // When true, calculate current expenses from last 12 months of expense tracker
  useExpenseTrackerIncome: boolean; // When true, calculate labor income from last 12 months of expense tracker
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
  // Additional income breakdown for chart display
  statePensionIncome: number;
  privatePensionIncome: number;
  otherIncome: number;
}

export interface CalculationResult {
  projections: YearProjection[];
  yearsToFIRE: number;
  fireTarget: number;
  finalPortfolioValue: number;
  validationErrors?: string[];
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
