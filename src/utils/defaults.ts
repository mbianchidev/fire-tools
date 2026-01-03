import { CalculatorInputs } from '../types/calculator';
import { 
  NetWorthTrackerData, 
  AssetHolding, 
  CashEntry, 
  PensionEntry, 
  FinancialOperation,
  MonthlySnapshot 
} from '../types/netWorthTracker';
import { ExpenseTrackerData } from '../types/expenseTracker';
import { Asset, AssetClass, AllocationMode, SubAssetType } from '../types/assetAllocation';
import { SupportedCurrency } from '../types/currency';

// Calculate default savings rate: (income - expenses) / income * 100
const defaultIncome = 60000;
const defaultExpenses = 40000;
const defaultSavingsRate = ((defaultIncome - defaultExpenses) / defaultIncome) * 100;

// Default years of expenses for FIRE target (equivalent to 3% withdrawal rate)
const defaultYearsOfExpenses = 100 / 3; // ~33.33 years

export const DEFAULT_INPUTS: CalculatorInputs = {
  initialSavings: 50000,
  stocksPercent: 70,
  bondsPercent: 20,
  cashPercent: 10,
  currentAnnualExpenses: defaultExpenses,
  fireAnnualExpenses: 40000,
  annualLaborIncome: defaultIncome,
  laborIncomeGrowthRate: 3,
  savingsRate: defaultSavingsRate,
  desiredWithdrawalRate: 3,
  yearsOfExpenses: defaultYearsOfExpenses,
  expectedStockReturn: 7,
  expectedBondReturn: 2,
  expectedCashReturn: -2,
  yearOfBirth: 1990,
  retirementAge: 67,
  statePensionIncome: 0,
  privatePensionIncome: 0,
  otherIncome: 0,
  stopWorkingAtFIRE: true,
  maxAge: 100,
  useAssetAllocationValue: false,
  useExpenseTrackerExpenses: false,
  useExpenseTrackerIncome: false,
};

// Base values coherent with Asset Allocation demo data
const NET_WORTH_DEMO_BASE = {
  vwceShares: 85,
  vwcePrice: 110,
  agghShares: 50,
  agghPrice: 45,
  emergencyFund: 12000,
  checking: 3000,
  pension: 25000,
};

// Seeded random for consistent demo data (using seed value)
function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

/**
 * Generate demo net worth data for a specific year
 * @param targetYear - The year to generate demo data for
 * @returns Array of MonthlySnapshot for all 12 months
 */
