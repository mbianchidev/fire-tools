import { describe, expect, it } from 'vitest';
import { formatDate } from '../../src/utils/dateFormatter';

describe('dateFormatter', () => {
  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T12:00:00Z');

    it('should format date as DD/MM/YYYY', () => {
      const result = formatDate(testDate, 'DD/MM/YYYY');
      expect(result).toBe('15/03/2024');
    });

    it('should format date as MM/DD/YYYY', () => {
      const result = formatDate(testDate, 'MM/DD/YYYY');
      expect(result).toBe('03/15/2024');
    });

    it('should format date as YYYY-MM-DD', () => {
      const result = formatDate(testDate, 'YYYY-MM-DD');
      expect(result).toBe('2024-03-15');
    });

    it('should default to DD/MM/YYYY when format is not provided', () => {
      const result = formatDate(testDate);
      expect(result).toBe('15/03/2024');
    });

    it('should handle string date input', () => {
      const result = formatDate('2024-03-15', 'DD/MM/YYYY');
      expect(result).toBe('15/03/2024');
    });

    it('should handle single-digit days and months correctly', () => {
      const singleDigitDate = new Date('2024-01-05T12:00:00Z');
      
      expect(formatDate(singleDigitDate, 'DD/MM/YYYY')).toBe('05/01/2024');
      expect(formatDate(singleDigitDate, 'MM/DD/YYYY')).toBe('01/05/2024');
      expect(formatDate(singleDigitDate, 'YYYY-MM-DD')).toBe('2024-01-05');
    });

    it('should handle December dates correctly', () => {
      const decemberDate = new Date('2024-12-25T12:00:00Z');
      
      expect(formatDate(decemberDate, 'DD/MM/YYYY')).toBe('25/12/2024');
      expect(formatDate(decemberDate, 'MM/DD/YYYY')).toBe('12/25/2024');
    });
  });
});
