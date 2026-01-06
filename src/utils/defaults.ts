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
// Total portfolio: €70,000 (€65,000 non-cash + €5,000 cash)
// Stocks: €35,000 (5 ETFs), Bonds: €30,000 (3 ETFs), Cash: €5,000
const NET_WORTH_DEMO_BASE = {
  // STOCKS - €35,000 total (5 ETFs @ €7,000 each)
  // SPY: 11.961 shares @ €585.21 = €7,000
  spyShares: 11.961,
  spyPrice: 585.21,
  // VTI: 29.346 shares @ €238.54 = €7,000
  vtiShares: 29.346,
  vtiPrice: 238.54,
  // VXUS: 112.090 shares @ €62.45 = €7,000
  vxusShares: 112.090,
  vxusPrice: 62.45,
  // VWO: 165.947 shares @ €42.18 = €7,000
  vwoShares: 165.947,
  vwoPrice: 42.18,
  // VBR: 41.410 shares @ €169.08 = €7,000
  vbrShares: 41.410,
  vbrPrice: 169.08,
  // BONDS - €30,000 total (3 ETFs @ €10,000 each)
  // BND: 158.876 shares @ €62.94 = €10,000
  bndShares: 158.876,
  bndPrice: 62.94,
  // TIP: 108.343 shares @ €92.30 = €10,000
  tipShares: 108.343,
  tipPrice: 92.30,
  // BNDX: 242.582 shares @ €41.23 = €10,000
  bndxShares: 242.582,
  bndxPrice: 41.23,
  // Cash totals: €5,000 (€3,500 + €1,500)
  emergencyFund: 3500,
  checking: 1500,
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
    
    // SPY (S&P 500) - shares stay relatively stable
    const spyPriceVariation = seededRandom(monthSeed, -0.08, 0.12);
    const spyPrice = Math.round((NET_WORTH_DEMO_BASE.spyPrice * (1 + spyPriceVariation + month * 0.005)) * 100) / 100;
    
    // VTI (Total Stock Market) - shares stay relatively stable
    const vtiPriceVariation = seededRandom(monthSeed + 1, -0.08, 0.12);
    const vtiPrice = Math.round((NET_WORTH_DEMO_BASE.vtiPrice * (1 + vtiPriceVariation + month * 0.005)) * 100) / 100;
    
    // VXUS (International) - shares stay relatively stable
    const vxusPriceVariation = seededRandom(monthSeed + 2, -0.08, 0.12);
    const vxusPrice = Math.round((NET_WORTH_DEMO_BASE.vxusPrice * (1 + vxusPriceVariation + month * 0.005)) * 100) / 100;
    
    // VWO (Emerging Markets) - more volatile
    const vwoPriceVariation = seededRandom(monthSeed + 3, -0.12, 0.15);
    const vwoPrice = Math.round((NET_WORTH_DEMO_BASE.vwoPrice * (1 + vwoPriceVariation + month * 0.005)) * 100) / 100;
    
    // VBR (Small Cap) - more volatile
    const vbrPriceVariation = seededRandom(monthSeed + 4, -0.10, 0.13);
    const vbrPrice = Math.round((NET_WORTH_DEMO_BASE.vbrPrice * (1 + vbrPriceVariation + month * 0.005)) * 100) / 100;
    
    // BND (Total Bond Market) - less volatile
    const bndPriceVariation = seededRandom(monthSeed + 5, -0.03, 0.03);
    const bndPrice = Math.round((NET_WORTH_DEMO_BASE.bndPrice * (1 + bndPriceVariation)) * 100) / 100;
    
    // TIP (Inflation-Protected Bonds) - less volatile
    const tipPriceVariation = seededRandom(monthSeed + 6, -0.03, 0.03);
    const tipPrice = Math.round((NET_WORTH_DEMO_BASE.tipPrice * (1 + tipPriceVariation)) * 100) / 100;
    
    // BNDX (International Bonds) - less volatile
    const bndxPriceVariation = seededRandom(monthSeed + 7, -0.03, 0.03);
    const bndxPrice = Math.round((NET_WORTH_DEMO_BASE.bndxPrice * (1 + bndxPriceVariation)) * 100) / 100;
    
    // Cash grows with monthly savings, but fluctuates due to expenses
    const emergencyFundGrowth = (month - 1) * 200;
    const emergencyFundVariation = Math.round(seededRandom(monthSeed + 8, -300, 300));
    const checkingVariation = Math.round(seededRandom(monthSeed + 9, -500, 500));
    
    // Pension grows steadily with small variations
    const pensionGrowth = (month - 1) * 400;
    const pensionVariation = Math.round(seededRandom(monthSeed + 10, -200, 200));
    
    // Only freeze months if target year is current year and month is in the past
    const isFrozen = targetYear === currentYear && month < currentMonth;
    
    const assets: AssetHolding[] = [
      // STOCKS (5 ETFs)
      { 
        id: `demo-asset-${targetYear}-${month}-1`, 
        ticker: 'SPY', 
        name: 'S&P 500 Index', 
        shares: NET_WORTH_DEMO_BASE.spyShares, 
        pricePerShare: spyPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'STOCKS' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-2`, 
        ticker: 'VTI', 
        name: 'Total Stock Market', 
        shares: NET_WORTH_DEMO_BASE.vtiShares, 
        pricePerShare: vtiPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'STOCKS' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-3`, 
        ticker: 'VXUS', 
        name: 'Total International Stock', 
        shares: NET_WORTH_DEMO_BASE.vxusShares, 
        pricePerShare: vxusPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'STOCKS' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-4`, 
        ticker: 'VWO', 
        name: 'Emerging Markets', 
        shares: NET_WORTH_DEMO_BASE.vwoShares, 
        pricePerShare: vwoPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'STOCKS' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-5`, 
        ticker: 'VBR', 
        name: 'Small Cap Value', 
        shares: NET_WORTH_DEMO_BASE.vbrShares, 
        pricePerShare: vbrPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'STOCKS' as const
      },
      // BONDS (3 ETFs)
      { 
        id: `demo-asset-${targetYear}-${month}-6`, 
        ticker: 'BND', 
        name: 'Total Bond Market', 
        shares: NET_WORTH_DEMO_BASE.bndShares, 
        pricePerShare: bndPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'BONDS' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-7`, 
        ticker: 'TIP', 
        name: 'Inflation-Protected Bonds', 
        shares: NET_WORTH_DEMO_BASE.tipShares, 
        pricePerShare: tipPrice, 
        currency: 'EUR' as SupportedCurrency, 
        assetClass: 'BONDS' as const
      },
      { 
        id: `demo-asset-${targetYear}-${month}-8`, 
        ticker: 'BNDX', 
        name: 'International Bond', 
        shares: NET_WORTH_DEMO_BASE.bndxShares, 
        pricePerShare: bndxPrice, 
        currency: 'USD' as SupportedCurrency, 
        assetClass: 'BONDS' as const
      },
    ];
    
    const cashEntries: CashEntry[] = [
      { 
        id: `demo-cash-${targetYear}-${month}-1`, 
        accountName: 'Emergency Fund', 
        accountType: 'SAVINGS' as const, 
        balance: Math.max(2000, NET_WORTH_DEMO_BASE.emergencyFund + emergencyFundGrowth + emergencyFundVariation), 
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
      { id: `demo-op-${targetYear}-${month}-1`, date: `${targetYear}-${String(month).padStart(2, '0')}-15`, type: 'PURCHASE' as const, description: 'Monthly DCA - Various ETFs', amount: 500, currency: 'EUR' as SupportedCurrency },
      { id: `demo-op-${targetYear}-${month}-2`, date: `${targetYear}-${String(month).padStart(2, '0')}-20`, type: 'DIVIDEND' as const, description: 'ETF Dividends', amount: Math.round(seededRandom(monthSeed + 11, 80, 150)), currency: 'EUR' as SupportedCurrency },
    ] : [
      { id: `demo-op-${targetYear}-${month}-1`, date: `${targetYear}-${String(month).padStart(2, '0')}-15`, type: 'PURCHASE' as const, description: 'Monthly DCA - Various ETFs', amount: 500, currency: 'EUR' as SupportedCurrency },
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
              { id: 'demo-inc-1', date: `${prevYear}-12-01`, amount: 5000, description: 'Monthly Salary', type: 'income', source: 'SALARY', currency: 'EUR' },
            ],
            expenses: [
              { id: 'demo-exp-1', date: `${prevYear}-12-01`, amount: 1200, description: 'Rent', type: 'expense', category: 'HOUSING', expenseType: 'NEED', currency: 'EUR' },
              { id: 'demo-exp-2', date: `${prevYear}-12-05`, amount: 350, description: 'Groceries', type: 'expense', category: 'GROCERIES', expenseType: 'NEED', currency: 'EUR' },
              { id: 'demo-exp-3', date: `${prevYear}-12-10`, amount: 150, description: 'Utilities', type: 'expense', category: 'UTILITIES', expenseType: 'NEED', currency: 'EUR' },
              { id: 'demo-exp-4', date: `${prevYear}-12-15`, amount: 200, description: 'Dining Out', type: 'expense', category: 'DINING_OUT', expenseType: 'WANT', currency: 'EUR' },
              { id: 'demo-exp-5', date: `${prevYear}-12-20`, amount: 100, description: 'Entertainment', type: 'expense', category: 'ENTERTAINMENT', expenseType: 'WANT', currency: 'EUR' },
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
              { id: 'demo-inc-2', date: `${currentYear}-01-01`, amount: 5000, description: 'Monthly Salary', type: 'income', source: 'SALARY', currency: 'EUR' },
              { id: 'demo-inc-3', date: `${currentYear}-01-15`, amount: 200, description: 'Freelance Work', type: 'income', source: 'FREELANCE', currency: 'EUR' },
            ],
            expenses: [
              { id: 'demo-exp-6', date: `${currentYear}-01-01`, amount: 1200, description: 'Rent', type: 'expense', category: 'HOUSING', expenseType: 'NEED', currency: 'EUR' },
              { id: 'demo-exp-7', date: `${currentYear}-01-05`, amount: 380, description: 'Groceries', type: 'expense', category: 'GROCERIES', expenseType: 'NEED', currency: 'EUR' },
              { id: 'demo-exp-8', date: `${currentYear}-01-10`, amount: 160, description: 'Utilities', type: 'expense', category: 'UTILITIES', expenseType: 'NEED', currency: 'EUR' },
              { id: 'demo-exp-9', date: `${currentYear}-01-12`, amount: 50, description: 'Streaming Services', type: 'expense', category: 'SUBSCRIPTIONS', expenseType: 'WANT', currency: 'EUR' },
              { id: 'demo-exp-10', date: `${currentYear}-01-18`, amount: 180, description: 'Dining Out', type: 'expense', category: 'DINING_OUT', expenseType: 'WANT', currency: 'EUR' },
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
// Portfolio structure updated to 8 ETFs (5 stocks + 3 bonds + 2 cash)
// - Total: €70,000 (€65,000 non-cash + €5,000 cash)
// - Stocks: €35,000 (50% actual) with 50% target = +€0 delta
// - Bonds: €30,000 (42.86% actual) with 43% target = ±€0 delta (rounded)
// - Cash: €5,000 (7.14% actual) with 7% target = +€0 delta
// Asset class targets are portfolio-wide: Stocks 50%, Bonds 43%, Cash 7%
export function getDemoAssetAllocationData(): { 
  assets: Asset[]; 
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
} {
  // Portfolio totals: €70,000 with €35k stocks (5 ETFs), €30k bonds (3 ETFs), €5k cash
  // Using realistic prices and fractional shares for each ETF
  
  // STOCKS: €35,000 total (50% of portfolio)
  // Individual targets add up to 100% within STOCKS class
  
  // SPY (S&P 500): €7,000 (20% of stocks = 40% target × 50% of total)
  // Price: 683.17 USD ≈ 585.21 EUR (at 1.167 USD/EUR)
  // Shares: 7,000 / 585.21 = 11.961 shares
  const spyShares = 11.961;
  const spyPrice = 585.21;
  
  // VTI (Total Stock Market): €7,000 (20% of stocks)
  // Price: 278.45 USD ≈ 238.54 EUR
  // Shares: 7,000 / 238.54 = 29.346 shares
  const vtiShares = 29.346;
  const vtiPrice = 238.54;
  
  // VXUS (Total International): €7,000 (20% of stocks)
  // Price: 72.89 USD ≈ 62.45 EUR
  // Shares: 7,000 / 62.45 = 112.090 shares
  const vxusShares = 112.090;
  const vxusPrice = 62.45;
  
  // VWO (Emerging Markets): €7,000 (20% of stocks)
  // Price: 49.23 USD ≈ 42.18 EUR
  // Shares: 7,000 / 42.18 = 165.947 shares
  const vwoShares = 165.947;
  const vwoPrice = 42.18;
  
  // VBR (Small Cap Value): €7,000 (20% of stocks)
  // Price: 197.34 USD ≈ 169.08 EUR
  // Shares: 7,000 / 169.08 = 41.410 shares
  const vbrShares = 41.410;
  const vbrPrice = 169.08;
  
  // BONDS: €30,000 total (42.86% of portfolio, 43% target)
  // Individual targets add up to 100% within BONDS class
  
  // BND (Total Bond Market): €10,000 (33.33% of bonds)
  // Price: 73.45 USD ≈ 62.94 EUR
  // Shares: 10,000 / 62.94 = 158.876 shares
  const bndShares = 158.876;
  const bndPrice = 62.94;
  
  // TIP (Inflation-Protected): €10,000 (33.33% of bonds)
  // Price: €92.30/share
  // Shares: 10,000 / 92.30 = 108.343 shares
  const tipShares = 108.343;
  const tipPrice = 92.30;
  
  // BNDX (International Bond): €10,000 (33.33% of bonds)
  // Price: 48.12 USD ≈ 41.23 EUR
  // Shares: 10,000 / 41.23 = 242.582 shares
  const bndxShares = 242.582;
  const bndxPrice = 41.23;
  
  return {
    assets: [
      // STOCKS (5 ETFs)
      {
        id: 'demo-aa-1',
        name: 'S&P 500 Index',
        ticker: 'SPY',
        isin: 'US78462F1030',
        assetClass: 'STOCKS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(spyShares * spyPrice * 100) / 100,
        shares: spyShares,
        pricePerShare: spyPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 40, // 40% of STOCKS allocation (€14,000 of €35,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      {
        id: 'demo-aa-2',
        name: 'Total Stock Market',
        ticker: 'VTI',
        isin: 'US9229083632',
        assetClass: 'STOCKS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(vtiShares * vtiPrice * 100) / 100,
        shares: vtiShares,
        pricePerShare: vtiPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 27, // 27% of STOCKS allocation (€9,450 of €35,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      {
        id: 'demo-aa-3',
        name: 'Total International Stock',
        ticker: 'VXUS',
        isin: 'US9219107094',
        assetClass: 'STOCKS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(vxusShares * vxusPrice * 100) / 100,
        shares: vxusShares,
        pricePerShare: vxusPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 17, // 17% of STOCKS allocation (€5,950 of €35,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      {
        id: 'demo-aa-4',
        name: 'Emerging Markets',
        ticker: 'VWO',
        isin: 'US9220428588',
        assetClass: 'STOCKS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(vwoShares * vwoPrice * 100) / 100,
        shares: vwoShares,
        pricePerShare: vwoPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 10, // 10% of STOCKS allocation (€3,500 of €35,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      {
        id: 'demo-aa-5',
        name: 'Small Cap Value',
        ticker: 'VBR',
        isin: 'US9219107771',
        assetClass: 'STOCKS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(vbrShares * vbrPrice * 100) / 100,
        shares: vbrShares,
        pricePerShare: vbrPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 6, // 6% of STOCKS allocation (€2,100 of €35,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      // BONDS (3 ETFs)
      {
        id: 'demo-aa-6',
        name: 'Total Bond Market',
        ticker: 'BND',
        isin: 'US9219378356',
        assetClass: 'BONDS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(bndShares * bndPrice * 100) / 100,
        shares: bndShares,
        pricePerShare: bndPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 50, // 50% of BONDS allocation (€15,000 of €30,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      {
        id: 'demo-aa-7',
        name: 'Inflation-Protected Bonds',
        ticker: 'TIP',
        isin: 'US46434V6478',
        assetClass: 'BONDS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(tipShares * tipPrice * 100) / 100,
        shares: tipShares,
        pricePerShare: tipPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 30, // 30% of BONDS allocation (€9,000 of €30,000)
      },
      {
        id: 'demo-aa-8',
        name: 'International Bond',
        ticker: 'BNDX',
        isin: 'US9219107771',
        assetClass: 'BONDS' as AssetClass,
        subAssetType: 'ETF' as SubAssetType,
        currentValue: Math.round(bndxShares * bndxPrice * 100) / 100,
        shares: bndxShares,
        pricePerShare: bndxPrice,
        targetMode: 'PERCENTAGE' as AllocationMode,
        targetPercent: 20, // 20% of BONDS allocation (€6,000 of €30,000)
        originalCurrency: 'USD' as SupportedCurrency,
      },
      // CASH (2 accounts) - now with SET mode for fixed amounts
      // Emergency Fund: €3,500 (70% of cash)
      {
        id: 'demo-aa-9',
        name: 'Emergency Fund',
        ticker: '',
        assetClass: 'CASH' as AssetClass,
        subAssetType: 'SAVINGS_ACCOUNT' as SubAssetType,
        currentValue: 3500,
        shares: 3500, // Value stored as shares for cash
        pricePerShare: 1, // Price is 1 for cash
        targetMode: 'SET' as AllocationMode,
        targetValue: 3500, // Fixed amount target
      },
      // Main Checking: €1,500 (30% of cash)
      {
        id: 'demo-aa-10',
        name: 'Main Checking',
        ticker: '',
        assetClass: 'CASH' as AssetClass,
        subAssetType: 'CHECKING_ACCOUNT' as SubAssetType,
        currentValue: 1500,
        shares: 1500, // Value stored as shares for cash
        pricePerShare: 1, // Price is 1 for cash
        targetMode: 'SET' as AllocationMode,
        targetValue: 1500, // Fixed amount target
      },
    ],
    assetClassTargets: {
      STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 50 }, // 50% of portfolio
      BONDS: { targetMode: 'PERCENTAGE', targetPercent: 43 }, // 43% of portfolio
      REAL_ESTATE: { targetMode: 'OFF' },
      CRYPTO: { targetMode: 'OFF' },
      CASH: { targetMode: 'PERCENTAGE', targetPercent: 7 }, // 7% of portfolio
    },
  };
}
