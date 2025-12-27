/**
 * CSV Export/Import utilities for FIRE Calculator data
 */

import { CalculatorInputs } from '../types/calculator';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';

/**
 * Export FIRE Calculator inputs to CSV format
 */
export function exportFireCalculatorToCSV(inputs: CalculatorInputs): string {
  const rows = [
    ['FIRE Calculator Data Export'],
    ['Generated', new Date().toISOString()],
    [],
    ['Field', 'Value'],
    ['Initial Savings', inputs.initialSavings],
    ['Stocks Percent', inputs.stocksPercent],
    ['Bonds Percent', inputs.bondsPercent],
    ['Cash Percent', inputs.cashPercent],
    ['Current Annual Expenses', inputs.currentAnnualExpenses],
    ['FIRE Annual Expenses', inputs.fireAnnualExpenses],
    ['Annual Labor Income', inputs.annualLaborIncome],
    ['Labor Income Growth Rate', inputs.laborIncomeGrowthRate],
    ['Savings Rate', inputs.savingsRate],
    ['Desired Withdrawal Rate', inputs.desiredWithdrawalRate],
    ['Expected Stock Return', inputs.expectedStockReturn],
    ['Expected Bond Return', inputs.expectedBondReturn],
    ['Expected Cash Return', inputs.expectedCashReturn],
    ['Year of Birth', inputs.yearOfBirth],
    ['Retirement Age', inputs.retirementAge],
    ['State Pension Income', inputs.statePensionIncome],
    ['Private Pension Income', inputs.privatePensionIncome],
    ['Other Income', inputs.otherIncome],
    ['Stop Working At FIRE', inputs.stopWorkingAtFIRE],
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

    const parts = line.split(',');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts[1].trim();

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
        'Expected Stock Return': 'expectedStockReturn',
        'Expected Bond Return': 'expectedBondReturn',
        'Expected Cash Return': 'expectedCashReturn',
        'Year of Birth': 'yearOfBirth',
        'Retirement Age': 'retirementAge',
        'State Pension Income': 'statePensionIncome',
        'Private Pension Income': 'privatePensionIncome',
        'Other Income': 'otherIncome',
        'Stop Working At FIRE': 'stopWorkingAtFIRE',
      };

      const propName = fieldMap[key];
      if (propName) {
        if (propName === 'stopWorkingAtFIRE') {
          data[propName] = value.toLowerCase() === 'true';
        } else {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            data[propName] = numValue;
          }
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
      assetClass,
      target.targetMode,
      target.targetPercent?.toString() || '',
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
      asset.id,
      `"${asset.name}"`, // Quote name to handle commas
      asset.ticker,
      asset.isin || '',
      asset.assetClass,
      asset.subAssetType,
      asset.currentValue.toString(),
      asset.targetMode,
      asset.targetPercent?.toString() || '',
      asset.targetValue?.toString() || '',
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

  return { assets, assetClassTargets: assetClassTargets as any };
}
