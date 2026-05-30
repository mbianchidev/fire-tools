/**
 * Demo mode detection + data seeding.
 *
 * When the SPA is served from GitHub Pages (or explicitly opted in via
 * ?demo=1), it boots as a sandbox: every page is pre-populated with mock
 * data, and persistence is disabled so refreshes always restore the demo.
 * Electron, self-hosted deployments, dev, and the unit tests are untouched.
 */

import type { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import type { CalculatorInputs } from '../types/calculator';
import type { ExpenseTrackerData } from '../types/expenseTracker';
import type { NetWorthTrackerData } from '../types/netWorthTracker';
import {
  DEFAULT_INPUTS,
  getDemoAssetAllocationData,
  getDemoCashflowData,
  getDemoNetWorthData,
} from './defaults';

function detectDemoMode(): boolean {
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }
  // Electron loads via file:// — never demo there.
  if (window.location.protocol === 'file:') {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1') {
      return true;
    }
  } catch {
    // ignore malformed URLs
  }
  const host = window.location.hostname || '';
  return host === 'mbianchidev.github.io' || host.endsWith('.github.io');
}

export const IS_DEMO_MODE: boolean = detectDemoMode();

// Memoise the seed so navigations don't reshuffle randomised demo data.
let cachedAssetAllocation: {
  assets: Asset[];
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
} | null = null;
let cachedExpenseTracker: ExpenseTrackerData | null = null;
let cachedNetWorthTracker: NetWorthTrackerData | null = null;

export function getDemoCalculatorInputs(): CalculatorInputs {
  return { ...DEFAULT_INPUTS };
}

export function getDemoAssetAllocation() {
  if (!cachedAssetAllocation) {
    cachedAssetAllocation = getDemoAssetAllocationData();
  }
  return cachedAssetAllocation;
}

export function getDemoExpenseTracker(): ExpenseTrackerData {
  if (!cachedExpenseTracker) {
    cachedExpenseTracker = getDemoCashflowData();
  }
  return cachedExpenseTracker;
}

export function getDemoNetWorthTracker(): NetWorthTrackerData {
  if (!cachedNetWorthTracker) {
    cachedNetWorthTracker = getDemoNetWorthData();
  }
  return cachedNetWorthTracker;
}
