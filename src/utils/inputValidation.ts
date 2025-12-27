/**
 * Input Validation Utilities
 * Provides validation for text inputs that should contain numeric values
 */

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

  // Check if value is a valid number
  const parsed = allowDecimals ? parseFloat(value) : parseInt(value, 10);
  
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
