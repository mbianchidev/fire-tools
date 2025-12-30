/**
 * CSV Export/Import utilities for FIRE Calculator data
 */

import { CalculatorInputs } from '../types/calculator';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';

/**
 * Export FIRE Calculator inputs to CSV format
 */
export function exportFireCalculatorToCSV(inputs: CalculatorInputs): string {
  const escapeCSV = (value: any): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [
    ['FIRE Calculator Data Export'],
    ['Generated', new Date().toISOString()],
    [],
    ['Field', 'Value'],
    ['Initial Savings', escapeCSV(inputs.initialSavings)],
    ['Stocks Percent', escapeCSV(inputs.stocksPercent)],
    ['Bonds Percent', escapeCSV(inputs.bondsPercent)],
    ['Cash Percent', escapeCSV(inputs.cashPercent)],
    ['Current Annual Expenses', escapeCSV(inputs.currentAnnualExpenses)],
    ['FIRE Annual Expenses', escapeCSV(inputs.fireAnnualExpenses)],
    ['Annual Labor Income', escapeCSV(inputs.annualLaborIncome)],
    ['Labor Income Growth Rate', escapeCSV(inputs.laborIncomeGrowthRate)],
    ['Savings Rate', escapeCSV(inputs.savingsRate)],
    ['Desired Withdrawal Rate', escapeCSV(inputs.desiredWithdrawalRate)],
    ['Years Of Expenses', escapeCSV(inputs.yearsOfExpenses)],
    ['Expected Stock Return', escapeCSV(inputs.expectedStockReturn)],
    ['Expected Bond Return', escapeCSV(inputs.expectedBondReturn)],
    ['Expected Cash Return', escapeCSV(inputs.expectedCashReturn)],
    ['Year of Birth', escapeCSV(inputs.yearOfBirth)],
    ['Retirement Age', escapeCSV(inputs.retirementAge)],
    ['State Pension Income', escapeCSV(inputs.statePensionIncome)],
    ['Private Pension Income', escapeCSV(inputs.privatePensionIncome)],
    ['Other Income', escapeCSV(inputs.otherIncome)],
    ['Stop Working At FIRE', escapeCSV(inputs.stopWorkingAtFIRE)],
    ['Max Age', escapeCSV(inputs.maxAge)],
    ['Use Asset Allocation Value', escapeCSV(inputs.useAssetAllocationValue)],
  ];

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Import FIRE Calculator inputs from CSV format
 */
export function importFireCalculatorFromCSV(csv: string): CalculatorInputs {
  const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
  const data: Record<string, any> = {};

  // Skip header lines and parse data
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip header and metadata lines
    if (line.startsWith('FIRE Calculator') || line.startsWith('Generated') || line === 'Field,Value' || !line.includes(',')) {
      continue;
    }

    // Parse CSV line properly handling quoted values
    const commaIdx = line.indexOf(',');
    if (commaIdx === -1) continue;
    
    const key = line.substring(0, commaIdx).trim();
    let value = line.substring(commaIdx + 1).trim();
    
    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/""/g, '"');
    }

    // Map field names to property names
    const fieldMap: Record<string, string> = {
      'Initial Savings': 'initialSavings',
      'Stocks Percent': 'stocksPercent',
      'Bonds Percent': 'bondsPercent',
      'Cash Percent': 'cashPercent',
      'Current Annual Expenses': 'currentAnnualExpenses',
      'FIRE Annual Expenses': 'fireAnnualExpenses',
      'Annual Labor Income': 'annualLaborIncome',
      'Labor Income Growth Rate': 'laborIncomeGrowthRate',
      'Savings Rate': 'savingsRate',
      'Desired Withdrawal Rate': 'desiredWithdrawalRate',
      'Years Of Expenses': 'yearsOfExpenses',
      'Expected Stock Return': 'expectedStockReturn',
      'Expected Bond Return': 'expectedBondReturn',
      'Expected Cash Return': 'expectedCashReturn',
      'Year of Birth': 'yearOfBirth',
      'Retirement Age': 'retirementAge',
      'State Pension Income': 'statePensionIncome',
      'Private Pension Income': 'privatePensionIncome',
      'Other Income': 'otherIncome',
      'Stop Working At FIRE': 'stopWorkingAtFIRE',
      'Max Age': 'maxAge',
      'Use Asset Allocation Value': 'useAssetAllocationValue',
    };

    const propName = fieldMap[key];
    if (propName) {
      if (propName === 'stopWorkingAtFIRE' || propName === 'useAssetAllocationValue') {
        data[propName] = value.toLowerCase() === 'true';
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          data[propName] = numValue;
        }
      }
    }
  }

  // Validate required fields
  const required = [
    'initialSavings', 'stocksPercent', 'bondsPercent', 'cashPercent',
    'currentAnnualExpenses', 'fireAnnualExpenses', 'annualLaborIncome', 'yearOfBirth'
  ];

  for (const field of required) {
    if (data[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return data as CalculatorInputs;
}

/**
 * Export Asset Allocation with metadata to CSV format
 */
export function exportAssetAllocationToCSV(
  assets: Asset[],
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>
): string {
  const escapeCSV = (value: any): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = [
    ['Asset Allocation Export'],
    ['Generated', new Date().toISOString()],
    [],
    ['Asset Class Targets'],
    ['Asset Class', 'Target Mode', 'Target Percent'],
  ];

  // Add asset class targets
  Object.entries(assetClassTargets).forEach(([assetClass, target]) => {
    rows.push([
      escapeCSV(assetClass),
      escapeCSV(target.targetMode),
      escapeCSV(target.targetPercent?.toString() || ''),
    ]);
  });

  rows.push([]);
  rows.push(['Assets']);
  rows.push([
    'ID', 'Name', 'Ticker', 'ISIN', 'Asset Class', 'Sub Asset Type',
    'Current Value', 'Target Mode', 'Target Percent', 'Target Value'
  ]);

  // Add assets
  assets.forEach(asset => {
    rows.push([
      escapeCSV(asset.id),
      escapeCSV(asset.name),
      escapeCSV(asset.ticker),
      escapeCSV(asset.isin || ''),
      escapeCSV(asset.assetClass),
      escapeCSV(asset.subAssetType),
      escapeCSV(asset.currentValue.toString()),
      escapeCSV(asset.targetMode),
      escapeCSV(asset.targetPercent?.toString() || ''),
      escapeCSV(asset.targetValue?.toString() || ''),
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Import Asset Allocation from CSV format
 */
export function importAssetAllocationFromCSV(csv: string): {
  assets: Asset[];
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
} {
  const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
  const assets: Asset[] = [];
  const assetClassTargets: Record<string, { targetMode: AllocationMode; targetPercent?: number }> = {};

  let section: 'none' | 'targets' | 'assets' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect sections
    if (line === 'Asset Class,Target Mode,Target Percent') {
      section = 'targets';
      continue;
    }
    if (line.startsWith('ID,Name,Ticker,ISIN')) {
      section = 'assets';
      continue;
    }

    // Skip headers and metadata
    if (line.startsWith('Asset Allocation') || line.startsWith('Generated') || 
        line === 'Asset Class Targets' || line === 'Assets') {
      continue;
    }

    // Parse asset class targets
    if (section === 'targets' && line.includes(',')) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const assetClass = parts[0].trim();
        const targetMode = parts[1].trim() as AllocationMode;
        const targetPercent = parts[2] ? parseFloat(parts[2].trim()) : undefined;

        if (assetClass && targetMode) {
          assetClassTargets[assetClass] = { targetMode, targetPercent };
        }
      }
    }

    // Parse assets
    if (section === 'assets' && line.includes(',')) {
      // Handle quoted fields (names with commas)
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current.trim());

      if (parts.length >= 7) {
        const asset: Asset = {
          id: parts[0],
          name: parts[1],
          ticker: parts[2],
          isin: parts[3] || undefined,
          assetClass: parts[4] as AssetClass,
          subAssetType: parts[5] as any,
          currentValue: parseFloat(parts[6]) || 0,
          targetMode: parts[7] as AllocationMode,
          targetPercent: parts[8] ? parseFloat(parts[8]) : undefined,
          targetValue: parts[9] ? parseFloat(parts[9]) : undefined,
        };

        assets.push(asset);
      }
    }
  }

  if (assets.length === 0) {
    throw new Error('No assets found in CSV file');
  }

  // Validate asset class targets
  const validAssetClasses: AssetClass[] = ['STOCKS', 'BONDS', 'CASH', 'CRYPTO', 'REAL_ESTATE'];
  const validatedTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> = {} as Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
  
  for (const [key, value] of Object.entries(assetClassTargets)) {
    if (validAssetClasses.includes(key as AssetClass)) {
      validatedTargets[key as AssetClass] = value;
    }
  }

  return { assets, assetClassTargets: validatedTargets };
}

/**
 * Export Expense Tracker data to CSV format
 */
export function exportExpenseTrackerToCSV(data: import('../types/expenseTracker').ExpenseTrackerData): string {
  const escapeCSV = (value: any): string => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows: string[][] = [
    ['Expense Tracker Data Export'],
    ['Generated', new Date().toISOString()],
    ['Currency', data.currency],
    [],
  ];

  // Export income entries
  rows.push(['Income Entries']);
  rows.push(['ID', 'Date', 'Amount', 'Description', 'Source']);
  
  for (const yearData of data.years) {
    for (const monthData of yearData.months) {
      for (const income of monthData.incomes) {
        rows.push([
          escapeCSV(income.id),
          escapeCSV(income.date),
          escapeCSV(income.amount.toString()),
          escapeCSV(income.description),
          escapeCSV(income.source),
        ]);
      }
    }
  }

  rows.push([]);

  // Export expense entries
  rows.push(['Expense Entries']);
  rows.push(['ID', 'Date', 'Amount', 'Description', 'Category', 'SubCategory', 'ExpenseType']);
  
  for (const yearData of data.years) {
    for (const monthData of yearData.months) {
      for (const expense of monthData.expenses) {
        rows.push([
          escapeCSV(expense.id),
          escapeCSV(expense.date),
          escapeCSV(expense.amount.toString()),
          escapeCSV(expense.description),
          escapeCSV(expense.category),
          escapeCSV(expense.subCategory || ''),
          escapeCSV(expense.expenseType),
        ]);
      }
    }
  }

  rows.push([]);

  // Export budgets
  rows.push(['Monthly Budgets']);
  rows.push(['Year', 'Month', 'Category', 'MonthlyBudget']);
  
  for (const yearData of data.years) {
    for (const monthData of yearData.months) {
      for (const budget of monthData.budgets) {
        rows.push([
          escapeCSV(monthData.year.toString()),
          escapeCSV(monthData.month.toString()),
          escapeCSV(budget.category),
          escapeCSV(budget.monthlyBudget.toString()),
        ]);
      }
    }
  }

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Import Expense Tracker data from CSV format
 */
export function importExpenseTrackerFromCSV(csv: string): import('../types/expenseTracker').ExpenseTrackerData {
  const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
  
  let currency = 'EUR';
  const incomes: import('../types/expenseTracker').IncomeEntry[] = [];
  const expenses: import('../types/expenseTracker').ExpenseEntry[] = [];
  const budgetsMap = new Map<string, import('../types/expenseTracker').CategoryBudget[]>();

  let section: 'none' | 'income' | 'expense' | 'budget' = 'none';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse currency
    if (line.startsWith('Currency,')) {
      currency = line.split(',')[1]?.trim() || 'EUR';
      continue;
    }

    // Detect sections
    if (line === 'ID,Date,Amount,Description,Source') {
      section = 'income';
      continue;
    }
    if (line === 'ID,Date,Amount,Description,Category,SubCategory,ExpenseType') {
      section = 'expense';
      continue;
    }
    if (line === 'Year,Month,Category,MonthlyBudget') {
      section = 'budget';
      continue;
    }

    // Skip headers and metadata
    if (line.startsWith('Expense Tracker') || line.startsWith('Generated') || 
        line === 'Income Entries' || line === 'Expense Entries' || line === 'Monthly Budgets') {
      continue;
    }

    // Parse income entries
    if (section === 'income' && line.includes(',')) {
      const parts = parseCSVLine(line);
      if (parts.length >= 5) {
        incomes.push({
          id: parts[0],
          type: 'income',
          date: parts[1],
          amount: parseFloat(parts[2]) || 0,
          description: parts[3],
          source: parts[4] as import('../types/expenseTracker').IncomeSource,
        });
      }
    }

    // Parse expense entries
    if (section === 'expense' && line.includes(',')) {
      const parts = parseCSVLine(line);
      if (parts.length >= 7) {
        expenses.push({
          id: parts[0],
          type: 'expense',
          date: parts[1],
          amount: parseFloat(parts[2]) || 0,
          description: parts[3],
          category: parts[4] as import('../types/expenseTracker').ExpenseCategory,
          subCategory: parts[5] || undefined,
          expenseType: parts[6] as import('../types/expenseTracker').ExpenseType,
        });
      }
    }

    // Parse budget entries
    if (section === 'budget' && line.includes(',')) {
      const parts = parseCSVLine(line);
      if (parts.length >= 4) {
        const key = `${parts[0]}-${parts[1].padStart(2, '0')}`;
        const budget: import('../types/expenseTracker').CategoryBudget = {
          category: parts[2] as import('../types/expenseTracker').ExpenseCategory,
          monthlyBudget: parseFloat(parts[3]) || 0,
        };
        
        const existing = budgetsMap.get(key) || [];
        existing.push(budget);
        budgetsMap.set(key, existing);
      }
    }
  }

  // Organize data into years and months
  const yearsMap = new Map<number, Map<number, import('../types/expenseTracker').MonthData>>();

  // Process incomes
  for (const income of incomes) {
    const [year, month] = income.date.split('-').map(Number);
    if (!yearsMap.has(year)) {
      yearsMap.set(year, new Map());
    }
    const monthsMap = yearsMap.get(year)!;
    if (!monthsMap.has(month)) {
      monthsMap.set(month, {
        year,
        month,
        incomes: [],
        expenses: [],
        budgets: [],
      });
    }
    monthsMap.get(month)!.incomes.push(income);
  }

  // Process expenses
  for (const expense of expenses) {
    const [year, month] = expense.date.split('-').map(Number);
    if (!yearsMap.has(year)) {
      yearsMap.set(year, new Map());
    }
    const monthsMap = yearsMap.get(year)!;
    if (!monthsMap.has(month)) {
      monthsMap.set(month, {
        year,
        month,
        incomes: [],
        expenses: [],
        budgets: [],
      });
    }
    monthsMap.get(month)!.expenses.push(expense);
  }

  // Process budgets
  for (const [key, budgets] of budgetsMap) {
    const [year, month] = key.split('-').map(Number);
    if (!yearsMap.has(year)) {
      yearsMap.set(year, new Map());
    }
    const monthsMap = yearsMap.get(year)!;
    if (!monthsMap.has(month)) {
      monthsMap.set(month, {
        year,
        month,
        incomes: [],
        expenses: [],
        budgets: [],
      });
    }
    monthsMap.get(month)!.budgets = budgets;
  }

  // Convert to arrays
  const years: import('../types/expenseTracker').YearData[] = [];
  for (const [year, monthsMap] of yearsMap) {
    const months = Array.from(monthsMap.values()).sort((a, b) => a.month - b.month);
    years.push({ year, months });
  }
  years.sort((a, b) => a.year - b.year);

  const now = new Date();
  return {
    years,
    currentYear: now.getFullYear(),
    currentMonth: now.getMonth() + 1,
    currency: currency as import('../types/currency').SupportedCurrency,
  };
}

/**
 * Helper function to parse CSV line with quoted fields
 */
function parseCSVLine(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());

  return parts;
}
