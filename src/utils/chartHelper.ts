/**
 * Calculate the appropriate interval for X-axis ticks based on data length
 * 
 * @param dataLength - Number of data points to display
 * @returns Either "preserveStartEnd" for small datasets or a number representing the interval
 * 
 * Interval logic:
 * - 0-20 data points: "preserveStartEnd" (show all ticks)
 * - 21-40 data points: 1 (show every 2nd tick, i.e., skip 1)
 * - 41+ data points: 3 (show every 4th tick, i.e., skip 3)
 */
export function calculateXAxisInterval(dataLength: number): 'preserveStartEnd' | number {
  if (dataLength <= 20) {
    return 'preserveStartEnd';
  } else if (dataLength <= 40) {
    return 1;
  } else {
    return 3;
  }
}

/**
 * Calculate the appropriate bar size for bar charts based on data length
 * 
 * @param dataLength - Number of data points to display
 * @returns Bar size in pixels
 * 
 * Bar size logic:
 * - 0-20 data points: 40px (wide bars for better visibility with few data points)
 * - 21-40 data points: 20px (medium bars for moderate amount of data)
 * - 41+ data points: 10px (thin bars to fit many data points)
 */
export function calculateBarSize(dataLength: number): number {
  if (dataLength <= 20) {
    return 40;
  } else if (dataLength <= 40) {
    return 20;
  } else {
    return 10;
  }
}
