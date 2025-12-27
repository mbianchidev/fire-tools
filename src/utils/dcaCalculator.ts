/**
 * DCA (Dollar Cost Averaging) Calculator
 * 
 * This module provides functionality to calculate how to invest a lump sum
 * according to the user's asset allocation targets.
 */

import { Asset, AssetClass } from '../types/assetAllocation';

export interface DCAAssetAllocation {
  assetId: string;
  assetName: string;
  ticker: string;
  assetClass: AssetClass;
  allocationPercent: number; // Percentage within the asset's class
  investmentAmount: number; // Dollar amount to invest in this asset
  currentPrice?: number; // Current price per share from API
  shares?: number; // Number of shares to buy (fractional supported)
  priceError?: string; // Error message if price fetch failed
}

export interface DCACalculation {
  totalAmount: number;
  allocations: DCAAssetAllocation[];
  totalAllocated: number; // Should equal totalAmount
  timestamp: Date;
}

/**
 * Calculate DCA allocation based on asset allocation percentages.
 * This distributes the investment amount according to the target allocation.
 * 
 * @param assets - Array of assets with allocation information
 * @param investmentAmount - Total amount to invest
 * @param assetClassTargets - Class-level target configurations
 * @returns DCA calculation result with per-asset breakdown
 */
export function calculateDCAAllocation(
  assets: Asset[],
  investmentAmount: number,
  assetClassTargets: Record<AssetClass, { targetMode: string; targetPercent?: number }>
): DCACalculation {
  const allocations: DCAAssetAllocation[] = [];
  
  // Filter out assets that are OFF or in SET mode (not part of percentage allocation)
  const percentageAssets = assets.filter(a => a.targetMode === 'PERCENTAGE');
  
  // Group assets by class
  const assetsByClass = new Map<AssetClass, Asset[]>();
  percentageAssets.forEach(asset => {
    if (!assetsByClass.has(asset.assetClass)) {
      assetsByClass.set(asset.assetClass, []);
    }
    assetsByClass.get(asset.assetClass)!.push(asset);
  });
  
  // Calculate investment amount per class based on class targets
  assetsByClass.forEach((classAssets, assetClass) => {
    const classTarget = assetClassTargets[assetClass];
    
    // Only process percentage-based classes
    if (classTarget?.targetMode !== 'PERCENTAGE' || !classTarget.targetPercent) {
      return;
    }
    
    // Calculate how much to invest in this class
    const classInvestmentAmount = (classTarget.targetPercent / 100) * investmentAmount;
    
    // Calculate total percentage within this class
    const classTotalPercent = classAssets.reduce((sum, a) => sum + (a.targetPercent || 0), 0);
    
    // Distribute class investment to individual assets based on their target percentage within the class
    classAssets.forEach(asset => {
      const assetPercent = asset.targetPercent || 0;
      
      // Asset's share of the class investment
      const assetInvestmentAmount = classTotalPercent > 0 
        ? (assetPercent / classTotalPercent) * classInvestmentAmount
        : 0;
      
      allocations.push({
        assetId: asset.id,
        assetName: asset.name,
        ticker: asset.ticker,
        assetClass: asset.assetClass,
        allocationPercent: assetPercent,
        investmentAmount: assetInvestmentAmount,
      });
    });
  });
  
  const totalAllocated = allocations.reduce((sum, a) => sum + a.investmentAmount, 0);
  
  return {
    totalAmount: investmentAmount,
    allocations,
    totalAllocated,
    timestamp: new Date(),
  };
}

/**
 * Fetch current asset prices from public API.
 * 
 * For this implementation, we'll use Yahoo Finance API via a public proxy.
 * Alternative APIs: Alpha Vantage, Finnhub, IEX Cloud
 * 
 * Note: This uses a free public API. For production use, consider:
 * - Rate limiting
 * - Caching prices (they don't change every second)
 * - Fallback to alternative APIs
 * - User-provided prices as fallback
 */
export async function fetchAssetPrices(tickers: string[]): Promise<Record<string, number | null>> {
  const prices: Record<string, number | null> = {};
  
  // Initialize all tickers with null (failed to fetch)
  tickers.forEach(ticker => {
    prices[ticker] = null;
  });
  
  // Skip empty tickers
  const validTickers = tickers.filter(t => t && t.trim().length > 0);
  
  if (validTickers.length === 0) {
    return prices;
  }
  
  try {
    // Use Yahoo Finance API via public endpoint
    // Format: https://query1.finance.yahoo.com/v7/finance/quote?symbols=TICKER1,TICKER2
    const tickerList = validTickers.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickerList}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to fetch prices:', response.statusText);
      return prices;
    }
    
    const data = await response.json();
    
    // Parse response
    if (data?.quoteResponse?.result) {
      data.quoteResponse.result.forEach((quote: any) => {
        const symbol = quote.symbol;
        const price = quote.regularMarketPrice || quote.ask || quote.bid;
        
        if (symbol && price && typeof price === 'number') {
          prices[symbol] = price;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching asset prices:', error);
  }
  
  return prices;
}

/**
 * Calculate number of shares for each asset based on current prices.
 * 
 * @param calculation - DCA calculation with allocations
 * @param prices - Map of ticker to current price
 * @returns Updated DCA calculation with share counts
 */
export function calculateShares(
  calculation: DCACalculation,
  prices: Record<string, number | null>
): DCACalculation {
  const updatedAllocations = calculation.allocations.map(allocation => {
    const price = prices[allocation.ticker];
    
    if (price === null || price === undefined) {
      return {
        ...allocation,
        priceError: 'Price unavailable',
      };
    }
    
    if (price <= 0) {
      return {
        ...allocation,
        priceError: 'Invalid price',
      };
    }
    
    // Calculate shares (fractional supported)
    const shares = allocation.investmentAmount / price;
    
    return {
      ...allocation,
      currentPrice: price,
      shares,
    };
  });
  
  return {
    ...calculation,
    allocations: updatedAllocations,
  };
}

/**
 * Format share count for display (up to 6 decimal places for fractional shares).
 */
export function formatShares(shares: number): string {
  // Show up to 6 decimal places, but remove trailing zeros
  return shares.toFixed(6).replace(/\.?0+$/, '');
}

/**
 * Format currency for display.
 */
export function formatDCACurrency(amount: number, currency: string = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : '$';
  return `${symbol}${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })}`;
}
