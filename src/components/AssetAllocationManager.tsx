import { useState } from 'react';
import { Asset, PortfolioAllocation } from '../types/assetAllocation';
import { calculatePortfolioAllocation, prepareAssetClassChartData, prepareAssetChartData, exportToCSV, importFromCSV } from '../utils/allocationCalculator';
import { DEFAULT_ASSETS } from '../utils/defaultAssets';
import { AllocationTable } from './AllocationTable';
import { AssetClassTable } from './AssetClassTable';
import { AllocationChart } from './AllocationChart';
import { MaterialIcon } from './MaterialIcon';

export const AssetAllocationManager: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [currency] = useState<string>('EUR');
  const [allocation, setAllocation] = useState<PortfolioAllocation>(() =>
    calculatePortfolioAllocation(DEFAULT_ASSETS)
  );
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const updateAllocation = (newAssets: Asset[]) => {
    setAssets(newAssets);
    const newAllocation = calculatePortfolioAllocation(newAssets);
    setAllocation(newAllocation);
  };

  const handleUpdateAsset = (assetId: string, updates: Partial<Asset>) => {
    const newAssets = assets.map(asset =>
      asset.id === assetId ? { ...asset, ...updates } : asset
    );
    updateAllocation(newAssets);
  };

  const handleAddAsset = () => {
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: 'New Asset',
      ticker: 'NEW',
      assetClass: 'STOCKS',
      subAssetType: 'ETF',
      currentValue: 0,
      targetMode: 'PERCENTAGE',
      targetPercent: 0,
    };
    updateAllocation([...assets, newAsset]);
  };

  const handleExport = () => {
    const csv = exportToCSV(allocation);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-allocation-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const importedAssets = importFromCSV(csv);
        updateAllocation(importedAssets);
      } catch (error) {
        alert(`Error importing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
  };

  const assetClassChartData = prepareAssetClassChartData(allocation.assetClasses);
  const selectedAssetClass = selectedClass 
    ? allocation.assetClasses.find(ac => ac.assetClass === selectedClass)
    : null;
  const assetChartData = selectedAssetClass
    ? prepareAssetChartData(selectedAssetClass.assets, selectedAssetClass.currentTotal)
    : [];

  return (
    <div className="asset-allocation-manager">
      <div className="manager-header">
        <h2><MaterialIcon name="pie_chart" /> Asset Allocation Manager</h2>
        <p className="section-description">
          Manage and visualize your portfolio asset allocation. Set target allocations,
          track current positions, and see recommended actions to rebalance your portfolio.
        </p>
      </div>

      {!allocation.isValid && (
        <div className="validation-errors">
          <strong><MaterialIcon name="warning" /> Validation Errors:</strong>
          <ul>
            {allocation.validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="manager-actions">
        <button onClick={handleAddAsset} className="action-btn add-btn">
          <MaterialIcon name="add" /> Add Asset
        </button>
        <button onClick={handleExport} className="action-btn export-btn">
          <MaterialIcon name="download" /> Export CSV
        </button>
        <label className="action-btn import-btn">
          <MaterialIcon name="upload" /> Import CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="allocation-section">
        <h3>Asset Class Summary</h3>
        <AssetClassTable
          assetClasses={allocation.assetClasses}
          totalValue={allocation.totalValue}
          currency={currency}
        />
      </div>

      <div className="charts-row">
        <AllocationChart
          data={assetClassChartData}
          title="Portfolio Allocation by Asset Class"
          currency={currency}
        />
        
        {selectedAssetClass && (
          <AllocationChart
            data={assetChartData}
            title={`${selectedAssetClass.assetClass} Breakdown`}
            currency={currency}
          />
        )}
      </div>

      <div className="class-selector">
        <label>View Asset Class Details:</label>
        <select 
          value={selectedClass || ''} 
          onChange={(e) => setSelectedClass(e.target.value || null)}
          className="class-select"
        >
          <option value="">Select Asset Class</option>
          {allocation.assetClasses.map(ac => (
            <option key={ac.assetClass} value={ac.assetClass}>
              {ac.assetClass}
            </option>
          ))}
        </select>
      </div>

      <div className="allocation-section">
        <h3>Detailed Asset Allocation</h3>
        <AllocationTable
          assets={assets}
          deltas={allocation.deltas}
          currency={currency}
          onUpdateAsset={handleUpdateAsset}
        />
      </div>

      <div className="allocation-info">
        <h4><MaterialIcon name="lightbulb" /> How to Use</h4>
        <ul>
          <li><strong>Target Mode:</strong> Choose "%" for percentage-based allocation, "SET" for fixed amounts (e.g., emergency cash), or "OFF" to exclude from calculations</li>
          <li><strong>Percentage targets</strong> for active assets should sum to 100%</li>
          <li><strong>Actions:</strong> 
            <span className="info-badge buy">BUY/SAVE</span> = Increase position | 
            <span className="info-badge sell">SELL/INVEST</span> = Decrease position | 
            <span className="info-badge hold">HOLD</span> = Within target range |
            <span className="info-badge excluded">EXCLUDED</span> = Not in allocation
          </li>
          <li><strong>Delta:</strong> Positive values indicate how much to buy, negative values indicate how much to sell</li>
          <li><strong>For Cash assets:</strong> Actions show "SAVE" (increase) or "INVEST" (move to other assets) instead of buy/sell</li>
        </ul>
      </div>
    </div>
  );
};
