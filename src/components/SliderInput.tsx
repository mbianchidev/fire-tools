import React, { useState, useEffect } from 'react';

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  id?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  disabled?: boolean;
}

/**
 * Slider input component with synchronized text input
 * Provides both a range slider and a number input for precise control
 */
export const SliderInput: React.FC<SliderInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 0.5,
  id,
  showValue = true,
  formatValue = (v) => `${v}%`,
  className = '',
  disabled = false,
}) => {
  const [textValue, setTextValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  // Update text value when prop value changes (but not while focused)
  useEffect(() => {
    if (!isFocused) {
      setTextValue(value.toString());
    }
  }, [value, isFocused]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
    setTextValue(newValue.toString());
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTextValue = e.target.value;
    setTextValue(newTextValue);
    
    // Parse and update parent immediately if we have a valid number
    const parsed = parseFloat(newTextValue);
    if (!isNaN(parsed)) {
      // Clamp value within bounds
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  };

  const handleTextBlur = () => {
    setIsFocused(false);
    
    // Clean up the value on blur
    const parsed = parseFloat(textValue);
    if (!isNaN(parsed)) {
      // Clamp value within bounds
      const clamped = Math.min(max, Math.max(min, parsed));
      setTextValue(clamped.toString());
      onChange(clamped);
    } else {
      // Reset to parent value if invalid
      setTextValue(value.toString());
    }
  };

  const handleTextFocus = () => {
    setIsFocused(true);
  };

  // Calculate the fill percentage for the track
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className={`slider-input-container ${className}`}>
      <div className="slider-wrapper">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="slider-input"
          disabled={disabled}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          style={{
            '--fill-percent': `${fillPercent}%`,
          } as React.CSSProperties}
        />
        {showValue && (
          <div className="slider-value-container">
            <input
              type="text"
              inputMode="decimal"
              value={textValue}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              onFocus={handleTextFocus}
              className="slider-text-input"
              disabled={disabled}
              aria-label={`Value input for ${id || 'slider'}`}
            />
            <span className="slider-value-unit">%</span>
          </div>
        )}
      </div>
      <div className="slider-bounds">
        <span className="slider-min">{formatValue(min)}</span>
        <span className="slider-max">{formatValue(max)}</span>
      </div>
    </div>
  );
};
