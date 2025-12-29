/**
 * Input Validation Utilities
 * Provides validation for text inputs that should contain numeric values
 */

export type DecimalSeparator = '.' | ',';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  parsedValue?: number;
}

export interface ValidationOptions {
  min?: number;
  max?: number;
  allowNegative?: boolean;
  allowDecimals?: boolean;
  required?: boolean;
  decimalSeparator?: DecimalSeparator;
}

/**
 * Format a number with the specified decimal separator
 * @param value - The numeric value to format
 * @param decimalSeparator - The decimal separator to use ('.' or ',')
 * @returns The formatted string
 */
export function formatWithSeparator(value: number, decimalSeparator: DecimalSeparator = '.'): string {
  const str = value.toString();
  if (decimalSeparator === ',') {
    // Replace all periods with commas for decimal separator
    return str.split('.').join(',');
  }
  return str;
}

/**
 * Parse a string to a number, handling the specified decimal separator
 * @param value - The string value to parse
 * @param decimalSeparator - The decimal separator used in the string ('.' or ',')
 * @returns The parsed number (may be NaN if invalid)
 */
export function parseWithSeparator(value: string, decimalSeparator: DecimalSeparator = '.'): number {
  if (decimalSeparator === ',') {
    // First remove thousands separators (periods in European format), then replace comma with period
    const normalized = value.split('.').join('').replace(',', '.');
    return parseFloat(normalized);
  }
  // For period decimal separator, remove thousands separators (commas)
  const normalized = value.split(',').join('');
  return parseFloat(normalized);
}

/**
 * Validates a text input that should contain a number
 * Returns validation result with parsed value if valid
 */
export function validateNumberInput(
  value: string,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    min,
    max,
    allowNegative = true,
    allowDecimals = true,
    required = false,
    decimalSeparator = '.',
  } = options;

  // Empty value handling
  if (value === '' || value.trim() === '') {
    if (required) {
      return {
        isValid: false,
        errorMessage: 'This field is required',
      };
    }
    return {
      isValid: true,
      parsedValue: 0,
    };
  }

  // Check if value is a valid number using the appropriate parsing function
  let parsed: number;
  if (decimalSeparator !== '.') {
    // Use parseWithSeparator for non-default decimal separators
    parsed = parseWithSeparator(value, decimalSeparator);
    if (!allowDecimals) {
      parsed = Math.trunc(parsed);
    }
  } else {
    parsed = allowDecimals ? parseFloat(value) : parseInt(value, 10);
  }
  
  if (isNaN(parsed)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid number',
    };
  }

  // Check for negative values
  if (!allowNegative && parsed < 0) {
    return {
      isValid: false,
      errorMessage: 'Value cannot be negative',
    };
  }

  // Check min constraint
  if (min !== undefined && parsed < min) {
    return {
      isValid: false,
      errorMessage: `Value must be at least ${min}`,
    };
  }

  // Check max constraint
  if (max !== undefined && parsed > max) {
    return {
      isValid: false,
      errorMessage: `Value must be at most ${max}`,
    };
  }

  return {
    isValid: true,
    parsedValue: parsed,
  };
}

/**
 * Parses a string to a number safely
 * Returns 0 for empty/invalid values
 */
export function safeParseNumber(value: string, allowDecimals = true): number {
  if (value === '' || value === '-' || value === '.') {
    return 0;
  }
  const parsed = allowDecimals ? parseFloat(value) : parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}
