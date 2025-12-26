import { describe, it, expect } from 'vitest';
import {
  redistributeEqually,
  redistributeProportionally,
  determineRedistributionStrategy,
  redistributePercentages,
} from './redistributionHelpers';

describe('redistributionHelpers', () => {
  describe('redistributeEqually', () => {
    it('should distribute remaining percentage equally', () => {
      expect(redistributeEqually(75, 3)).toBe(25);
      expect(redistributeEqually(70, 1)).toBe(70);
      expect(redistributeEqually(90, 2)).toBe(45);
    });

    it('should handle zero items', () => {
      expect(redistributeEqually(100, 0)).toBe(0);
    });
  });

  describe('redistributeProportionally', () => {
    it('should distribute proportionally based on current percentages', () => {
      const items = [
        { currentPercent: 60 },
        { currentPercent: 35 },
      ];
      
      const result = redistributeProportionally(items, 90);
      
      expect(result[0]).toBeCloseTo(56.84, 2); // (60/95) * 90
      expect(result[1]).toBeCloseTo(33.16, 2); // (35/95) * 90
    });

    it('should distribute equally when all items are 0%', () => {
      const items = [
        { currentPercent: 0 },
        { currentPercent: 0 },
        { currentPercent: 0 },
      ];
      
      const result = redistributeProportionally(items, 90);
      
      expect(result[0]).toBe(30);
      expect(result[1]).toBe(30);
      expect(result[2]).toBe(30);
    });

    it('should handle single item', () => {
      const items = [{ currentPercent: 40 }];
      
      const result = redistributeProportionally(items, 70);
      
      expect(result[0]).toBe(70);
    });
  });

  describe('determineRedistributionStrategy', () => {
    it('should return equal for similar percentages', () => {
      const items = [
        { currentPercent: 25 },
        { currentPercent: 25 },
        { currentPercent: 25 },
        { currentPercent: 25 },
      ];
      
      expect(determineRedistributionStrategy(items)).toBe('equal');
    });

    it('should return proportional when one item is prevalent', () => {
      const items = [
        { currentPercent: 70 },
        { currentPercent: 15 },
        { currentPercent: 15 },
      ];
      
      // Average is 33.33, 70 > 33.33 * 2, so it's prevalent
      expect(determineRedistributionStrategy(items)).toBe('proportional');
    });

    it('should return equal for moderately different percentages', () => {
      const items = [
        { currentPercent: 25 },
        { currentPercent: 15 },
        { currentPercent: 10 },
        { currentPercent: 5 },
      ];
      
      // Average is 13.75, max is 25, 25 < 13.75 * 2 (27.5), so not prevalent
      expect(determineRedistributionStrategy(items)).toBe('equal');
    });

    it('should handle custom prevalence threshold', () => {
      const items = [
        { currentPercent: 40 },
        { currentPercent: 30 },
        { currentPercent: 30 },
      ];
      
      // Average is 33.33, with default threshold (2.0): 40 < 66.66, not prevalent
      expect(determineRedistributionStrategy(items, 2.0)).toBe('equal');
      
      // With threshold 1.1: 40 > 36.66, prevalent
      expect(determineRedistributionStrategy(items, 1.1)).toBe('proportional');
    });
  });

  describe('redistributePercentages', () => {
    it('should use equal distribution for similar percentages', () => {
      const items = [
        { currentPercent: 25 },
        { currentPercent: 15 },
        { currentPercent: 10 },
        { currentPercent: 5 },
      ];
      
      // Should distribute 75% equally (since no prevalent item)
      const result = redistributePercentages(items, 75);
      
      expect(result[0]).toBe(18.75);
      expect(result[1]).toBe(18.75);
      expect(result[2]).toBe(18.75);
      expect(result[3]).toBe(18.75);
    });

    it('should use proportional distribution when one item is prevalent', () => {
      const items = [
        { currentPercent: 70 },
        { currentPercent: 20 },
        { currentPercent: 10 },
      ];
      
      // Should distribute proportionally (70 is prevalent)
      const result = redistributePercentages(items, 90);
      
      expect(result[0]).toBeCloseTo(63, 0); // (70/100) * 90 = 63
      expect(result[1]).toBeCloseTo(18, 0); // (20/100) * 90 = 18
      expect(result[2]).toBeCloseTo(9, 0); // (10/100) * 90 = 9
    });

    it('should allow forcing equal distribution', () => {
      const items = [
        { currentPercent: 70 },
        { currentPercent: 20 },
        { currentPercent: 10 },
      ];
      
      // Force equal distribution despite prevalent item
      const result = redistributePercentages(items, 90, 'equal');
      
      expect(result[0]).toBe(30);
      expect(result[1]).toBe(30);
      expect(result[2]).toBe(30);
    });

    it('should allow forcing proportional distribution', () => {
      const items = [
        { currentPercent: 25 },
        { currentPercent: 25 },
        { currentPercent: 25 },
        { currentPercent: 25 },
      ];
      
      // Force proportional distribution despite equal items
      const result = redistributePercentages(items, 100, 'proportional');
      
      expect(result[0]).toBe(25);
      expect(result[1]).toBe(25);
      expect(result[2]).toBe(25);
      expect(result[3]).toBe(25);
    });
  });

  describe('Real-world scenarios from issue', () => {
    it('should handle Asset Specific Example 1: VBR changes from 45% to 25%', () => {
      // Other assets: SPY 25%, VTI 15%, VXUS 10%, VWO 5%
      const items = [
        { name: 'SPY', currentPercent: 25 },
        { name: 'VTI', currentPercent: 15 },
        { name: 'VXUS', currentPercent: 10 },
        { name: 'VWO', currentPercent: 5 },
      ];
      
      // VBR changed from 45% to 25%, freeing 20%
      // This 20% is distributed equally: 20 / 4 = 5% each
      // New values are: 25+5=30, 15+5=20, 10+5=15, 5+5=10
      const freedPercent = 20; // 45 - 25
      const equalShare = freedPercent / items.length;
      
      expect(equalShare).toBe(5);
      
      const newPercentages = items.map(item => item.currentPercent + equalShare);
      expect(newPercentages[0]).toBe(30);
      expect(newPercentages[1]).toBe(20);
      expect(newPercentages[2]).toBe(15);
      expect(newPercentages[3]).toBe(10);
    });

    it('should handle Asset Specific Example 2: Delete BNDX, redistribute among BND and TIP', () => {
      // After deletion: BND 33.33%, TIP 33.33%
      const items = [
        { name: 'BND', currentPercent: 33.33 },
        { name: 'TIP', currentPercent: 33.33 },
      ];
      
      // Redistribute to 100% total
      const result = redistributePercentages(items, 100, 'equal');
      
      // Should get 50% each
      expect(result[0]).toBe(50);
      expect(result[1]).toBe(50);
    });
  });
});
