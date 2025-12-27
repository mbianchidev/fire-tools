import { useState, useEffect, useRef } from 'react';
import { validateNumberInput, ValidationOptions } from '../utils/inputValidation';

interface ValidatedNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  validation?: ValidationOptions;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  step?: string;
}

export const ValidatedNumberInput: React.FC<ValidatedNumberInputProps> = ({
  value,
  onChange,
  validation,
  className = '',
  placeholder,
  readOnly = false,
  step,
}) => {
  const [textValue, setTextValue] = useState(value.toString());
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update text value when prop value changes (external update)
  useEffect(() => {
    if (!touched) {
      setTextValue(value.toString());
    }
  }, [value, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    setTouched(true);
    
    // Clear error while typing (immediate feedback for fixing issues)
    if (error) {
      setError(undefined);
    }

    // Parse and update parent if valid or empty
    const result = validateNumberInput(newValue, validation);
    if (result.isValid && result.parsedValue !== undefined) {
      onChange(result.parsedValue);
    }
  };

  const handleBlur = () => {
    // Validate on blur
    const result = validateNumberInput(textValue, validation);
    
    if (!result.isValid) {
      setError(result.errorMessage);
    } else {
      setError(undefined);
      // Update to parsed value on blur (clean up formatting)
      if (result.parsedValue !== undefined) {
        setTextValue(result.parsedValue.toString());
        onChange(result.parsedValue);
      }
    }
  };

  const handleFocus = () => {
    setTouched(true);
  };

  const inputClassName = `${className} ${error ? 'input-error' : ''}`.trim();

  return (
    <div className="validated-input-wrapper">
      <input
        ref={inputRef}
        type="text"
        value={textValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={inputClassName}
        placeholder={placeholder}
        readOnly={readOnly}
        step={step}
      />
      {error && (
        <div className="input-error-tooltip" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
