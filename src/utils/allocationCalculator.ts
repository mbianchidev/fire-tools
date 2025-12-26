import {
  Asset,
  AssetClass,
  AssetClassSummary,
  AllocationDelta,
  PortfolioAllocation,
  AllocationAction,
  AllocationMode,
  ChartData,
} from '../types/assetAllocation';

/**
 * Calculate the total portfolio value
 */
export function calculateTotalValue(assets: Asset[]): number {
  return assets.reduce((total, asset) => {
    if (asset.targetMode === 'OFF') return total;
    return total + asset.currentValue;
  }, 0);
}

/**
 * Group assets by asset class
 */
export function groupAssetsByClass(assets: Asset[]): Map<AssetClass, Asset[]> {
  const grouped = new Map<AssetClass, Asset[]>();
  
  assets.forEach(asset => {
    const existing = grouped.get(asset.assetClass) || [];
    existing.push(asset);
    grouped.set(asset.assetClass, existing);
  });
  
  return grouped;
}

/**
 * Calculate asset class summaries
 */
export function calculateAssetClassSummaries(
  assets: Asset[],
  totalValue: number
): AssetClassSummary[] {
  const grouped = groupAssetsByClass(assets);
  const summaries: AssetClassSummary[] = [];
  
  grouped.forEach((classAssets, assetClass) => {
    const currentTotal = classAssets.reduce((sum, asset) => {
      return sum + (asset.targetMode === 'OFF' ? 0 : asset.currentValue);
    }, 0);
    
    const currentPercent = totalValue > 0 ? (currentTotal / totalValue) * 100 : 0;
    
    // Determine class-level target
    let targetMode: AllocationMode = 'PERCENTAGE';
    let targetPercent: number | undefined;
    let targetTotal: number | undefined;
    
    // If all assets in class are OFF, class is OFF
    if (classAssets.every(a => a.targetMode === 'OFF')) {
      targetMode = 'OFF';
    } else if (classAssets.some(a => a.targetMode === 'SET')) {
      // If any asset is SET, calculate fixed total
      targetMode = 'SET';
      targetTotal = classAssets.reduce((sum, asset) => {
        if (asset.targetMode === 'SET') {
          return sum + (asset.targetValue || 0);
        }
        return sum;
      }, 0);
    } else {
      // Calculate percentage target
      targetPercent = classAssets.reduce((sum, asset) => {
        if (asset.targetMode === 'PERCENTAGE') {
          return sum + (asset.targetPercent || 0);
        }
        return sum;
      }, 0);
      targetTotal = totalValue > 0 ? (targetPercent / 100) * totalValue : 0;
    }
    
    const delta = (targetTotal || 0) - currentTotal;
    const action = determineAction(assetClass, delta, targetMode);
    
    summaries.push({
      assetClass,
      assets: classAssets,
      currentTotal,
      currentPercent,
      targetMode,
      targetPercent,
      targetTotal,
      delta,
      action,
    });
  });
  
  return summaries;
}

// Threshold for determining when to take action (in currency units)
const ACTION_THRESHOLD = 100;

/**
 * Determine the recommended action based on delta
 */
export function determineAction(
  assetClass: AssetClass,
  delta: number,
  targetMode: AllocationMode
): AllocationAction {
  if (targetMode === 'OFF') {
    return 'EXCLUDED';
  }
  
  if (Math.abs(delta) < ACTION_THRESHOLD) {
    return 'HOLD';
  }
  
  if (assetClass === 'CASH') {
    return delta > 0 ? 'SAVE' : 'INVEST';
  }
  
  return delta > 0 ? 'BUY' : 'SELL';
}

/**
 * Calculate allocation deltas for each asset
 * Note: targetPercent in assets is relative to the class (should sum to 100% within each class)
 * The delta calculation uses the class target value to determine each asset's target value
 */
