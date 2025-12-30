/**
 * Cookie Storage utilities for persisting application data
 * Handles Asset Allocation and FIRE Calculator data with encryption
 */

import Cookies from 'js-cookie';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { CalculatorInputs } from '../types/calculator';
import { DEFAULT_INPUTS } from './defaults';
import { encryptData, decryptData } from './cookieEncryption';

// Cookie keys
const ASSET_ALLOCATION_KEY = 'fire-calculator-asset-allocation';
const ASSET_CLASS_TARGETS_KEY = 'fire-calculator-asset-class-targets';
const FIRE_CALCULATOR_INPUTS_KEY = 'fire-calculator-inputs';

// Cookie options - secure settings for production
const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 365, // 1 year
  sameSite: 'strict',
  secure: window.location.protocol === 'https:', // Only secure in HTTPS
  path: '/',
};

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
    typeof obj.laborIncomeGrowthRate === 'number' &&
    typeof obj.savingsRate === 'number' &&
    typeof obj.desiredWithdrawalRate === 'number' &&
    typeof obj.expectedStockReturn === 'number' &&
    typeof obj.expectedBondReturn === 'number' &&
    typeof obj.expectedCashReturn === 'number' &&
    typeof obj.yearOfBirth === 'number' &&
    typeof obj.retirementAge === 'number' &&
    typeof obj.statePensionIncome === 'number' &&
    typeof obj.privatePensionIncome === 'number' &&
    typeof obj.otherIncome === 'number' &&
    typeof obj.stopWorkingAtFIRE === 'boolean'
  );
}

/**
 * Save Asset Allocation data to encrypted cookies
 */
export function saveAssetAllocation(
  assets: Asset[],
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>
): void {
  try {
    const assetsJson = JSON.stringify(assets);
    const targetsJson = JSON.stringify(assetClassTargets);
    
    const encryptedAssets = encryptData(assetsJson);
    const encryptedTargets = encryptData(targetsJson);
    
    Cookies.set(ASSET_ALLOCATION_KEY, encryptedAssets, COOKIE_OPTIONS);
    Cookies.set(ASSET_CLASS_TARGETS_KEY, encryptedTargets, COOKIE_OPTIONS);
  } catch (error) {
    console.error('Failed to save asset allocation to cookies:', error);
    throw new Error('Failed to save data to cookies. Cookies may be disabled.');
  }
}

/**
 * Load Asset Allocation data from encrypted cookies
 */
export function loadAssetAllocation(): {
  assets: Asset[] | null;
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> | null;
} {
  try {
    const encryptedAssets = Cookies.get(ASSET_ALLOCATION_KEY);
    const encryptedTargets = Cookies.get(ASSET_CLASS_TARGETS_KEY);

    let assets: Asset[] | null = null;
    let assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }> | null = null;

    if (encryptedAssets) {
      const decryptedAssets = decryptData(encryptedAssets);
      if (decryptedAssets) {
        const parsedAssets = JSON.parse(decryptedAssets);
        if (Array.isArray(parsedAssets) && parsedAssets.every(isValidAsset)) {
          assets = parsedAssets;
        }
      }
    }

    if (encryptedTargets) {
      const decryptedTargets = decryptData(encryptedTargets);
      if (decryptedTargets) {
        const parsedTargets = JSON.parse(decryptedTargets);
        if (typeof parsedTargets === 'object') {
          assetClassTargets = parsedTargets;
        }
      }
    }

    return { assets, assetClassTargets };
  } catch (error) {
    console.error('Failed to load asset allocation from cookies:', error);
    return { assets: null, assetClassTargets: null };
  }
}

/**
 * Clear Asset Allocation data from cookies
 */
export function clearAssetAllocation(): void {
  try {
    Cookies.remove(ASSET_ALLOCATION_KEY, { path: '/' });
    Cookies.remove(ASSET_CLASS_TARGETS_KEY, { path: '/' });
  } catch (error) {
    console.error('Failed to clear asset allocation from cookies:', error);
  }
}

/**
 * Save FIRE Calculator inputs to encrypted cookies
 */
export function saveFireCalculatorInputs(inputs: CalculatorInputs): void {
  try {
    const inputsJson = JSON.stringify(inputs);
    const encryptedInputs = encryptData(inputsJson);
    
    Cookies.set(FIRE_CALCULATOR_INPUTS_KEY, encryptedInputs, COOKIE_OPTIONS);
  } catch (error) {
    console.error('Failed to save FIRE calculator inputs to cookies:', error);
    throw new Error('Failed to save data to cookies. Cookies may be disabled.');
  }
}

/**
 * Load FIRE Calculator inputs from encrypted cookies
 */
export function loadFireCalculatorInputs(): CalculatorInputs | null {
  try {
    const encryptedInputs = Cookies.get(FIRE_CALCULATOR_INPUTS_KEY);
    if (encryptedInputs) {
      const decryptedInputs = decryptData(encryptedInputs);
      if (decryptedInputs) {
        const parsed = JSON.parse(decryptedInputs);
        if (isValidCalculatorInputs(parsed)) {
          // Merge with defaults to ensure all fields exist
          return { ...DEFAULT_INPUTS, ...parsed };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to load FIRE calculator inputs from cookies:', error);
    return null;
  }
}

/**
 * Clear FIRE Calculator inputs from cookies
 */
export function clearFireCalculatorInputs(): void {
  try {
    Cookies.remove(FIRE_CALCULATOR_INPUTS_KEY, { path: '/' });
  } catch (error) {
    console.error('Failed to clear FIRE calculator inputs from cookies:', error);
  }
}

/**
 * Clear all FIRE Calculator data from cookies
 * This includes both Asset Allocation and FIRE Calculator inputs
 */
export function clearAllData(): void {
  clearAssetAllocation();
  clearFireCalculatorInputs();
}

/**
 * Check if cookie storage is available and working
 */
export function isCookieStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    const testValue = 'test';
    Cookies.set(testKey, testValue);
    const retrieved = Cookies.get(testKey);
    Cookies.remove(testKey);
    return retrieved === testValue;
  } catch {
    return false;
  }
}
