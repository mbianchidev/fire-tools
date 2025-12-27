import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

// Helper function to get nested property value
function getNestedValue<T>(obj: T, path: string): any {
  return path.split('.').reduce((current: any, prop) => current?.[prop], obj);
}

export function useTableSort<T>(data: T[], defaultKey?: string) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultKey || null,
    direction: null,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key!);
      const bValue = getNestedValue(b, sortConfig.key!);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key: direction ? key : null, direction });
  };

  const getSortIndicator = (key: string): string => {
    if (sortConfig.key !== key) return '⇅';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '⇅';
  };

  return { sortedData, requestSort, getSortIndicator, sortConfig };
}
