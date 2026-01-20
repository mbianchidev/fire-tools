import { describe, expect, it } from 'vitest';
import {
  getCategoryInfo,
  getAllCategories,
  getUsedIcons,
  getAvailableIcons,
  generateCategoryId,
  CATEGORY_COLORS,
  AVAILABLE_ICONS,
  EXPENSE_CATEGORIES,
  CustomCategory,
} from '../../src/types/expenseTracker';

describe('Custom Categories', () => {
  // Sample custom categories for testing
  const mockCustomCategories: CustomCategory[] = [
    {
      id: 'cat-custom-1',
      name: 'Pet Care',
      icon: 'pets',
      color: '#ff6b6b',
      defaultExpenseType: 'WANT',
    },
    {
      id: 'cat-custom-2',
      name: 'Gym Membership',
      icon: 'fitness_center',
      color: '#4ecdc4',
      defaultExpenseType: 'NEED',
    },
  ];

  describe('getCategoryInfo', () => {
    it('should return built-in category info by ID', () => {
      const categoryInfo = getCategoryInfo('HOUSING');
      expect(categoryInfo.id).toBe('HOUSING');
      expect(categoryInfo.name).toBe('Housing');
      expect(categoryInfo.icon).toBe('home');
      expect(categoryInfo.defaultExpenseType).toBe('NEED');
    });

    it('should return custom category info when custom categories provided', () => {
      const categoryInfo = getCategoryInfo('cat-custom-1', mockCustomCategories);
      expect(categoryInfo.id).toBe('cat-custom-1');
      expect(categoryInfo.name).toBe('Pet Care');
      expect(categoryInfo.icon).toBe('pets');
      expect(categoryInfo.color).toBe('#ff6b6b');
      expect(categoryInfo.defaultExpenseType).toBe('WANT');
      expect(categoryInfo.isCustom).toBe(true);
    });

    it('should fall back to OTHER category for unknown category', () => {
      const categoryInfo = getCategoryInfo('UNKNOWN_CATEGORY');
      expect(categoryInfo.id).toBe('OTHER');
      expect(categoryInfo.name).toBe('Other');
    });

    it('should fall back to OTHER category for unknown custom category ID when custom categories provided', () => {
      const categoryInfo = getCategoryInfo('non-existent-id', mockCustomCategories);
      expect(categoryInfo.id).toBe('OTHER');
    });

    it('should prefer built-in category over custom with same ID', () => {
      const customWithBuiltInId: CustomCategory[] = [
        {
          id: 'HOUSING', // Same as built-in
          name: 'Custom Housing',
          icon: 'apartment',
          color: '#000000',
          defaultExpenseType: 'WANT',
        },
      ];
      const categoryInfo = getCategoryInfo('HOUSING', customWithBuiltInId);
      expect(categoryInfo.name).toBe('Housing'); // Built-in wins
      expect(categoryInfo.isCustom).toBeUndefined();
    });
  });

  describe('getAllCategories', () => {
    it('should return all built-in categories when no custom categories', () => {
      const allCategories = getAllCategories();
      expect(allCategories).toHaveLength(EXPENSE_CATEGORIES.length);
    });

    it('should return built-in and custom categories combined', () => {
      const allCategories = getAllCategories(mockCustomCategories);
      expect(allCategories).toHaveLength(EXPENSE_CATEGORIES.length + mockCustomCategories.length);
    });

    it('should mark built-in categories as not custom', () => {
      const allCategories = getAllCategories(mockCustomCategories);
      const builtIn = allCategories.find(c => c.id === 'HOUSING');
      expect(builtIn?.isCustom).toBe(false);
    });

    it('should mark custom categories as custom', () => {
      const allCategories = getAllCategories(mockCustomCategories);
      const custom = allCategories.find(c => c.id === 'cat-custom-1');
      expect(custom?.isCustom).toBe(true);
    });

    it('should include color property from custom categories', () => {
      const allCategories = getAllCategories(mockCustomCategories);
      const custom = allCategories.find(c => c.id === 'cat-custom-1');
      expect(custom?.color).toBe('#ff6b6b');
    });
  });

  describe('getUsedIcons', () => {
    it('should return all built-in icons when no custom categories', () => {
      const usedIcons = getUsedIcons();
      expect(usedIcons.length).toBe(EXPENSE_CATEGORIES.length);
      expect(usedIcons).toContain('home'); // Housing icon
      expect(usedIcons).toContain('restaurant'); // Dining Out icon
    });

    it('should include custom category icons', () => {
      const usedIcons = getUsedIcons(mockCustomCategories);
      expect(usedIcons).toContain('pets');
      expect(usedIcons).toContain('fitness_center');
    });

    it('should combine built-in and custom icons', () => {
      const usedIcons = getUsedIcons(mockCustomCategories);
      expect(usedIcons.length).toBe(EXPENSE_CATEGORIES.length + mockCustomCategories.length);
    });
  });

  describe('getAvailableIcons', () => {
    it('should return icons not in use', () => {
      const availableIcons = getAvailableIcons();
      // Should not contain any icons used by built-in categories
      const builtInIcons = EXPENSE_CATEGORIES.map(c => c.icon);
      for (const icon of availableIcons) {
        expect(builtInIcons).not.toContain(icon);
      }
    });

    it('should exclude custom category icons', () => {
      const availableIcons = getAvailableIcons(mockCustomCategories);
      expect(availableIcons).not.toContain('pets');
      expect(availableIcons).not.toContain('fitness_center');
    });

    it('should return fewer icons when custom categories added', () => {
      const availableWithoutCustom = getAvailableIcons();
      const availableWithCustom = getAvailableIcons(mockCustomCategories);
      expect(availableWithCustom.length).toBeLessThan(availableWithoutCustom.length);
    });
  });

  describe('generateCategoryId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateCategoryId();
      const id2 = generateCategoryId();
      expect(id1).not.toBe(id2);
    });

    it('should start with "cat-"', () => {
      const id = generateCategoryId();
      expect(id.startsWith('cat-')).toBe(true);
    });
  });

  describe('CATEGORY_COLORS', () => {
    it('should have at least 10 predefined colors', () => {
      expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have valid hex color codes', () => {
      for (const color of CATEGORY_COLORS) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('AVAILABLE_ICONS', () => {
    it('should have icons available for custom categories', () => {
      expect(AVAILABLE_ICONS.length).toBeGreaterThan(0);
    });

    it('should contain common icon names', () => {
      expect(AVAILABLE_ICONS).toContain('pets');
      expect(AVAILABLE_ICONS).toContain('fitness_center');
      expect(AVAILABLE_ICONS).toContain('coffee');
    });
  });
});
