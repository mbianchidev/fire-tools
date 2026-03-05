import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { SearchableSelect, SelectOption } from '../../src/components/SearchableSelect';

const fewOptions: SelectOption[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Charlie' },
];

// 7 options — below default threshold of 8
const belowThresholdOptions: SelectOption[] = [
  { id: '1', label: 'Housing' },
  { id: '2', label: 'Utilities' },
  { id: '3', label: 'Groceries' },
  { id: '4', label: 'Transport' },
  { id: '5', label: 'Healthcare' },
  { id: '6', label: 'Entertainment' },
  { id: '7', label: 'Education' },
];

// 8 options — meets default threshold of 8
const manyOptions: SelectOption[] = [
  { id: '1', label: 'Housing' },
  { id: '2', label: 'Utilities' },
  { id: '3', label: 'Groceries' },
  { id: '4', label: 'Transport' },
  { id: '5', label: 'Healthcare' },
  { id: '6', label: 'Entertainment' },
  { id: '7', label: 'Education' },
  { id: '8', label: 'Insurance' },
];

describe('SearchableSelect', () => {
  describe('basic rendering', () => {
    it('should render the trigger button with selected value', () => {
      render(
        <SearchableSelect options={fewOptions} value="b" onChange={() => {}} />
      );
      expect(screen.getByRole('button').textContent).toContain('Beta');
    });

    it('should show placeholder when no value matches', () => {
      render(
        <SearchableSelect options={fewOptions} value="" onChange={() => {}} placeholder="Pick one" />
      );
      expect(screen.getByRole('button').textContent).toContain('Pick one');
    });

    it('should render custom renderValue', () => {
      render(
        <SearchableSelect
          options={fewOptions}
          value="a"
          onChange={() => {}}
          renderValue={(opt) => <span data-testid="custom-value">{opt?.label} (custom)</span>}
        />
      );
      expect(screen.getByTestId('custom-value').textContent).toBe('Alpha (custom)');
    });
  });

  describe('dropdown open/close', () => {
    it('should open dropdown on trigger click', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeTruthy();
    });

    it('should close dropdown after selecting an option', () => {
      const onChange = vi.fn();
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Charlie'));
      expect(onChange).toHaveBeenCalledWith('c');
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('should not open when disabled', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} disabled />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  describe('search behavior', () => {
    it('should NOT show search input for fewer than 8 options (default threshold)', () => {
      render(
        <SearchableSelect options={belowThresholdOptions} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByPlaceholderText('Search...')).toBeNull();
    });

    it('should show search input for 8+ options (default threshold=8)', () => {
      render(
        <SearchableSelect options={manyOptions} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should filter options when typing in search', () => {
      render(
        <SearchableSelect options={manyOptions} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'ent' } });
      // Should match "Entertainment" only in the options list
      const listbox = screen.getByRole('listbox');
      const options = listbox.querySelectorAll('[role="option"]');
      expect(options.length).toBe(1);
      expect(options[0].textContent).toBe('Entertainment');
    });

    it('should show "No results found" when search matches nothing', () => {
      render(
        <SearchableSelect options={manyOptions} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'xyz' } });
      expect(screen.getByText('No results found')).toBeTruthy();
    });

    it('should be case-insensitive when searching', () => {
      render(
        <SearchableSelect options={manyOptions} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'HEALTH' } });
      expect(screen.getByText('Healthcare')).toBeTruthy();
    });

    it('should respect custom searchThreshold', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} searchThreshold={3} />
      );
      fireEvent.click(screen.getByRole('button'));
      // 3 options >= threshold of 3 → search should appear
      expect(screen.getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should NOT show search when options count is below custom threshold', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} searchThreshold={4} />
      );
      fireEvent.click(screen.getByRole('button'));
      // 3 options < threshold of 4 → search should NOT appear
      expect(screen.queryByPlaceholderText('Search...')).toBeNull();
    });
  });

  describe('selection', () => {
    it('should call onChange with selected option id', () => {
      const onChange = vi.fn();
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button'));
      fireEvent.click(screen.getByText('Beta'));
      expect(onChange).toHaveBeenCalledWith('b');
    });

    it('should mark selected option with aria-selected', () => {
      render(
        <SearchableSelect options={fewOptions} value="b" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      const options = screen.getAllByRole('option');
      const betaOption = options.find(o => o.textContent === 'Beta');
      expect(betaOption?.getAttribute('aria-selected')).toBe('true');
    });

    it('should select from filtered results in searchable mode', () => {
      const onChange = vi.fn();
      render(
        <SearchableSelect options={manyOptions} value="1" onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button'));
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Edu' } });
      fireEvent.click(screen.getByText('Education'));
      expect(onChange).toHaveBeenCalledWith('7');
    });
  });

  describe('custom rendering', () => {
    it('should render custom option content via renderOption', () => {
      render(
        <SearchableSelect
          options={fewOptions}
          value="a"
          onChange={() => {}}
          renderOption={(opt) => <span data-testid={`opt-${opt.id}`}>{opt.label}!</span>}
        />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByTestId('opt-a').textContent).toBe('Alpha!');
      expect(screen.getByTestId('opt-b').textContent).toBe('Beta!');
    });

    it('should apply custom-option class for custom options', () => {
      const optionsWithCustom: SelectOption[] = [
        { id: '1', label: 'Regular' },
        { id: '2', label: 'Custom One', isCustom: true, color: '#ff0000' },
      ];
      render(
        <SearchableSelect options={optionsWithCustom} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      const options = screen.getAllByRole('option');
      expect(options[1].classList.contains('custom-option')).toBe(true);
    });
  });

  describe('keyboard interaction', () => {
    it('should close dropdown on Escape key', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('listbox')).toBeTruthy();
      fireEvent.keyDown(screen.getByRole('button').parentElement!, { key: 'Escape' });
      expect(screen.queryByRole('listbox')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have aria-haspopup on trigger', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} />
      );
      expect(screen.getByRole('button').getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('should have aria-expanded reflecting open state', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} />
      );
      const trigger = screen.getByRole('button');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      fireEvent.click(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    it('should set aria-label on trigger when provided', () => {
      render(
        <SearchableSelect options={fewOptions} value="a" onChange={() => {}} ariaLabel="Choose item" />
      );
      expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Choose item');
    });

    it('should set aria-label on search input', () => {
      render(
        <SearchableSelect options={manyOptions} value="1" onChange={() => {}} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByPlaceholderText('Search...').getAttribute('aria-label')).toBe('Search options');
    });
  });
});
