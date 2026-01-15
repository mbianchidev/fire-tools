import { Tooltip } from './Tooltip';
import { formatCurrency, formatAbbreviatedCurrency } from '../utils/allocationCalculator';

interface AbbreviatedValueProps {
  value: number;
  currency?: string;
  className?: string;
}

/**
 * Displays an abbreviated currency value (e.g., €2.1M) with a tooltip
 * showing the full value (e.g., €2,100,000) on hover.
 */
export const AbbreviatedValue: React.FC<AbbreviatedValueProps> = ({ 
  value, 
  currency = '€',
  className = ''
}) => {
  const abbreviatedValue = formatAbbreviatedCurrency(value, currency);
  const fullValue = formatCurrency(value, currency);
  
  // Only show tooltip if the value is actually abbreviated (1K or more)
  const isAbbreviated = Math.abs(value) >= 1000;
  
  if (!isAbbreviated) {
    return <span className={className}>{abbreviatedValue}</span>;
  }
  
  return (
    <Tooltip content={fullValue} position="bottom">
      <span className={`abbreviated-value ${className}`} style={{ cursor: 'help' }}>
        {abbreviatedValue}
      </span>
    </Tooltip>
  );
};
