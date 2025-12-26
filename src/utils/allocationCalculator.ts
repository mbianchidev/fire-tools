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
 */
export function calculateAllocationDeltas(
  assets: Asset[],
  totalValue: number
): AllocationDelta[] {
  const deltas: AllocationDelta[] = [];
  const grouped = groupAssetsByClass(assets);
  
  grouped.forEach((classAssets, assetClass) => {
    const classTotal = classAssets.reduce((sum, asset) => {
      return sum + (asset.targetMode === 'OFF' ? 0 : asset.currentValue);
    }, 0);
    
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
        targetPercent = asset.targetPercent;
        targetValue = (targetPercent / 100) * totalValue;
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
 */
export function validateAllocation(assets: Asset[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Get assets with percentage targets
  const percentageAssets = assets.filter(a => a.targetMode === 'PERCENTAGE');
  
  if (percentageAssets.length > 0) {
    const totalPercent = percentageAssets.reduce((sum, asset) => {
      return sum + (asset.targetPercent || 0);
    }, 0);
    
    // Allow small floating point tolerance
    if (Math.abs(totalPercent - 100) > 0.1) {
      errors.push(`Target allocation percentages must sum to 100% (current: ${totalPercent.toFixed(2)}%)`);
    }
  }
  
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
export function calculatePortfolioAllocation(assets: Asset[]): PortfolioAllocation {
  const validation = validateAllocation(assets);
  const totalValue = calculateTotalValue(assets);
  const assetClasses = calculateAssetClassSummaries(assets, totalValue);
  const deltas = calculateAllocationDeltas(assets, totalValue);
  
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

/**
 * Asset class target configuration
 * @property targetMode - The allocation mode:
 *   - 'PERCENTAGE': Target is a percentage of portfolio (requires targetPercent)
 *   - 'SET': Fixed absolute amount (used for cash reserves)
 *   - 'OFF': Excluded from allocation calculations
 * @property targetPercent - The target percentage (0-100), required when targetMode is 'PERCENTAGE'
 */
export interface AssetClassTarget {
  targetMode: AllocationMode;
  targetPercent?: number;
}

export type AssetClassTargets = Record<AssetClass, AssetClassTarget>;

/**
 * Redistribute asset class percentages when one is edited.
 * This function ensures all percentage-based asset classes sum to 100%.
 * It does NOT modify asset-specific table targets.
 * 
 * @param currentTargets - Current asset class targets
 * @param editedClass - The asset class that was edited
 * @param newPercent - The new percentage for the edited class (0-100)
 * @returns Updated asset class targets with redistributed percentages
 */
export function redistributeAssetClassPercentages(
  currentTargets: AssetClassTargets,
  editedClass: AssetClass,
  newPercent: number
): AssetClassTargets {
  // Clamp newPercent to valid range
  const clampedPercent = Math.max(0, Math.min(100, newPercent));
  
  const updatedTargets = { ...currentTargets };
  
  // Update the edited class
  updatedTargets[editedClass] = {
    ...updatedTargets[editedClass],
    targetPercent: clampedPercent,
  };
  
  // Get all percentage-based asset classes except the one being edited
  const otherPercentageClasses = (Object.keys(updatedTargets) as AssetClass[]).filter(
    (cls) => cls !== editedClass && updatedTargets[cls].targetMode === 'PERCENTAGE'
  );
  
  if (otherPercentageClasses.length === 0) {
    return updatedTargets;
  }
  
  const remainingPercent = Math.max(0, 100 - clampedPercent);
  
  // Get total of other classes' current percentages
  const otherClassesTotal = otherPercentageClasses.reduce(
    (sum, cls) => sum + (updatedTargets[cls].targetPercent || 0),
    0
  );
  
  if (otherClassesTotal === 0) {
    // Distribute equally if all others are 0
    const equalPercent = remainingPercent / otherPercentageClasses.length;
    otherPercentageClasses.forEach((cls) => {
      updatedTargets[cls] = {
        ...updatedTargets[cls],
        targetPercent: equalPercent,
      };
    });
  } else {
    // Distribute proportionally based on current percentages
    otherPercentageClasses.forEach((cls) => {
      const proportion = (updatedTargets[cls].targetPercent || 0) / otherClassesTotal;
      const newClassPercent = proportion * remainingPercent;
      updatedTargets[cls] = {
        ...updatedTargets[cls],
        targetPercent: newClassPercent,
      };
    });
  }
  
  return updatedTargets;
}

/**
 * Redistribute asset percentages within a class when one asset's target is edited.
 * This ensures all percentage-based assets within the class sum to their proper totals.
 * 
 * @param assets - All assets
 * @param editedAssetId - The asset that was edited
 * @param newTargetPercent - The new target percentage for the edited asset
 * @returns Updated assets array with redistributed percentages within the same class
 */
export function redistributeAssetPercentagesInClass(
  assets: Asset[],
  editedAssetId: string,
  newTargetPercent: number
): Asset[] {
  const editedAsset = assets.find(a => a.id === editedAssetId);
  if (!editedAsset) return assets;
  
  const assetClass = editedAsset.assetClass;
  
  // Get all percentage-based assets in the same class (excluding the edited one)
  const otherAssetsInClass = assets.filter(
    a => a.assetClass === assetClass && 
         a.targetMode === 'PERCENTAGE' && 
         a.id !== editedAssetId
  );
  
  if (otherAssetsInClass.length === 0) {
    // Just update the edited asset
    return assets.map(asset =>
      asset.id === editedAssetId
        ? { ...asset, targetPercent: newTargetPercent }
        : asset
    );
  }
  
  // Get total target percentage for all percentage-based assets in this class (including the edited asset's old value)
  const allPercentageAssetsInClass = assets.filter(
    a => a.assetClass === assetClass && a.targetMode === 'PERCENTAGE'
  );
  const totalClassTargetPercent = allPercentageAssetsInClass.reduce(
    (sum, a) => sum + (a.targetPercent || 0),
    0
  );
  
  // Calculate remaining percentage for other assets.
  // Since totalClassTargetPercent includes the edited asset's OLD percentage,
  // subtracting the new percentage gives us the correct remaining for others
  // to maintain the same total class percentage.
  const remainingPercent = Math.max(0, totalClassTargetPercent - newTargetPercent);
  
  // Get total of other assets' current percentages
  const otherAssetsTotal = otherAssetsInClass.reduce(
    (sum, a) => sum + (a.targetPercent || 0),
    0
  );
  
  return assets.map(asset => {
    if (asset.id === editedAssetId) {
      return { ...asset, targetPercent: newTargetPercent };
    }
    
    if (asset.assetClass === assetClass && 
        asset.targetMode === 'PERCENTAGE' &&
        otherAssetsTotal > 0) {
      // Proportionally adjust this asset's percentage
      const proportion = (asset.targetPercent || 0) / otherAssetsTotal;
      const newPercent = proportion * remainingPercent;
      return { ...asset, targetPercent: Math.max(0, newPercent) };
    }
    
    return asset;
  });
}

/**
 * Distribute a delta amount across assets within a class based on their current percentages.
 * 
 * @param assets - All assets
 * @param assetClass - The asset class to distribute delta to
 * @param delta - The delta amount to distribute (positive = buy, negative = sell)
 * @returns Map of asset IDs to their allocated delta amounts
 */
export function distributeDeltaToAssets(
  assets: Asset[],
  assetClass: AssetClass,
  delta: number
): Map<string, number> {
  const deltaMap = new Map<string, number>();
  
  // Get percentage-based assets in this class (only these participate in delta distribution)
  const classAssets = assets.filter(
    a => a.assetClass === assetClass && a.targetMode === 'PERCENTAGE'
  );
  
  if (classAssets.length === 0) {
    return deltaMap;
  }
  
  // Get total percentage for the class
  const totalPercent = classAssets.reduce(
    (sum, a) => sum + (a.targetPercent || 0),
    0
  );
  
  if (totalPercent === 0) {
    // Distribute equally if no percentages set
    const equalDelta = delta / classAssets.length;
    classAssets.forEach(asset => {
      deltaMap.set(asset.id, equalDelta);
    });
  } else {
    // Distribute proportionally based on target percentages
    classAssets.forEach(asset => {
      const proportion = (asset.targetPercent || 0) / totalPercent;
      const assetDelta = proportion * delta;
      deltaMap.set(asset.id, assetDelta);
    });
  }
  
  return deltaMap;
}

/**
 * Handle asset removal by redistributing its percentage to remaining assets.
 * 
 * @param assets - All assets (after removal)
 * @param removedAsset - The asset that was removed
 * @returns Updated assets array with redistributed percentages
 */
export function handleAssetRemoval(
  assets: Asset[],
  removedAsset: Asset
): Asset[] {
  if (removedAsset.targetMode !== 'PERCENTAGE') {
    return assets;
  }
  
  const assetClass = removedAsset.assetClass;
  const removedPercent = removedAsset.targetPercent || 0;
  
  // Get remaining percentage-based assets in the same class
  const remainingAssetsInClass = assets.filter(
    a => a.assetClass === assetClass && a.targetMode === 'PERCENTAGE'
  );
  
  if (remainingAssetsInClass.length === 0 || removedPercent === 0) {
    return assets;
  }
  
  // Get total of remaining assets' current percentages
  const remainingTotal = remainingAssetsInClass.reduce(
    (sum, a) => sum + (a.targetPercent || 0),
    0
  );
  
  if (remainingTotal === 0) {
    // Distribute equally
    const equalPercent = removedPercent / remainingAssetsInClass.length;
    return assets.map(asset => {
      if (asset.assetClass === assetClass && asset.targetMode === 'PERCENTAGE') {
        return { ...asset, targetPercent: (asset.targetPercent || 0) + equalPercent };
      }
      return asset;
    });
  }
  
  // Distribute proportionally
  return assets.map(asset => {
    if (asset.assetClass === assetClass && asset.targetMode === 'PERCENTAGE') {
      const proportion = (asset.targetPercent || 0) / remainingTotal;
      const additionalPercent = proportion * removedPercent;
      return { ...asset, targetPercent: (asset.targetPercent || 0) + additionalPercent };
    }
    return asset;
  });
}
