/**
 * Vehicle Depreciation Calculator
 * Functions for calculating depreciation of vehicles over time
 */

import { VehicleDepreciation } from '../types/netWorthTracker';

/**
 * Calculate current depreciated value of a vehicle
 * 
 * @param depreciation - Vehicle depreciation data
 * @param currentDate - Current date (ISO string YYYY-MM-DD) or Date object
 * @returns Current depreciated value
 */
export function calculateDepreciatedValue(
  depreciation: VehicleDepreciation,
  currentDate: string | Date = new Date().toISOString().split('T')[0]
): number {
  const purchaseDate = new Date(depreciation.purchaseDate);
  const current = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  
  // Calculate years elapsed
  const yearsElapsed = (current.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (yearsElapsed < 0) {
    // Future purchase date - return purchase price
    return depreciation.purchasePrice;
  }
  
  if (yearsElapsed >= depreciation.usefulLifeYears) {
    // Past useful life - return salvage value
    return depreciation.salvageValue;
  }
  
  let depreciatedValue: number;
  
  switch (depreciation.method) {
    case 'STRAIGHT_LINE':
      depreciatedValue = calculateStraightLineDepreciation(
        depreciation.purchasePrice,
        depreciation.salvageValue,
        depreciation.usefulLifeYears,
        yearsElapsed
      );
      break;
      
    case 'DECLINING_BALANCE':
      depreciatedValue = calculateDecliningBalanceDepreciation(
        depreciation.purchasePrice,
        depreciation.salvageValue,
        depreciation.annualDepreciationRate || 20,
        yearsElapsed
      );
      break;
      
    case 'MANUAL':
      // For manual mode, use currentDepreciation if provided
      if (depreciation.currentDepreciation !== undefined) {
        depreciatedValue = depreciation.purchasePrice - depreciation.currentDepreciation;
      } else {
        // Fallback to straight line if no manual depreciation provided
        depreciatedValue = calculateStraightLineDepreciation(
          depreciation.purchasePrice,
          depreciation.salvageValue,
          depreciation.usefulLifeYears,
          yearsElapsed
        );
      }
      break;
      
    default:
      depreciatedValue = depreciation.purchasePrice;
  }
  
  // Ensure value doesn't go below salvage value
  return Math.max(depreciatedValue, depreciation.salvageValue);
}

/**
 * Calculate straight-line depreciation
 * Value decreases linearly over time
 * 
 * @param purchasePrice - Original purchase price
 * @param salvageValue - Expected value at end of useful life
 * @param usefulLifeYears - Total useful life in years
 * @param yearsElapsed - Years since purchase
 * @returns Current depreciated value
 */
function calculateStraightLineDepreciation(
  purchasePrice: number,
  salvageValue: number,
  usefulLifeYears: number,
  yearsElapsed: number
): number {
  const depreciableAmount = purchasePrice - salvageValue;
  const annualDepreciation = depreciableAmount / usefulLifeYears;
  const totalDepreciation = annualDepreciation * yearsElapsed;
  
  return purchasePrice - totalDepreciation;
}

/**
 * Calculate declining balance depreciation
 * Value decreases by a percentage each year
 * 
 * @param purchasePrice - Original purchase price
 * @param salvageValue - Expected value at end of useful life
 * @param annualRate - Annual depreciation rate (e.g., 20 for 20%)
 * @param yearsElapsed - Years since purchase
 * @returns Current depreciated value
 */
function calculateDecliningBalanceDepreciation(
  purchasePrice: number,
  salvageValue: number,
  annualRate: number,
  yearsElapsed: number
): number {
  const declineRate = annualRate / 100;
  let currentValue = purchasePrice;
  
  for (let i = 0; i < Math.floor(yearsElapsed); i++) {
    currentValue = currentValue * (1 - declineRate);
    // Don't go below salvage value
    if (currentValue <= salvageValue) {
      return salvageValue;
    }
  }
  
  // Handle fractional year
  const fractionalYear = yearsElapsed - Math.floor(yearsElapsed);
  if (fractionalYear > 0) {
    currentValue = currentValue * (1 - declineRate * fractionalYear);
  }
  
  return Math.max(currentValue, salvageValue);
}

/**
 * Calculate accumulated depreciation for a vehicle
 * 
 * @param depreciation - Vehicle depreciation data
 * @param currentDate - Current date (ISO string YYYY-MM-DD) or Date object
 * @returns Accumulated depreciation amount
 */
export function calculateAccumulatedDepreciation(
  depreciation: VehicleDepreciation,
  currentDate: string | Date = new Date().toISOString().split('T')[0]
): number {
  const currentValue = calculateDepreciatedValue(depreciation, currentDate);
  return depreciation.purchasePrice - currentValue;
}

/**
 * Calculate annual depreciation expense for a vehicle
 * 
 * @param depreciation - Vehicle depreciation data
 * @returns Annual depreciation expense
 */
export function calculateAnnualDepreciation(
  depreciation: VehicleDepreciation
): number {
  switch (depreciation.method) {
    case 'STRAIGHT_LINE':
      return (depreciation.purchasePrice - depreciation.salvageValue) / depreciation.usefulLifeYears;
      
    case 'DECLINING_BALANCE': {
      const rate = (depreciation.annualDepreciationRate || 20) / 100;
      return depreciation.purchasePrice * rate;
    }
      
    case 'MANUAL':
      if (depreciation.currentDepreciation !== undefined) {
        // For manual, estimate based on current depreciation and time elapsed
        const purchaseDate = new Date(depreciation.purchaseDate);
        const current = new Date();
        const yearsElapsed = (current.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (yearsElapsed > 0) {
          return depreciation.currentDepreciation / yearsElapsed;
        }
      }
      // Fallback to straight line
      return (depreciation.purchasePrice - depreciation.salvageValue) / depreciation.usefulLifeYears;
      
    default:
      return 0;
  }
}

/**
 * Get depreciation schedule for a vehicle
 * Returns projected values for each year of the vehicle's useful life
 * 
 * @param depreciation - Vehicle depreciation data
 * @returns Array of { year: number, value: number, depreciation: number }
 */
export function getDepreciationSchedule(
  depreciation: VehicleDepreciation
): Array<{ year: number; value: number; depreciation: number; accumulatedDepreciation: number }> {
  const schedule: Array<{ year: number; value: number; depreciation: number; accumulatedDepreciation: number }> = [];
  const purchaseDate = new Date(depreciation.purchaseDate);
  
  for (let year = 0; year <= depreciation.usefulLifeYears; year++) {
    const date = new Date(purchaseDate);
    date.setFullYear(date.getFullYear() + year);
    
    const value = calculateDepreciatedValue(depreciation, date.toISOString().split('T')[0]);
    const accumulatedDepreciation = depreciation.purchasePrice - value;
    const annualDepreciation = year === 0 ? 0 : schedule[year - 1].value - value;
    
    schedule.push({
      year,
      value: Math.round(value * 100) / 100,
      depreciation: Math.round(annualDepreciation * 100) / 100,
      accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
    });
  }
  
  return schedule;
}
