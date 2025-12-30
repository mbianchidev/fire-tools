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
