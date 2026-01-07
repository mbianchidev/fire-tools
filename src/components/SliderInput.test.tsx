import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { SliderInput } from './SliderInput';

describe('SliderInput', () => {
  describe('max/min bounds validation', () => {
    it('should clamp text input value to max when value exceeds max', () => {
      const onChange = vi.fn();
      render(
        <SliderInput
          value={5}
          onChange={onChange}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      const textInput = screen.getByRole('textbox', { name: /value input for test-slider/i });
      
      // Type a value exceeding max
      fireEvent.change(textInput, { target: { value: '25' } });
      
      // Should clamp to max (20)
      expect(onChange).toHaveBeenCalledWith(20);
    });

    it('should clamp text input value to min when value is below min', () => {
      const onChange = vi.fn();
      render(
        <SliderInput
          value={5}
          onChange={onChange}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      const textInput = screen.getByRole('textbox', { name: /value input for test-slider/i });
      
      // Type a value below min
      fireEvent.change(textInput, { target: { value: '-15' } });
      
      // Should clamp to min (-10)
      expect(onChange).toHaveBeenCalledWith(-10);
    });

    it('should clamp value on blur when text input exceeds max', () => {
      const onChange = vi.fn();
      render(
        <SliderInput
          value={5}
          onChange={onChange}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      const textInput = screen.getByRole('textbox', { name: /value input for test-slider/i });
      
      // Focus, type exceeding value, then blur
      fireEvent.focus(textInput);
      fireEvent.change(textInput, { target: { value: '100' } });
      fireEvent.blur(textInput);
      
      // Should have clamped to max (20)
      expect(onChange).toHaveBeenLastCalledWith(20);
    });

    it('should accept values within the valid range', () => {
      const onChange = vi.fn();
      render(
        <SliderInput
          value={5}
          onChange={onChange}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      const textInput = screen.getByRole('textbox', { name: /value input for test-slider/i });
      
      // Type a valid value
      fireEvent.change(textInput, { target: { value: '15' } });
      
      // Should accept the value as-is
      expect(onChange).toHaveBeenCalledWith(15);
    });

    it('slider input should have correct min and max attributes', () => {
      render(
        <SliderInput
          value={5}
          onChange={() => {}}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      // Slider doesn't have a name by default, get by role only
      const slider = screen.getByRole('slider');
      
      expect(slider.getAttribute('min')).toBe('-10');
      expect(slider.getAttribute('max')).toBe('20');
    });

    it('should handle edge case at exact max value', () => {
      const onChange = vi.fn();
      render(
        <SliderInput
          value={5}
          onChange={onChange}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      const textInput = screen.getByRole('textbox', { name: /value input for test-slider/i });
      
      // Type exact max value
      fireEvent.change(textInput, { target: { value: '20' } });
      
      // Should accept the value
      expect(onChange).toHaveBeenCalledWith(20);
    });

    it('should handle edge case at exact min value', () => {
      const onChange = vi.fn();
      render(
        <SliderInput
          value={5}
          onChange={onChange}
          min={-10}
          max={20}
          id="test-slider"
        />
      );

      const textInput = screen.getByRole('textbox', { name: /value input for test-slider/i });
      
      // Type exact min value
      fireEvent.change(textInput, { target: { value: '-10' } });
      
      // Should accept the value
      expect(onChange).toHaveBeenCalledWith(-10);
    });
  });
});
