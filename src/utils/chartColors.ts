/**
 * Theme-aware chart colors
 * Gets colors from CSS variables for dark/light mode support
 */

export const getChartColors = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    primary: computedStyle.getPropertyValue('--color-chart-primary').trim() || '#00bcd4',
    secondary: computedStyle.getPropertyValue('--color-chart-secondary').trim() || '#26c6da',
    tertiary: computedStyle.getPropertyValue('--color-chart-tertiary').trim() || '#4dd0e1',
    income: computedStyle.getPropertyValue('--color-chart-income').trim() || '#4CAF50',
    expense: computedStyle.getPropertyValue('--color-chart-expense').trim() || '#ff9800',
    networth: computedStyle.getPropertyValue('--color-chart-networth').trim() || '#9c27b0',
    forecast: computedStyle.getPropertyValue('--color-chart-forecast').trim() || '#667eea',
    grid: computedStyle.getPropertyValue('--color-chart-grid').trim() || '#e0e0e0',
    text: computedStyle.getPropertyValue('--color-chart-text').trim() || '#666',
    label: computedStyle.getPropertyValue('--color-chart-label').trim() || '#333',
  };
};

export const useChartColors = () => {
  return getChartColors();
};
