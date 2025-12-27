import { useState } from 'react';
import { Asset, PortfolioAllocation, AssetClass, AllocationMode } from '../types/assetAllocation';
import { calculatePortfolioAllocation, prepareAssetClassChartData, prepareAssetChartData, exportToCSV, importFromCSV, formatAssetName, formatCurrency } from '../utils/allocationCalculator';
import { DEFAULT_ASSETS, DEFAULT_PORTFOLIO_VALUE } from '../utils/defaultAssets';
import { EditableAssetClassTable } from './EditableAssetClassTable';
import { AllocationChart } from './AllocationChart';
import { AddAssetDialog } from './AddAssetDialog';
import { CollapsibleAllocationTable } from './CollapsibleAllocationTable';
import { MassEditDialog } from './MassEditDialog';

export const AssetAllocationPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(DEFAULT_ASSETS);
  const [currency] = useState<string>('EUR');
  // Portfolio value - can be edited manually
  const [portfolioValue, setPortfolioValue] = useState<number>(DEFAULT_PORTFOLIO_VALUE);
  const [isEditingPortfolioValue, setIsEditingPortfolioValue] = useState(false);
  const [editPortfolioValue, setEditPortfolioValue] = useState<number>(DEFAULT_PORTFOLIO_VALUE);
  // Store asset class level targets independently for display in the Asset Classes table
  const [assetClassTargets, setAssetClassTargets] = useState<Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>>({
    STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 60 },
    BONDS: { targetMode: 'PERCENTAGE', targetPercent: 40 },
    CASH: { targetMode: 'SET' },
    CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
    REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
  });
  const [allocation, setAllocation] = useState<PortfolioAllocation>(() =>
    calculatePortfolioAllocation(DEFAULT_ASSETS, {
      STOCKS: { targetMode: 'PERCENTAGE', targetPercent: 60 },
      BONDS: { targetMode: 'PERCENTAGE', targetPercent: 40 },
      CASH: { targetMode: 'SET' },
      CRYPTO: { targetMode: 'PERCENTAGE', targetPercent: 0 },
      REAL_ESTATE: { targetMode: 'PERCENTAGE', targetPercent: 0 },
    }, DEFAULT_PORTFOLIO_VALUE)
  );
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  // Mass edit dialog state
  const [isMassEditOpen, setIsMassEditOpen] = useState(false);
  const [massEditMode, setMassEditMode] = useState<'assetClass' | 'asset'>('assetClass');
  const [massEditAssetClass, setMassEditAssetClass] = useState<AssetClass | null>(null);

  const updateAllocation = (newAssets: Asset[], newAssetClassTargets?: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>, newPortfolioValue?: number) => {
    setAssets(newAssets);
    const targets = newAssetClassTargets ?? assetClassTargets;
    const pValue = newPortfolioValue ?? portfolioValue;
    const newAllocation = calculatePortfolioAllocation(newAssets, targets, pValue);
    setAllocation(newAllocation);
  };

  const handleUpdateAsset = (assetId: string, updates: Partial<Asset>) => {
    const newAssets = assets.map(asset =>
      asset.id === assetId ? { ...asset, ...updates } : asset
    );
    updateAllocation(newAssets);
  };

  const handleDeleteAsset = (assetId: string) => {
    const deletedAsset = assets.find(asset => asset.id === assetId);
    if (!deletedAsset) {
      return;
    }
    
    // Get other percentage-based assets in the same class
    const sameClassAssets = assets.filter(asset => 
      asset.id !== assetId && 
      asset.assetClass === deletedAsset.assetClass && 
      asset.targetMode === 'PERCENTAGE'
    );
    
    // If the deleted asset was percentage-based and there are other percentage-based assets in the same class
    if (deletedAsset.targetMode === 'PERCENTAGE' && sameClassAssets.length > 0 && deletedAsset.targetPercent) {
      const deletedPercent = deletedAsset.targetPercent;
      
      // Get total of remaining assets' percentages
      const remainingTotal = sameClassAssets.reduce((sum, asset) => sum + (asset.targetPercent || 0), 0);
      
      // Redistribute the deleted percentage proportionally
      let newAssets = assets.filter(asset => asset.id !== assetId);
      
      if (remainingTotal === 0) {
        // Distribute equally if all others are 0
        const equalShare = deletedPercent / sameClassAssets.length;
        newAssets = newAssets.map(asset => {
          if (asset.assetClass === deletedAsset.assetClass && asset.targetMode === 'PERCENTAGE') {
            return { ...asset, targetPercent: (asset.targetPercent || 0) + equalShare };
          }
          return asset;
        });
      } else {
        // Distribute proportionally
        newAssets = newAssets.map(asset => {
          if (asset.assetClass === deletedAsset.assetClass && asset.targetMode === 'PERCENTAGE') {
            const proportion = (asset.targetPercent || 0) / remainingTotal;
            const additionalPercent = proportion * deletedPercent;
            return { ...asset, targetPercent: (asset.targetPercent || 0) + additionalPercent };
          }
          return asset;
        });
      }
      
      updateAllocation(newAssets);
    } else {
      // Just remove the asset without redistribution
      const newAssets = assets.filter(asset => asset.id !== assetId);
      updateAllocation(newAssets);
    }
  };

  const handleUpdateAssetClass = (assetClass: AssetClass, updates: { targetMode?: AllocationMode; targetPercent?: number }) => {
    console.log('[handleUpdateAssetClass] Updating asset class:', assetClass);
    console.log('[handleUpdateAssetClass] Updates:', updates);
    
    // Update the asset class level target independently
    const updatedTargets = {
      ...assetClassTargets,
      [assetClass]: {
        targetMode: updates.targetMode || assetClassTargets[assetClass]?.targetMode || 'PERCENTAGE',
        targetPercent: updates.targetPercent,
      }
    };
    
    // If updating a percentage-based asset class, redistribute other percentage-based classes
    if (updates.targetMode === 'PERCENTAGE' || (!updates.targetMode && assetClassTargets[assetClass]?.targetMode === 'PERCENTAGE')) {
      if (updates.targetPercent !== undefined) {
        console.log('[handleUpdateAssetClass] Redistributing percentages, new percent for', assetClass, ':', updates.targetPercent);
        
        // Get all percentage-based asset classes except the one being edited
        const otherPercentageClasses = Object.keys(updatedTargets).filter(
          (key) => key !== assetClass && updatedTargets[key as AssetClass].targetMode === 'PERCENTAGE'
        ) as AssetClass[];
        
        console.log('[handleUpdateAssetClass] Other percentage classes:', otherPercentageClasses);
        
        if (otherPercentageClasses.length > 0) {
          const remainingPercent = 100 - updates.targetPercent;
          console.log('[handleUpdateAssetClass] Remaining percent to distribute:', remainingPercent);
          
          // Get total of other classes' current percentages
          const otherClassesTotal = otherPercentageClasses.reduce(
            (sum, cls) => sum + (updatedTargets[cls].targetPercent || 0),
            0
          );
          
          console.log('[handleUpdateAssetClass] Total of other classes before redistribution:', otherClassesTotal);
          
          if (otherClassesTotal === 0) {
            // Distribute equally
            const equalPercent = remainingPercent / otherPercentageClasses.length;
            console.log('[handleUpdateAssetClass] Distributing equally:', equalPercent, '% each');
            otherPercentageClasses.forEach((cls) => {
              updatedTargets[cls] = {
                ...updatedTargets[cls],
                targetPercent: equalPercent,
              };
            });
          } else {
            // Distribute proportionally
            console.log('[handleUpdateAssetClass] Distributing proportionally');
            otherPercentageClasses.forEach((cls) => {
              const proportion = (updatedTargets[cls].targetPercent || 0) / otherClassesTotal;
              const newPercent = proportion * remainingPercent;
              console.log('[handleUpdateAssetClass]', cls, 'proportion:', proportion, 'new percent:', newPercent);
              updatedTargets[cls] = {
                ...updatedTargets[cls],
                targetPercent: newPercent,
              };
            });
          }
        }
      }
    }
    
    console.log('[handleUpdateAssetClass] Final updated targets:', updatedTargets);
    setAssetClassTargets(updatedTargets);
    
    // Recalculate allocation with updated targets
    const newAllocation = calculatePortfolioAllocation(assets, updatedTargets, portfolioValue);
    setAllocation(newAllocation);
    
    // Only update targetMode for assets in this class, not targetPercent
    if (updates.targetMode) {
      const newAssets = assets.map(asset => {
        if (asset.assetClass === assetClass) {
          return {
            ...asset,
            targetMode: updates.targetMode as AllocationMode,
          };
        }
        return asset;
      });
      updateAllocation(newAssets, updatedTargets);
    }
  };

  const handleAddAsset = (newAsset: Asset) => {
    updateAllocation([...assets, newAsset]);
  };

  const handleStartFromScratch = () => {
    if (confirm('Are you sure you want to delete all assets and start from scratch?')) {
      updateAllocation([]);
    }
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

  // Calculate cash delta (positive = SAVE, negative = INVEST)
  // The delta is applied to non-cash asset classes:
  // - If INVEST (negative cash delta), add to other classes
  // - If SAVE (positive cash delta), subtract from other classes
  const cashDeltaAmount = (() => {
    const cashClass = allocation.assetClasses.find(ac => ac.assetClass === 'CASH');
    if (!cashClass) return 0;
    
    // Calculate cash delta based on assetClassTargets
    const cashTarget = assetClassTargets.CASH;
    if (cashTarget.targetMode === 'SET') {
      // For SET mode, calculate delta from target total
      const delta = (cashClass.targetTotal || 0) - cashClass.currentTotal;
      // Return delta (negative = INVEST, positive = SAVE)
      return delta;
    }
    return 0;
  })();

  // Portfolio value handlers
  const handleStartEditPortfolioValue = () => {
    setEditPortfolioValue(portfolioValue);
    setIsEditingPortfolioValue(true);
  };

  const handleSavePortfolioValue = () => {
    setPortfolioValue(editPortfolioValue);
    updateAllocation(assets, assetClassTargets, editPortfolioValue);
    setIsEditingPortfolioValue(false);
  };

  const handleCancelEditPortfolioValue = () => {
    setIsEditingPortfolioValue(false);
  };

  // Mass edit handlers
  const handleOpenMassEditAssetClass = () => {
    setMassEditMode('assetClass');
    setMassEditAssetClass(null);
    setIsMassEditOpen(true);
  };

  const handleOpenMassEditAsset = (assetClass: AssetClass) => {
    setMassEditMode('asset');
    setMassEditAssetClass(assetClass);
    setIsMassEditOpen(true);
  };

  const handleMassEditSave = (updates: Record<string, number>) => {
    if (massEditMode === 'assetClass') {
      // Update asset class targets directly (no redistribution)
      const newTargets = { ...assetClassTargets };
      Object.entries(updates).forEach(([cls, percent]) => {
        newTargets[cls as AssetClass] = {
          ...newTargets[cls as AssetClass],
          targetPercent: percent,
        };
      });
      setAssetClassTargets(newTargets);
      // Recalculate allocation with new targets
      const newAllocation = calculatePortfolioAllocation(assets, newTargets, portfolioValue);
      setAllocation(newAllocation);
    } else if (massEditMode === 'asset' && massEditAssetClass) {
      // Update asset percentages directly (no redistribution)
      const newAssets = assets.map(asset => {
        if (updates[asset.id] !== undefined) {
          return { ...asset, targetPercent: updates[asset.id] };
        }
        return asset;
      });
      updateAllocation(newAssets);
    }
  };

  const assetClassChartData = prepareAssetClassChartData(allocation.assetClasses);
  const selectedAssetClass = selectedClass 
    ? allocation.assetClasses.find(ac => ac.assetClass === selectedClass)
    : null;
  const assetChartData = selectedAssetClass
    ? prepareAssetChartData(selectedAssetClass.assets, selectedAssetClass.currentTotal)
    : [];

  return (
    <div className="asset-allocation-page">
      <div className="page-header">
        <h1>📊 Asset Allocation Manager</h1>
        <p>
          Manage and visualize your portfolio asset allocation. Set target allocations,
          track current positions, and see recommended actions to rebalance your portfolio.
        </p>
      </div>

      <div className="asset-allocation-manager">
        {/* Portfolio Value */}
        <div className="portfolio-value-section">
          <div className="portfolio-value-label">
            <strong>Target Portfolio Value:</strong>
            {isEditingPortfolioValue ? (
              <div className="portfolio-value-edit">
                <input
                  type="number"
                  value={editPortfolioValue}
                  onChange={(e) => setEditPortfolioValue(parseFloat(e.target.value) || 0)}
                  className="portfolio-value-input"
                  min="0"
                />
                <span className="currency-symbol">{currency}</span>
                <button onClick={handleSavePortfolioValue} className="btn-save" title="Save">✓</button>
                <button onClick={handleCancelEditPortfolioValue} className="btn-cancel-edit" title="Cancel">✕</button>
              </div>
            ) : (
              <div className="portfolio-value-display" onClick={handleStartEditPortfolioValue}>
                <span className="portfolio-value">{formatCurrency(portfolioValue, currency)}</span>
                <button className="btn-edit" title="Edit Portfolio Value">✎</button>
              </div>
            )}
          </div>
          <div className="portfolio-value-info">
            Current holdings: {formatCurrency(allocation.totalValue, currency)}
          </div>
        </div>

        {/* How to Use - Collapsible at top */}
        <div className="allocation-info collapsible-section">
          <div className="collapsible-header" onClick={() => setIsHowToUseOpen(!isHowToUseOpen)}>
            <h4>💡 How to Use <span className="collapse-icon-small">{isHowToUseOpen ? '▼' : '▶'}</span></h4>
          </div>
          {isHowToUseOpen && (
            <ul className="how-to-use-content">
              <li><strong>Add Asset:</strong> Click the "Add Asset" button to add a new asset with type selection</li>
              <li><strong>Edit Asset:</strong> Click the edit (✎) button in any row to edit the current value and target %</li>
              <li><strong>Delete Asset:</strong> When editing an asset, click the trash icon (🗑️) to delete it</li>
              <li><strong>Collapsible Tables:</strong> Click on an asset class header to expand/collapse and see individual assets</li>
              <li><strong>Target Mode:</strong> Choose "%" for percentage-based allocation, "SET" for fixed amounts (only for cash types), or "OFF" to exclude</li>
              <li><strong>Percentage targets</strong> for active assets within a class should sum to 100%</li>
              <li><strong>Actions:</strong> 
                <span className="info-badge buy">BUY/SAVE</span> = Increase position | 
                <span className="info-badge sell">SELL/INVEST</span> = Decrease position | 
                <span className="info-badge hold">HOLD</span> = Within target range |
                <span className="info-badge excluded">EXCLUDED</span> = Not in allocation
              </li>
            </ul>
          )}
        </div>

        {!allocation.isValid && (
          <div className="validation-errors">
            <strong>⚠️ Validation Errors:</strong>
            <ul>
              {allocation.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="allocation-section">
          <div className="section-header-with-actions">
            <h3>Asset Classes</h3>
            <button onClick={handleOpenMassEditAssetClass} className="action-btn add-btn">
              ✏️ Mass Edit
            </button>
          </div>
          <EditableAssetClassTable
            assetClasses={allocation.assetClasses}
            totalValue={allocation.totalValue}
            currency={currency}
            assetClassTargets={assetClassTargets}
            onUpdateAssetClass={handleUpdateAssetClass}
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
              title={`${formatAssetName(selectedAssetClass.assetClass)} Breakdown`}
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
                {formatAssetName(ac.assetClass)}
              </option>
            ))}
          </select>
        </div>

        <div className="allocation-section">
          <div className="section-header-with-actions">
            <h3>Portfolio Details by Asset Class</h3>
            <div className="table-actions">
              <button onClick={() => setIsDialogOpen(true)} className="action-btn primary-btn">
                ➕ Add Asset
              </button>
              <button onClick={handleStartFromScratch} className="action-btn reset-btn">
                🔄 Reset
              </button>
              <button onClick={handleExport} className="action-btn export-btn">
                📥 Export CSV
              </button>
              <label className="action-btn import-btn">
                📤 Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
          <CollapsibleAllocationTable
            assets={assets}
            deltas={allocation.deltas}
            currency={currency}
            cashDeltaAmount={cashDeltaAmount}
            assetClassTargets={assetClassTargets}
            portfolioValue={portfolioValue}
            onUpdateAsset={handleUpdateAsset}
            onDeleteAsset={handleDeleteAsset}
            onMassEdit={handleOpenMassEditAsset}
          />
        </div>
      </div>

      <AddAssetDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={handleAddAsset}
      />

      <MassEditDialog
        isOpen={isMassEditOpen}
        onClose={() => setIsMassEditOpen(false)}
        onSave={handleMassEditSave}
        assets={assets}
        assetClass={massEditAssetClass}
        title={massEditMode === 'assetClass' ? 'Mass Edit Asset Classes' : `Mass Edit ${massEditAssetClass ? formatAssetName(massEditAssetClass) : ''} Assets`}
        mode={massEditMode}
        assetClassTargets={assetClassTargets}
      />
    </div>
  );
};
