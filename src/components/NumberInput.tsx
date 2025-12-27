import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  allowDecimals?: boolean;
}

/**
 * Number input component that preserves decimal points while typing
 * The key is to maintain a local string state that updates on blur
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  className,
  placeholder,
  readOnly = false,
  allowDecimals = true,
}) => {
  const [stringValue, setStringValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Update string value when prop value changes (but not while focused)
  useEffect(() => {
    if (!isFocused) {
      setStringValue(value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setStringValue(newValue);
    
    // Parse and update parent immediately if we have a valid number
    const parsed = allowDecimals ? parseFloat(newValue) : parseInt(newValue, 10);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (newValue === '' || newValue === '-' || newValue === '.') {
      // Allow these intermediate states, but update parent to 0
      onChange(0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Clean up the value on blur
    const parsed = allowDecimals ? parseFloat(stringValue) : parseInt(stringValue, 10);
    if (!isNaN(parsed)) {
      setStringValue(parsed.toString());
      onChange(parsed);
    } else {
      // Reset to parent value if invalid
      setStringValue(value.toString());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <input
      type="text"
      value={stringValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      placeholder={placeholder}
      readOnly={readOnly}
    />
  );
};
