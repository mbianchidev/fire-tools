import { describe, expect, it } from 'vitest';
import { validateNumberInput, safeParseNumber } from './inputValidation';

describe('validateNumberInput', () => {
  describe('valid inputs', () => {
    it('accepts valid integer', () => {
      const result = validateNumberInput('42');
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(42);
      expect(result.errorMessage).toBeUndefined();
    });

    it('accepts valid decimal', () => {
      const result = validateNumberInput('42.5');
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(42.5);
    });

    it('accepts negative numbers when allowed', () => {
      const result = validateNumberInput('-10', { allowNegative: true });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(-10);
    });

    it('accepts empty string when not required', () => {
      const result = validateNumberInput('', { required: false });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(0);
    });

    it('accepts numbers within min/max range', () => {
      const result = validateNumberInput('50', { min: 0, max: 100 });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(50);
    });
  });

  describe('invalid inputs', () => {
    it('rejects non-numeric text', () => {
      const result = validateNumberInput('ciao');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a valid number');
    });

    it('rejects empty string when required', () => {
      const result = validateNumberInput('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('This field is required');
    });

    it('rejects negative numbers when not allowed', () => {
      const result = validateNumberInput('-10', { allowNegative: false });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value cannot be negative');
    });

    it('rejects values below minimum', () => {
      const result = validateNumberInput('5', { min: 10 });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be at least 10');
    });

    it('rejects values above maximum', () => {
      const result = validateNumberInput('150', { max: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Value must be at most 100');
    });
  });

  describe('boundary cases', () => {
    it('handles whitespace-only input', () => {
      const result = validateNumberInput('   ', { required: false });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(0);
    });

    it('handles special characters', () => {
      const result = validateNumberInput('$100');
      expect(result.isValid).toBe(false);
    });

    it('handles multiple decimal points (parseFloat behavior)', () => {
      // parseFloat('1.2.3') returns 1.2, which is valid behavior
      const result = validateNumberInput('1.2.3');
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(1.2);
    });

    it('handles scientific notation', () => {
      const result = validateNumberInput('1e5');
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(100000);
    });

    it('accepts zero', () => {
      const result = validateNumberInput('0');
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(0);
    });

    it('handles exact min value', () => {
      const result = validateNumberInput('10', { min: 10 });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(10);
    });

    it('handles exact max value', () => {
      const result = validateNumberInput('100', { max: 100 });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(100);
    });
  });

  describe('decimal options', () => {
    it('parses decimals when allowed', () => {
      const result = validateNumberInput('42.5', { allowDecimals: true });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(42.5);
    });

    it('parses only integer part when decimals not allowed', () => {
      const result = validateNumberInput('42.5', { allowDecimals: false });
      expect(result.isValid).toBe(true);
      expect(result.parsedValue).toBe(42);
    });
  });
});

describe('safeParseNumber', () => {
  it('parses valid numbers', () => {
    expect(safeParseNumber('42')).toBe(42);
    expect(safeParseNumber('42.5')).toBe(42.5);
  });

  it('returns 0 for empty string', () => {
    expect(safeParseNumber('')).toBe(0);
  });

  it('returns 0 for invalid inputs', () => {
    expect(safeParseNumber('ciao')).toBe(0);
  });

  it('returns 0 for partial input', () => {
    expect(safeParseNumber('-')).toBe(0);
    expect(safeParseNumber('.')).toBe(0);
  });

  it('respects allowDecimals parameter', () => {
    expect(safeParseNumber('42.7', true)).toBe(42.7);
    expect(safeParseNumber('42.7', false)).toBe(42);
  });
});