export function calculateAllocationDeltas(
  assets: Asset[],
  totalValue: number,
  assetClassTargets?: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>
): AllocationDelta[] {
  const deltas: AllocationDelta[] = [];
  const grouped = groupAssetsByClass(assets);
  
  grouped.forEach((classAssets, assetClass) => {
    const classTotal = classAssets.reduce((sum, asset) => {
      return sum + (asset.targetMode === 'OFF' ? 0 : asset.currentValue);
    }, 0);
    
    // Get the class target value from assetClassTargets if provided
    let classTargetValue = 0;
    if (assetClassTargets && assetClassTargets[assetClass]) {
      const classTarget = assetClassTargets[assetClass];
      if (classTarget.targetMode === 'PERCENTAGE' && classTarget.targetPercent !== undefined) {
        classTargetValue = (classTarget.targetPercent / 100) * totalValue;
      } else if (classTarget.targetMode === 'SET') {
        // For SET mode, use the sum of SET target values from assets
        classTargetValue = classAssets.reduce((sum, asset) => {
          if (asset.targetMode === 'SET') {
            return sum + (asset.targetValue || 0);
          }
          return sum;
        }, 0);
      }
    } else {
      // Fallback: calculate from assets
      classTargetValue = classAssets.reduce((sum, asset) => {
        if (asset.targetMode === 'SET') {
          return sum + (asset.targetValue || 0);
        } else if (asset.targetMode === 'PERCENTAGE') {
          return sum + ((asset.targetPercent || 0) / 100) * totalValue;
        }
        return sum;
      }, 0);
    }
    
    classAssets.forEach(asset => {
      if (asset.targetMode === 'OFF') {
        deltas.push({
          assetId: asset.id,
          currentValue: asset.currentValue,
          currentPercent: 0,
          currentPercentInClass: 0,
          targetValue: 0,
          targetPercent: 0,
          delta: 0,
          deltaPercent: 0,
          action: 'EXCLUDED',
        });
        return;
      }
      
      const currentPercent = totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0;
      const currentPercentInClass = classTotal > 0 ? (asset.currentValue / classTotal) * 100 : 0;
      
      let targetValue = 0;
      let targetPercent = 0;
      
      if (asset.targetMode === 'SET') {
        targetValue = asset.targetValue || 0;
        targetPercent = totalValue > 0 ? (targetValue / totalValue) * 100 : 0;
      } else if (asset.targetMode === 'PERCENTAGE' && asset.targetPercent !== undefined) {
        // targetPercent is the percentage within the class (should sum to 100% in class)
        // Calculate target value based on class target value
        targetValue = (asset.targetPercent / 100) * classTargetValue;
        targetPercent = totalValue > 0 ? (targetValue / totalValue) * 100 : 0;
      }
      
      const delta = targetValue - asset.currentValue;
      const deltaPercent = targetPercent - currentPercent;
      const action = determineAction(assetClass, delta, asset.targetMode);
      
      deltas.push({
        assetId: asset.id,
        currentValue: asset.currentValue,
        currentPercent,
        currentPercentInClass,
        targetValue,
        targetPercent,
        delta,
        deltaPercent,
        action,
      });
    });
  });
  
  return deltas;
}

/**
 * Validate portfolio allocation
 * Note: Asset percentages should sum to 100% within each asset class (not total portfolio)
 */
