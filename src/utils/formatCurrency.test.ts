import { describe, expect, it } from 'vitest';
import { formatCurrency } from './allocationCalculator';

describe('formatCurrency', () => {
  it('uses euro symbol by default', () => {
    expect(formatCurrency(1234)).toBe('€1,234');
  });

  it('uses euro symbol when currency is explicitly EUR', () => {
    expect(formatCurrency(987.65, 'EUR').startsWith('€')).toBe(true);
  });
});