export function generateDemoNetWorthDataForYear(targetYear: number): MonthlySnapshot[] {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  
  const months: MonthlySnapshot[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthSeed = targetYear * 100 + month;
    
    // Monthly DCA adds ~5 shares of VWCE per month
    const vwceSharesGrowth = (month - 1) * 5;
    // Price fluctuates ±8% around base with upward trend
    const vwcePriceVariation = seededRandom(monthSeed, -0.08, 0.12);
    const vwcePrice = Math.round((NET_WORTH_DEMO_BASE.vwcePrice * (1 + vwcePriceVariation + month * 0.005)) * 100) / 100;
    
    // Bond shares grow slower (~2 per month)
    const agghSharesGrowth = Math.floor((month - 1) * 2);
    // Bond prices more stable, ±3% variation
    const agghPriceVariation = seededRandom(monthSeed + 1, -0.03, 0.03);
    const agghPrice = Math.round((NET_WORTH_DEMO_BASE.agghPrice * (1 + agghPriceVariation)) * 100) / 100;
    
    // Cash grows with monthly savings, but fluctuates due to expenses
    const emergencyFundGrowth = (month - 1) * 300;
    const emergencyFundVariation = Math.round(seededRandom(monthSeed + 2, -500, 500));
    const checkingVariation = Math.round(seededRandom(monthSeed + 3, -800, 800));
    
    // Pension grows steadily with small variations
    const pensionGrowth = (month - 1) * 400;
    const pensionVariation = Math.round(seededRandom(monthSeed + 4, -200, 200));
    
    // Only freeze months if target year is current year and month is in the past
    const isFrozen = targetYear === currentYear && month < currentMonth;
    
    const assets: AssetHolding[] = [
      { 
        id: `demo-asset-${targetYear}-${month}-1`, 
        ticker: 'VWCE', 
        name: 'Vanguard FTSE All-World', 
        shares: NET_WORTH_DEMO_BASE.vwceShares + vwceSharesGrowth, 
        pricePerShare: vwcePrice, 
        currency: 'EUR' as SupportedCurrency, 
        assetClass: 'ETF' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-2`, 
        ticker: 'AGGH', 
        name: 'iShares Global Agg Bond', 
        shares: NET_WORTH_DEMO_BASE.agghShares + agghSharesGrowth, 
        pricePerShare: agghPrice, 
        currency: 'EUR' as SupportedCurrency, 
        assetClass: 'BONDS' as const
      },
    ];
    
    const cashEntries: CashEntry[] = [
      { 
        id: `demo-cash-${targetYear}-${month}-1`, 
        accountName: 'Emergency Fund', 
        accountType: 'SAVINGS' as const, 
        balance: Math.max(10000, NET_WORTH_DEMO_BASE.emergencyFund + emergencyFundGrowth + emergencyFundVariation), 
        currency: 'EUR' as SupportedCurrency 
      },
      { 
        id: `demo-cash-${targetYear}-${month}-2`, 
        accountName: 'Main Checking', 
        accountType: 'CHECKING' as const, 
        balance: Math.max(500, NET_WORTH_DEMO_BASE.checking + checkingVariation), 
        currency: 'EUR' as SupportedCurrency 
      },
    ];
    
    const pensions: PensionEntry[] = [
      { 
        id: `demo-pension-${targetYear}-${month}`, 
        name: 'State Pension', 
        pensionType: 'STATE' as const, 
        currentValue: NET_WORTH_DEMO_BASE.pension + pensionGrowth + pensionVariation, 
        currency: 'EUR' as SupportedCurrency 
      },
    ];
    
    const operations: FinancialOperation[] = month % 3 === 0 ? [
      { id: `demo-op-${targetYear}-${month}-1`, date: `${targetYear}-${String(month).padStart(2, '0')}-15`, type: 'PURCHASE' as const, description: 'Monthly DCA - VWCE', amount: 500, currency: 'EUR' as SupportedCurrency },
      { id: `demo-op-${targetYear}-${month}-2`, date: `${targetYear}-${String(month).padStart(2, '0')}-20`, type: 'DIVIDEND' as const, description: 'VWCE Dividend', amount: Math.round(seededRandom(monthSeed + 5, 80, 150)), currency: 'EUR' as SupportedCurrency },
    ] : [
      { id: `demo-op-${targetYear}-${month}-1`, date: `${targetYear}-${String(month).padStart(2, '0')}-15`, type: 'PURCHASE' as const, description: 'Monthly DCA - VWCE', amount: 500, currency: 'EUR' as SupportedCurrency },
    ];
    
    months.push({
      year: targetYear,
      month,
      assets,
      cashEntries,
      pensions,
      operations,
      isFrozen,
    });
  }
  
  return months;
}

// Demo data for Net Worth Tracker - generates 12 months of data for current year with randomized variations
export function getDemoNetWorthData(): NetWorthTrackerData {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  const months = generateDemoNetWorthDataForYear(currentYear);
  
  return {
    years: [
      {
        year: currentYear,
        months,
        isArchived: false,
      },
    ],
    currentYear,
    currentMonth,
    defaultCurrency: 'EUR',
    settings: {
      showPensionInNetWorth: true,
      includeUnrealizedGains: true,
      syncWithAssetAllocation: true, // Enable sync by default in demo data
    },
  };
}

// Demo data for Cashflow Tracker
export function getDemoCashflowData(): ExpenseTrackerData {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  
  return {
    years: [
      {
        year: prevYear,
        months: [
          {
            year: prevYear,
            month: 12,
            incomes: [
              { id: 'demo-inc-1', date: `${prevYear}-12-01`, amount: 5000, description: 'Monthly Salary', type: 'income', source: 'SALARY' },
            ],
            expenses: [
              { id: 'demo-exp-1', date: `${prevYear}-12-01`, amount: 1200, description: 'Rent', type: 'expense', category: 'HOUSING', expenseType: 'NEED' },
              { id: 'demo-exp-2', date: `${prevYear}-12-05`, amount: 350, description: 'Groceries', type: 'expense', category: 'GROCERIES', expenseType: 'NEED' },
              { id: 'demo-exp-3', date: `${prevYear}-12-10`, amount: 150, description: 'Utilities', type: 'expense', category: 'UTILITIES', expenseType: 'NEED' },
              { id: 'demo-exp-4', date: `${prevYear}-12-15`, amount: 200, description: 'Dining Out', type: 'expense', category: 'DINING_OUT', expenseType: 'WANT' },
              { id: 'demo-exp-5', date: `${prevYear}-12-20`, amount: 100, description: 'Entertainment', type: 'expense', category: 'ENTERTAINMENT', expenseType: 'WANT' },
            ],
            budgets: [],
          },
        ],
        isArchived: false,
      },
      {
        year: currentYear,
        months: [
          {
            year: currentYear,
            month: 1,
            incomes: [
              { id: 'demo-inc-2', date: `${currentYear}-01-01`, amount: 5000, description: 'Monthly Salary', type: 'income', source: 'SALARY' },
              { id: 'demo-inc-3', date: `${currentYear}-01-15`, amount: 200, description: 'Freelance Work', type: 'income', source: 'FREELANCE' },
            ],
            expenses: [
              { id: 'demo-exp-6', date: `${currentYear}-01-01`, amount: 1200, description: 'Rent', type: 'expense', category: 'HOUSING', expenseType: 'NEED' },
              { id: 'demo-exp-7', date: `${currentYear}-01-05`, amount: 380, description: 'Groceries', type: 'expense', category: 'GROCERIES', expenseType: 'NEED' },
              { id: 'demo-exp-8', date: `${currentYear}-01-10`, amount: 160, description: 'Utilities', type: 'expense', category: 'UTILITIES', expenseType: 'NEED' },
              { id: 'demo-exp-9', date: `${currentYear}-01-12`, amount: 50, description: 'Streaming Services', type: 'expense', category: 'SUBSCRIPTIONS', expenseType: 'WANT' },
              { id: 'demo-exp-10', date: `${currentYear}-01-18`, amount: 180, description: 'Dining Out', type: 'expense', category: 'DINING_OUT', expenseType: 'WANT' },
            ],
            budgets: [],
          },
        ],
        isArchived: false,
      },
    ],
    currentYear,
    currentMonth: 1,
    currency: 'EUR',
    globalBudgets: [],
  };
}

// Demo data for Asset Allocation - coherent with Net Worth demo data for current month
export function getDemoAssetAllocationData(): { 
  assets: Asset[]; 
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
} {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();
  
  // Use same calculation logic as getDemoNetWorthData for consistency
  const baseVWCEShares = 85;
  const baseVWCEPrice = 110;
  const baseAGGHShares = 50;
  const baseAGGHPrice = 45;
  const baseEmergencyFund = 12000;
  const baseChecking = 3000;
  
  const seededRandom = (seed: number, min: number, max: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  const monthSeed = currentYear * 100 + currentMonth;
  
  // Calculate current month values
  const vwceSharesGrowth = (currentMonth - 1) * 5;
  const vwcePriceVariation = seededRandom(monthSeed, -0.08, 0.12);
  const vwcePrice = Math.round((baseVWCEPrice * (1 + vwcePriceVariation + currentMonth * 0.005)) * 100) / 100;
  const vwceShares = baseVWCEShares + vwceSharesGrowth;
  
  const agghSharesGrowth = Math.floor((currentMonth - 1) * 2);
  const agghPriceVariation = seededRandom(monthSeed + 1, -0.03, 0.03);
  const agghPrice = Math.round((baseAGGHPrice * (1 + agghPriceVariation)) * 100) / 100;
  const agghShares = baseAGGHShares + agghSharesGrowth;
  
  const emergencyFundGrowth = (currentMonth - 1) * 300;
  const emergencyFundVariation = Math.round(seededRandom(monthSeed + 2, -500, 500));
  const checkingVariation = Math.round(seededRandom(monthSeed + 3, -800, 800));
  
  return {
    assets: [
      {
        id: 'demo-aa-1',
        name: 'Vanguard FTSE All-World',
        ticker: 'VWCE',
        assetClass: 'STOCKS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(vwceShares * vwcePrice * 100) / 100,
        targetMode: 'OFF' as AllocationMode,
      },
      {
        id: 'demo-aa-2',
        name: 'iShares Global Agg Bond',
        ticker: 'AGGH',
        assetClass: 'BONDS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(agghShares * agghPrice * 100) / 100,
        targetMode: 'OFF' as AllocationMode,
      },
      {
        id: 'demo-aa-3',
        name: 'Emergency Fund',
        ticker: '',
        assetClass: 'CASH' as AssetClass,
        subAssetType: 'SAVINGS_ACCOUNT' as SubAssetType,
        currentValue: Math.max(10000, baseEmergencyFund + emergencyFundGrowth + emergencyFundVariation),
        targetMode: 'OFF' as AllocationMode,
      },
      {
        id: 'demo-aa-4',
        name: 'Main Checking',
        ticker: '',
        assetClass: 'CASH' as AssetClass,
        subAssetType: 'CHECKING_ACCOUNT' as SubAssetType,
        currentValue: Math.max(500, baseChecking + checkingVariation),
        targetMode: 'OFF' as AllocationMode,
      },
    ],
    assetClassTargets: {
      STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 70 },
      BONDS: { targetMode: 'PERCENTAGE', targetPercent: 20 },
      REAL_ESTATE: { targetMode: 'OFF' },
      CRYPTO: { targetMode: 'OFF' },
      CASH: { targetMode: 'PERCENTAGE', targetPercent: 10 },
    },
  };
}