export function validateAllocation(assets: Asset[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Group assets by class and validate each class's percentages sum to 100%
  const grouped = groupAssetsByClass(assets);
  
  grouped.forEach((classAssets, assetClass) => {
    const percentageAssets = classAssets.filter(a => a.targetMode === 'PERCENTAGE');
    
    if (percentageAssets.length > 0) {
      const totalPercent = percentageAssets.reduce((sum, asset) => {
        return sum + (asset.targetPercent || 0);
      }, 0);
      
      // Allow small floating point tolerance
      if (Math.abs(totalPercent - 100) > 0.1) {
        errors.push(`${assetClass} target percentages must sum to 100% within the class (current: ${totalPercent.toFixed(2)}%)`);
      }
    }
  });
  
  // Check for negative values
  assets.forEach(asset => {
    if (asset.currentValue < 0) {
      errors.push(`Asset ${asset.name} has negative value: ${asset.currentValue}`);
    }
    
    if (asset.targetMode === 'PERCENTAGE' && (asset.targetPercent || 0) < 0) {
      errors.push(`Asset ${asset.name} has negative target percentage: ${asset.targetPercent}`);
    }
    
    if (asset.targetMode === 'SET' && (asset.targetValue || 0) < 0) {
      errors.push(`Asset ${asset.name} has negative target value: ${asset.targetValue}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate portfolio allocation with all details
 */
export function calculatePortfolioAllocation(
  assets: Asset[],
  assetClassTargets?: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>,
  portfolioValue?: number
): PortfolioAllocation {
  const validation = validateAllocation(assets);
  const totalValue = portfolioValue ?? calculateTotalValue(assets);
  const assetClasses = calculateAssetClassSummaries(assets, totalValue);
  const deltas = calculateAllocationDeltas(assets, totalValue, assetClassTargets);
  
  return {
    assets,
    assetClasses,
    totalValue,
    deltas,
    isValid: validation.isValid,
    validationErrors: validation.errors,
  };
}

/**
 * Prepare data for pie/donut chart by asset class
 */
export function prepareAssetClassChartData(assetClasses: AssetClassSummary[]): ChartData[] {
  const colors: Record<AssetClass, string> = {
    STOCKS: '#667eea',
    BONDS: '#764ba2',
    CASH: '#4CAF50',
    CRYPTO: '#FF9800',
    REAL_ESTATE: '#9C27B0',
  };
  
  return assetClasses
    .filter(ac => ac.targetMode !== 'OFF' && ac.currentTotal > 0)
    .map(ac => ({
      name: ac.assetClass,
      value: ac.currentTotal,
      percentage: ac.currentPercent,
      color: colors[ac.assetClass],
    }));
}

// Golden angle for good color distribution in charts
const GOLDEN_ANGLE_DEGREES = 137.5;

/**
 * Prepare data for pie/donut chart by individual asset within a class
 */
export function prepareAssetChartData(
  assets: Asset[],
  classTotal: number
): ChartData[] {
  return assets
    .filter(a => a.targetMode !== 'OFF' && a.currentValue > 0)
    .map((asset, index) => {
      const percentage = classTotal > 0 ? (asset.currentValue / classTotal) * 100 : 0;
      // Generate colors based on index using golden angle
      const hue = (index * GOLDEN_ANGLE_DEGREES) % 360;
      return {
        name: asset.name,
        value: asset.currentValue,
        percentage,
        color: `hsl(${hue}, 70%, 60%)`,
      };
    });
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, currency: string = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : '$';
  const absValue = Math.abs(value);
  return `${symbol}${absValue.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  })}`;
}

/**
 * Format percentage value
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Export portfolio to CSV
 */
export function exportToCSV(allocation: PortfolioAllocation): string {
  const headers = [
    'Asset / Index',
    'Ticker(s)',
    'Asset Class',
    '% Target',
    '% Current',
    'Absolute Current',
    'Absolute Target',
    'Delta',
    'Action',
    'Notes'
  ];
  
  const rows = allocation.assets.map(asset => {
    const delta = allocation.deltas.find(d => d.assetId === asset.id);
    return [
      asset.name,
      asset.ticker,
      asset.assetClass,
      asset.targetMode === 'SET' ? 'SET' : 
        asset.targetMode === 'OFF' ? 'OFF' : 
        `${(asset.targetPercent || 0).toFixed(2)}%`,
      delta ? `${delta.currentPercent.toFixed(2)}%` : '0%',
      asset.currentValue.toFixed(2),
      delta ? delta.targetValue.toFixed(2) : '0',
      delta ? delta.delta.toFixed(2) : '0',
      delta?.action || 'HOLD',
      ''
    ];
  });
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csv;
}

/**
 * Parse CSV to create assets
 */
export function importFromCSV(csv: string): Asset[] {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Skip header
  const dataLines = lines.slice(1);
  
  return dataLines.map((line, index) => {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 6) {
      throw new Error(`Invalid CSV format at line ${index + 2}`);
    }
    
    const [name, ticker, assetClass, targetStr, , currentValue] = parts;
    
    let targetMode: AllocationMode = 'PERCENTAGE';
    let targetPercent: number | undefined;
    let targetValue: number | undefined;
    
    if (targetStr === 'OFF') {
      targetMode = 'OFF';
    } else if (targetStr === 'SET') {
      targetMode = 'SET';
      targetValue = parseFloat(currentValue);
    } else {
      targetPercent = parseFloat(targetStr.replace('%', ''));
    }
    
    return {
      id: `asset-${index}`,
      name,
      ticker,
      assetClass: assetClass as AssetClass,
      subAssetType: 'NONE',
      currentValue: parseFloat(currentValue),
      targetMode,
      targetPercent,
      targetValue,
    };
  });
}

/**
 * Format asset class or sub-type name for display
 */
export function formatAssetName(name: string): string {
  // Special case for ETF - keep it all caps
  if (name === 'ETF') return 'ETF';
  
  return name
    .split('_')
    .map(word => {
      // Keep ETF in all caps
      if (word === 'ETF') return 'ETF';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
