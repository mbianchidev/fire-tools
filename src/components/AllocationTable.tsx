import { Asset, AllocationDelta, AllocationMode } from '../types/assetAllocation';
import { formatCurrency, formatPercent } from '../utils/allocationCalculator';
import { useTableSort } from '../utils/useTableSort';

interface AllocationTableProps {
  assets: Asset[];
  deltas: AllocationDelta[];
  currency: string;
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => void;
}

interface TableRow {
  asset: Asset;
  delta: AllocationDelta;
}

export const AllocationTable: React.FC<AllocationTableProps> = ({
  assets,
  deltas,
  currency,
  onUpdateAsset,
}) => {
  // Create combined data for sorting
  const tableData: TableRow[] = assets.map(asset => ({
    asset,
    delta: deltas.find(d => d.assetId === asset.id)!,
  })).filter(row => row.delta);

  const { sortedData, requestSort, getSortIndicator } = useTableSort<TableRow>(tableData);

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

  const handleTargetModeChange = (assetId: string, mode: string) => {
    const targetMode = mode as AllocationMode;
    const updates: Partial<Asset> = { targetMode };
    
    if (targetMode === 'OFF') {
      updates.targetPercent = undefined;
      updates.targetValue = undefined;
    }
    
    onUpdateAsset(assetId, updates);
  };

  const handleTargetPercentChange = (assetId: string, value: string) => {
    const percent = parseFloat(value) || 0;
    onUpdateAsset(assetId, { targetPercent: percent });
  };

  const handleTargetValueChange = (assetId: string, value: string) => {
    const val = parseFloat(value) || 0;
    onUpdateAsset(assetId, { targetValue: val });
  };

  return (
    <div className="allocation-table-container">
      <table className="allocation-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => requestSort('asset')}>
              Asset / Index <span className="sort-indicator">{getSortIndicator('asset')}</span>
            </th>
            <th>Ticker</th>
            <th className="sortable" onClick={() => requestSort('asset')}>
              Asset Class <span className="sort-indicator">{getSortIndicator('asset')}</span>
            </th>
            <th>Target Mode</th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              % Target <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              % Current (Total) <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              % Current (Class) <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              Absolute Current <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              Absolute Target <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              Delta <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
            <th className="sortable" onClick={() => requestSort('delta')}>
              Action <span className="sort-indicator">{getSortIndicator('delta')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(({ asset, delta }) => {
            return (
              <tr key={asset.id} className={asset.targetMode === 'OFF' ? 'excluded-row' : ''}>
                <td className="asset-name">{asset.name}</td>
                <td>{asset.ticker}</td>
                <td>
                  <span className={`asset-class-badge ${asset.assetClass.toLowerCase()}`}>
                    {asset.assetClass}
                  </span>
                </td>
                <td>
                  <select
                    value={asset.targetMode}
                    onChange={(e) => handleTargetModeChange(asset.id, e.target.value)}
                    className="target-mode-select"
                  >
                    <option value="PERCENTAGE">%</option>
                    <option value="SET">SET</option>
                    <option value="OFF">OFF</option>
                  </select>
                </td>
                <td>
                  {asset.targetMode === 'PERCENTAGE' ? (
                    <input
                      type="number"
                      value={asset.targetPercent || 0}
                      onChange={(e) => handleTargetPercentChange(asset.id, e.target.value)}
                      className="target-input"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  ) : asset.targetMode === 'SET' ? (
                    <span className="set-label">SET</span>
                  ) : (
                    <span className="off-label">OFF</span>
                  )}
                </td>
                <td>{formatPercent(delta.currentPercent)}</td>
                <td>{formatPercent(delta.currentPercentInClass)}</td>
                <td className="currency-value">{formatCurrency(delta.currentValue, currency)}</td>
                <td className="currency-value">
                  {asset.targetMode === 'SET' ? (
                    <input
                      type="number"
                      value={asset.targetValue || 0}
                      onChange={(e) => handleTargetValueChange(asset.id, e.target.value)}
                      className="target-input"
                      step="100"
                      min="0"
                    />
                  ) : (
                    formatCurrency(delta.targetValue, currency)
                  )}
                </td>
                <td className={`currency-value ${delta.delta > 0 ? 'positive' : delta.delta < 0 ? 'negative' : ''}`}>
                  {delta.delta > 0 ? '+' : ''}{formatCurrency(delta.delta, currency)}
                </td>
                <td>
                  <span 
                    className="action-badge"
                    style={{ backgroundColor: getActionColor(delta.action) }}
                  >
                    {delta.action}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
