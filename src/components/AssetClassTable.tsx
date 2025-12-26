import { AssetClassSummary } from '../types/assetAllocation';
import { formatCurrency, formatPercent } from '../utils/allocationCalculator';

interface AssetClassTableProps {
  assetClasses: AssetClassSummary[];
  totalValue: number;
  currency: string;
}

export const AssetClassTable: React.FC<AssetClassTableProps> = ({
  assetClasses,
  totalValue,
  currency,
}) => {
  const getActionColor = (action: string): string => {
    switch (action) {
      case 'BUY':
      case 'SAVE':
        return 'var(--color-action-buy)';
      case 'SELL':
      case 'INVEST':
        return 'var(--color-action-sell)';
      case 'HOLD':
        return 'var(--color-action-hold)';
      case 'EXCLUDED':
        return 'var(--color-action-excluded)';
      default:
        return '#666';
    }
  };

  return (
    <div className="asset-class-table-container">
      <table className="asset-class-table">
        <thead>
          <tr>
            <th>Asset Class</th>
            <th>Target Mode</th>
            <th>% Target</th>
            <th>% Current</th>
            <th>Absolute Current</th>
            <th>Absolute Target</th>
            <th>Delta</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {assetClasses.map(ac => (
            <tr key={ac.assetClass} className={ac.targetMode === 'OFF' ? 'excluded-row' : ''}>
              <td>
                <span className={`asset-class-badge ${ac.assetClass.toLowerCase()}`}>
                  {ac.assetClass}
                </span>
              </td>
              <td>
                {ac.targetMode === 'SET' ? (
                  <span className="set-label">SET</span>
                ) : ac.targetMode === 'OFF' ? (
                  <span className="off-label">OFF</span>
                ) : (
                  <span>%</span>
                )}
              </td>
              <td>
                {ac.targetMode === 'PERCENTAGE' && ac.targetPercent !== undefined
                  ? formatPercent(ac.targetPercent)
                  : ac.targetMode === 'SET'
                  ? 'SET'
                  : 'OFF'}
              </td>
              <td>{formatPercent(ac.currentPercent)}</td>
              <td className="currency-value">{formatCurrency(ac.currentTotal, currency)}</td>
              <td className="currency-value">
                {ac.targetTotal !== undefined ? formatCurrency(ac.targetTotal, currency) : '-'}
              </td>
              <td className={`currency-value ${ac.delta > 0 ? 'positive' : ac.delta < 0 ? 'negative' : ''}`}>
                {ac.delta > 0 ? '+' : ''}{formatCurrency(ac.delta, currency)}
              </td>
              <td>
                <span 
                  className="action-badge"
                  style={{ backgroundColor: getActionColor(ac.action) }}
                >
                  {ac.action}
                </span>
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td><strong>Total Portfolio</strong></td>
            <td colSpan={2}></td>
            <td><strong>100%</strong></td>
            <td className="currency-value"><strong>{formatCurrency(totalValue, currency)}</strong></td>
            <td colSpan={3}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
