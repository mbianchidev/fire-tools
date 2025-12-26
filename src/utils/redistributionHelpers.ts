/**
 * Helper functions for target allocation redistribution
 */

/**
 * Redistribute percentages among a list of items using equal distribution
 * This gives each item an equal share of the remaining percentage
 * 
 * @param remainingPercent - The percentage to distribute (e.g., 100 - editedItemPercent)
 * @param itemCount - Number of items to distribute among
 * @returns The percentage each item should get
 */
export function redistributeEqually(
  remainingPercent: number,
  itemCount: number
): number {
  if (itemCount === 0) return 0;
  return remainingPercent / itemCount;
}

/**
 * Redistribute percentages among items using proportional distribution
 * This maintains the relative proportions of existing percentages
 * 
 * @param items - Array of items with current percentages
 * @param remainingPercent - The percentage to distribute
 * @returns Array of new percentages for each item
 */
export function redistributeProportionally<T extends { currentPercent: number }>(
  items: T[],
  remainingPercent: number
): number[] {
  const total = items.reduce((sum, item) => sum + item.currentPercent, 0);
  
  if (total === 0) {
    // If all items are at 0%, distribute equally
    return items.map(() => redistributeEqually(remainingPercent, items.length));
  }
  
  // Distribute proportionally based on current percentages
  return items.map(item => (item.currentPercent / total) * remainingPercent);
}

/**
 * Determine redistribution strategy: equal or proportional
 * Uses equal distribution by default, but switches to proportional
 * if one item has a significantly larger percentage than others (prevalent)
 * 
 * @param items - Array of items with current percentages
 * @returns 'equal' or 'proportional'
 */
export function determineRedistributionStrategy<T extends { currentPercent: number }>(
  items: T[],
  prevalenceThreshold: number = 2.0 // An item is prevalent if it's >2x the average
): 'equal' | 'proportional' {
  if (items.length === 0) return 'equal';
  
  const total = items.reduce((sum, item) => sum + item.currentPercent, 0);
  const average = total / items.length;
  
  // Check if any item is significantly larger than average
  const hasPrevalentItem = items.some(
    item => item.currentPercent > average * prevalenceThreshold
  );
  
  return hasPrevalentItem ? 'proportional' : 'equal';
}

/**
 * Redistribute percentages among items using the appropriate strategy
 * 
 * @param items - Array of items with current percentages
 * @param remainingPercent - The percentage to distribute
 * @param forceStrategy - Optional: force 'equal' or 'proportional' strategy
 * @returns Array of new percentages for each item
 */
export function redistributePercentages<T extends { currentPercent: number }>(
  items: T[],
  remainingPercent: number,
  forceStrategy?: 'equal' | 'proportional'
): number[] {
  if (items.length === 0) return [];
  
  const strategy = forceStrategy || determineRedistributionStrategy(items);
  
  if (strategy === 'equal') {
    const equalPercent = redistributeEqually(remainingPercent, items.length);
    return items.map(() => equalPercent);
  } else {
    return redistributeProportionally(items, remainingPercent);
  }
}
