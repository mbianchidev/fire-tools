import { useState, useEffect } from 'react';

/**
 * Hook to manage text input for numeric values
 * Preserves string representation while typing (e.g., "60." stays as "60.")
 * Parses to number on blur
 */
export function useNumberInput(
  value: number,
  onChange: (value: number) => void,
  options: {
    allowDecimals?: boolean;
  } = {}
) {
  const { allowDecimals = true } = options;
  const [stringValue, setStringValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Update string value when external value changes (but not when focused/typing)
  useEffect(() => {
    if (!isFocused) {
      setStringValue(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (newValue: string) => {
    setStringValue(newValue);
    
    // Parse and call onChange immediately if we have a valid number
    // This allows real-time updates while preserving the string representation
    const parsed = allowDecimals ? parseFloat(newValue) : parseInt(newValue, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (newValue === '' || newValue === '-' || newValue === '.') {
      // Allow empty, minus sign, or decimal point as intermediate states
      onChange(0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Clean up the string value on blur
    const parsed = allowDecimals ? parseFloat(stringValue) : parseInt(stringValue, 10);
    if (!isNaN(parsed)) {
      setStringValue(parsed.toString());
      onChange(parsed);
    } else {
      // Reset to the current value if invalid
      setStringValue(value.toString());
      onChange(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return {
    value: stringValue,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
  };
}
