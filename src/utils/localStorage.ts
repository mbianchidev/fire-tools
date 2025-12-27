/**
 * Local Storage utilities for persisting application data
 * Handles Asset Allocation and FIRE Calculator data
 */

import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { CalculatorInputs } from '../types/calculator';
import { DEFAULT_INPUTS } from './defaults';

// Storage keys
const ASSET_ALLOCATION_KEY = 'fire-calculator-asset-allocation';
const ASSET_CLASS_TARGETS_KEY = 'fire-calculator-asset-class-targets';
const FIRE_CALCULATOR_INPUTS_KEY = 'fire-calculator-inputs';

// Data validation helpers
function isValidAsset(obj: any): obj is Asset {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.ticker === 'string' &&
    typeof obj.assetClass === 'string' &&
    typeof obj.subAssetType === 'string' &&
    typeof obj.currentValue === 'number' &&
    typeof obj.targetMode === 'string'
  );
}

function isValidCalculatorInputs(obj: any): obj is CalculatorInputs {
  return (
    typeof obj === 'object' &&
    typeof obj.initialSavings === 'number' &&
    typeof obj.stocksPercent === 'number' &&
    typeof obj.bondsPercent === 'number' &&
    typeof obj.cashPercent === 'number' &&
    typeof obj.currentAnnualExpenses === 'number' &&
    typeof obj.fireAnnualExpenses === 'number' &&
    typeof obj.annualLaborIncome === 'number' &&
    typeof obj.yearOfBirth === 'number'
  );
}

/**
 * Save Asset Allocation data to localStorage
 */
export function saveAssetAllocation(
  assets: Asset[],
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>
): void {
  try {
    localStorage.setItem(ASSET_ALLOCATION_KEY, JSON.stringify(assets));
    localStorage.setItem(ASSET_CLASS_TARGETS_KEY, JSON.stringify(assetClassTargets));
  } catch (error) {
    console.error('Failed to save asset allocation to localStorage:', error);
    throw new Error('Failed to save data to local storage. Storage may be full or disabled.');
  }
}

/**
 * Load Asset Allocation data from localStorage
 */
export function loadAssetAllocation(): {
  assets: Asset[] | null;
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> | null;
} {
  try {
    const assetsData = localStorage.getItem(ASSET_ALLOCATION_KEY);
    const targetsData = localStorage.getItem(ASSET_CLASS_TARGETS_KEY);

    let assets: Asset[] | null = null;
    let assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> | null = null;

    if (assetsData) {
      const parsedAssets = JSON.parse(assetsData);
      if (Array.isArray(parsedAssets) && parsedAssets.every(isValidAsset)) {
        assets = parsedAssets;
      }
    }

    if (targetsData) {
      const parsedTargets = JSON.parse(targetsData);
      if (typeof parsedTargets === 'object') {
        assetClassTargets = parsedTargets;
      }
    }

    return { assets, assetClassTargets };
  } catch (error) {
    console.error('Failed to load asset allocation from localStorage:', error);
    return { assets: null, assetClassTargets: null };
  }
}

/**
 * Clear Asset Allocation data from localStorage
 */
export function clearAssetAllocation(): void {
  try {
    localStorage.removeItem(ASSET_ALLOCATION_KEY);
    localStorage.removeItem(ASSET_CLASS_TARGETS_KEY);
  } catch (error) {
    console.error('Failed to clear asset allocation from localStorage:', error);
  }
}

/**
 * Save FIRE Calculator inputs to localStorage
 */
export function saveFireCalculatorInputs(inputs: CalculatorInputs): void {
  try {
    localStorage.setItem(FIRE_CALCULATOR_INPUTS_KEY, JSON.stringify(inputs));
  } catch (error) {
    console.error('Failed to save FIRE calculator inputs to localStorage:', error);
    throw new Error('Failed to save data to local storage. Storage may be full or disabled.');
  }
}

/**
 * Load FIRE Calculator inputs from localStorage
 */
export function loadFireCalculatorInputs(): CalculatorInputs | null {
  try {
    const data = localStorage.getItem(FIRE_CALCULATOR_INPUTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (isValidCalculatorInputs(parsed)) {
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_INPUTS, ...parsed };
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load FIRE calculator inputs from localStorage:', error);
    return null;
  }
}

/**
 * Clear FIRE Calculator inputs from localStorage
 */
export function clearFireCalculatorInputs(): void {
  try {
    localStorage.removeItem(FIRE_CALCULATOR_INPUTS_KEY);
  } catch (error) {
    console.error('Failed to clear FIRE calculator inputs from localStorage:', error);
  }
}

/**
 * Check if localStorage is available and working
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
