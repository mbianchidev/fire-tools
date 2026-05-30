import { describe, it, expect } from 'vitest';
import { useTableSort } from '../../src/utils/useTableSort';
import { renderHook, act } from '@testing-library/react';

describe('useTableSort', () => {
  describe('AssetClassTable sorting', () => {
    const assetClassData = [
      { assetClass: 'STOCKS', targetPercent: 60, currentPercent: 53.85, currentTotal: 35000, targetTotal: 39000, delta: 4000, action: 'BUY' },
      { assetClass: 'BONDS', targetPercent: 40, currentPercent: 46.15, currentTotal: 30000, targetTotal: 26000, delta: -4000, action: 'SELL' },
      { assetClass: 'CASH', targetPercent: undefined, currentPercent: 7.69, currentTotal: 5000, targetTotal: 5000, delta: 0, action: 'HOLD' },
    ];

    it('should sort by % Target (class) ascending', () => {
      const { result } = renderHook(() => useTableSort(assetClassData));
      
      act(() => {
        result.current.requestSort('targetPercent');
      });

      const sorted = result.current.sortedData;
      // undefined values should be sorted to the end
      expect(sorted[0].targetPercent).toBe(40);
      expect(sorted[1].targetPercent).toBe(60);
      expect(sorted[2].targetPercent).toBe(undefined);
    });

    it('should sort by % Current descending', () => {
      const { result } = renderHook(() => useTableSort(assetClassData));
      
      act(() => {
        result.current.requestSort('currentPercent');
      });
      act(() => {
        result.current.requestSort('currentPercent');
      });

      const sorted = result.current.sortedData;
      expect(sorted[0].currentPercent).toBe(53.85);
      expect(sorted[1].currentPercent).toBe(46.15);
      expect(sorted[2].currentPercent).toBe(7.69);
    });

    it('should sort by Delta ascending', () => {
      const { result } = renderHook(() => useTableSort(assetClassData));
      
      act(() => {
        result.current.requestSort('delta');
      });

      const sorted = result.current.sortedData;
      expect(sorted[0].delta).toBe(-4000);
      expect(sorted[1].delta).toBe(0);
      expect(sorted[2].delta).toBe(4000);
    });
  });

  describe('Asset-specific table sorting', () => {
    const assetData = [
      { asset: { name: 'S&P 500 Index', type: 'ETF', ticker: 'SPY', targetMode: 'PERCENTAGE', targetPercent: 40 }, delta: { currentPercent: 21.54, currentPercentInClass: 40, currentValue: 14000, targetValue: 15600, delta: 1600 } },
      { asset: { name: 'Vanguard Total', type: 'ETF', ticker: 'VTI', targetMode: 'PERCENTAGE', targetPercent: 27 }, delta: { currentPercent: 14.54, currentPercentInClass: 27, currentValue: 9450, targetValue: 10530, delta: 1080 } },
      { asset: { name: 'International Markets', type: 'ETF', ticker: 'VXUS', targetMode: 'PERCENTAGE', targetPercent: 17 }, delta: { currentPercent: 9.15, currentPercentInClass: 17, currentValue: 5950, targetValue: 6630, delta: 680 } },
    ];

    it('should sort by Asset Name ascending', () => {
      const { result } = renderHook(() => useTableSort(assetData));
      
      act(() => {
        result.current.requestSort('asset.name');
      });

      const sorted = result.current.sortedData;
      expect(sorted[0].asset.name).toBe('International Markets');
      expect(sorted[1].asset.name).toBe('S&P 500 Index');
      expect(sorted[2].asset.name).toBe('Vanguard Total');
    });

    it('should sort by Ticker descending', () => {
      const { result } = renderHook(() => useTableSort(assetData));
      
      act(() => {
        result.current.requestSort('asset.ticker');
      });
      act(() => {
        result.current.requestSort('asset.ticker');
      });

      const sorted = result.current.sortedData;
      expect(sorted[0].asset.ticker).toBe('VXUS');
      expect(sorted[1].asset.ticker).toBe('VTI');
      expect(sorted[2].asset.ticker).toBe('SPY');
    });

    it('should sort by Current Value ascending', () => {
      const { result } = renderHook(() => useTableSort(assetData));
      
      act(() => {
        result.current.requestSort('delta.currentValue');
      });

      const sorted = result.current.sortedData;
      expect(sorted[0].delta.currentValue).toBe(5950);
      expect(sorted[1].delta.currentValue).toBe(9450);
      expect(sorted[2].delta.currentValue).toBe(14000);
    });

    it('should cycle through sort states: asc -> desc -> unsorted', () => {
      const { result } = renderHook(() => useTableSort(assetData));
      
      // First click: ascending
      act(() => {
        result.current.requestSort('delta.delta');
      });
      expect(result.current.sortConfig.direction).toBe('asc');
      expect(result.current.sortedData[0].delta.delta).toBe(680);

      // Second click: descending
      act(() => {
        result.current.requestSort('delta.delta');
      });
      expect(result.current.sortConfig.direction).toBe('desc');
      expect(result.current.sortedData[0].delta.delta).toBe(1600);

      // Third click: unsorted
      act(() => {
        result.current.requestSort('delta.delta');
      });
      expect(result.current.sortConfig.direction).toBe(null);
      expect(result.current.sortedData).toEqual(assetData);
    });
  });
});
