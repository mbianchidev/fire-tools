import { useState, useEffect } from 'react';
import { Asset, PortfolioAllocation, AssetClass, AllocationMode } from '../types/assetAllocation';
import { calculatePortfolioAllocation, prepareAssetClassChartData, prepareAssetChartData, formatAssetName, formatCurrency } from '../utils/allocationCalculator';
import { DEFAULT_ASSETS, DEFAULT_PORTFOLIO_VALUE } from '../utils/defaultAssets';
import { saveAssetAllocation, loadAssetAllocation, clearAllData } from '../utils/cookieStorage';
import { exportAssetAllocationToCSV, importAssetAllocationFromCSV } from '../utils/csvExport';
import { EditableAssetClassTable } from './EditableAssetClassTable';
import { AllocationChart } from './AllocationChart';
import { AddAssetDialog } from './AddAssetDialog';
import { CollapsibleAllocationTable } from './CollapsibleAllocationTable';
import { MassEditDialog } from './MassEditDialog';
import { DCAHelperDialog } from './DCAHelperDialog';
import { DataManagement } from './DataManagement';

/**
 * Calculate cash delta from assets and targets.
 * Positive = SAVE (cash target > current), Negative = INVEST (cash target < current)
 */
function calculateCashDelta(
  assets: Asset[],
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>
): number {
  const cashTarget = assetClassTargets.CASH;
  if (cashTarget?.targetMode !== 'SET') {
    return 0;
  }
  
  // Calculate cash current total
  const cashCurrentTotal = assets
    .filter(a => a.assetClass === 'CASH' && a.targetMode !== 'OFF')
    .reduce((sum, a) => sum + a.currentValue, 0);
  
  // Calculate cash target total (sum of SET target values for cash assets)
  const cashTargetTotal = assets
    .filter(a => a.assetClass === 'CASH' && a.targetMode === 'SET')
    .reduce((sum, a) => sum + (a.targetValue || 0), 0);
  
  // Delta = target - current (negative = INVEST, positive = SAVE)
  return cashTargetTotal - cashCurrentTotal;
}

export const AssetAllocationPage: React.FC = () => {
  const defaultTargets = {
    STOCKS: { targetMode: 'PERCENTAGE' as AllocationMode, targetPercent: 60 },
    BONDS: { targetMode: 'PERCENTAGE' as AllocationMode, targetPercent: 40 },
    CASH: { targetMode: 'SET' as AllocationMode },
    CRYPTO: { targetMode: 'PERCENTAGE' as AllocationMode, targetPercent: 0 },
    REAL_ESTATE: { targetMode: 'PERCENTAGE' as AllocationMode, targetPercent: 0 },
  };

  // Initialize from localStorage if available, otherwise use defaults
  const [assets, setAssets] = useState<Asset[]>(() => {
    const saved = loadAssetAllocation();
    return saved.assets || DEFAULT_ASSETS;
  });
  const [currency] = useState<string>('EUR');
  // Store asset class level targets independently for display in the Asset Classes table
  const [assetClassTargets, setAssetClassTargets] = useState<Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>>(() => {
    const saved = loadAssetAllocation();
    return saved.assetClassTargets || defaultTargets;
  });
  
  // Calculate portfolio value as sum of all non-cash assets
  const portfolioValue = assets
    .filter(a => a.assetClass !== 'CASH' && a.targetMode !== 'OFF')
    .reduce((sum, a) => sum + a.currentValue, 0);
  
  const [allocation, setAllocation] = useState<PortfolioAllocation>(() => {
    const saved = loadAssetAllocation();
    const initialAssets = saved.assets || DEFAULT_ASSETS;
    const initialTargets = saved.assetClassTargets || defaultTargets;
    const defaultCashDelta = calculateCashDelta(initialAssets, initialTargets);
    return calculatePortfolioAllocation(initialAssets, initialTargets, DEFAULT_PORTFOLIO_VALUE, defaultCashDelta);
  });
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  // Mass edit dialog state
  const [isMassEditOpen, setIsMassEditOpen] = useState(false);
  const [massEditMode, setMassEditMode] = useState<'assetClass' | 'asset'>('assetClass');
  const [massEditAssetClass, setMassEditAssetClass] = useState<AssetClass | null>(null);
  // DCA helper dialog state
  const [isDCADialogOpen, setIsDCADialogOpen] = useState(false);
  // Charts collapse state
  const [isChartsCollapsed, setIsChartsCollapsed] = useState(false);

  // Auto-save to localStorage when assets or targets change
  useEffect(() => {
    saveAssetAllocation(assets, assetClassTargets);
  }, [assets, assetClassTargets]);

  const updateAllocation = (newAssets: Asset[], newAssetClassTargets?: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>) => {
    setAssets(newAssets);
    const targets = newAssetClassTargets ?? assetClassTargets;
    // Calculate portfolio value from non-cash assets
    const pValue = newAssets
      .filter(a => a.assetClass !== 'CASH' && a.targetMode !== 'OFF')
      .reduce((sum, a) => sum + a.currentValue, 0);
    // Calculate cash delta to pass to allocation calculation
    const cashDelta = calculateCashDelta(newAssets, targets);
    const newAllocation = calculatePortfolioAllocation(newAssets, targets, pValue, cashDelta);
    setAllocation(newAllocation);
  };

  const handleUpdateAsset = (assetId: string, updates: Partial<Asset>) => {
    const newAssets = assets.map(asset =>
      asset.id === assetId ? { ...asset, ...updates } : asset
    );
    updateAllocation(newAssets);
  };

  const handleBatchUpdateAssets = (updates: Record<string, Partial<Asset>>) => {
    const newAssets = assets.map(asset =>
      updates[asset.id] ? { ...asset, ...updates[asset.id] } : asset
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
        // Get all percentage-based asset classes except the one being edited
        const otherPercentageClasses = Object.keys(updatedTargets).filter(
          (key) => key !== assetClass && updatedTargets[key as AssetClass].targetMode === 'PERCENTAGE'
        ) as AssetClass[];
        
        if (otherPercentageClasses.length > 0) {
          const remainingPercent = 100 - updates.targetPercent;
          
          // Get total of other classes' current percentages
          const otherClassesTotal = otherPercentageClasses.reduce(
            (sum, cls) => sum + (updatedTargets[cls].targetPercent || 0),
            0
          );
          
          if (otherClassesTotal === 0) {
            // Distribute equally
            const equalPercent = remainingPercent / otherPercentageClasses.length;
            otherPercentageClasses.forEach((cls) => {
              updatedTargets[cls] = {
                ...updatedTargets[cls],
                targetPercent: equalPercent,
              };
            });
          } else {
            // Distribute proportionally
            otherPercentageClasses.forEach((cls) => {
              const proportion = (updatedTargets[cls].targetPercent || 0) / otherClassesTotal;
              const newPercent = proportion * remainingPercent;
              updatedTargets[cls] = {
                ...updatedTargets[cls],
                targetPercent: newPercent,
              };
            });
          }
        }
      }
    }
    
    setAssetClassTargets(updatedTargets);
    
    // Recalculate allocation with updated targets
    const pValue = assets
      .filter(a => a.assetClass !== 'CASH' && a.targetMode !== 'OFF')
      .reduce((sum, a) => sum + a.currentValue, 0);
    const cashDelta = calculateCashDelta(assets, updatedTargets);
    const newAllocation = calculatePortfolioAllocation(assets, updatedTargets, pValue, cashDelta);
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
    // If the new asset is percentage-based, redistribute existing assets in the same class
    if (newAsset.targetMode === 'PERCENTAGE' && newAsset.targetPercent) {
      const newAssetPercent = newAsset.targetPercent;
      
      // Validate: new asset percentage must be between 0 and 100
      if (newAssetPercent <= 0 || newAssetPercent > 100) {
        updateAllocation([...assets, newAsset]);
        return;
      }
      
      // Get existing percentage-based assets in the same class
      const sameClassAssets = assets.filter(a => 
        a.assetClass === newAsset.assetClass && 
        a.targetMode === 'PERCENTAGE'
      );
      
      if (sameClassAssets.length > 0) {
        // Calculate total percentage of existing assets in this class
        const existingTotal = sameClassAssets.reduce((sum, a) => sum + (a.targetPercent || 0), 0);
        
        if (existingTotal > 0) {
          // Calculate how much we need to reduce (to make room for the new asset)
          // The new total should be 100%, so we reduce existing proportionally
          // reductionFactor = (100 - newAssetPercent) / existingTotal
          // This works correctly even if existingTotal != 100
          const reductionFactor = (100 - newAssetPercent) / existingTotal;
          
          // Redistribute: reduce each existing asset proportionally
          const updatedAssets = assets.map(asset => {
            if (asset.assetClass === newAsset.assetClass && asset.targetMode === 'PERCENTAGE') {
              const newPercent = (asset.targetPercent || 0) * reductionFactor;
              return { ...asset, targetPercent: Math.max(0, newPercent) }; // Ensure non-negative
            }
            return asset;
          });
          
          updateAllocation([...updatedAssets, newAsset]);
          return;
        }
      }
    }
    
    // Default: just add the asset without redistribution
    updateAllocation([...assets, newAsset]);
  };

  const handleStartFromScratch = () => {
    if (confirm('Are you sure you want to delete all assets and start from scratch?')) {
      updateAllocation([]);
    }
  };

  const handleExport = () => {
    const csv = exportAssetAllocationToCSV(assets, assetClassTargets);
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
        const imported = importAssetAllocationFromCSV(csv);
        setAssets(imported.assets);
        setAssetClassTargets(imported.assetClassTargets);
        updateAllocation(imported.assets, imported.assetClassTargets);
      } catch (error) {
        alert(`Error importing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This will clear all saved data from cookies and reset to defaults.')) {
      clearAllData();
      setAssets(DEFAULT_ASSETS);
      setAssetClassTargets(defaultTargets);
      updateAllocation(DEFAULT_ASSETS, defaultTargets);
    }
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
      const cashDelta = calculateCashDelta(assets, newTargets);
      const newAllocation = calculatePortfolioAllocation(assets, newTargets, portfolioValue, cashDelta);
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
      <header className="page-header">
        <h1><span aria-hidden="true">📊</span> Asset Allocation Manager</h1>
        <p>
          Manage and visualize your portfolio asset allocation. Set target allocations,
          track current positions, and see recommended actions to rebalance your portfolio.
        </p>
      </header>

      <main className="asset-allocation-manager" id="main-content">
        {/* Portfolio Value - calculated from non-cash assets */}
        <section className="portfolio-value-section" aria-labelledby="portfolio-value-heading">
          <div className="portfolio-value-label">
            <strong id="portfolio-value-heading">Portfolio Value (excl. Cash):</strong>
            <span className="portfolio-value">{formatCurrency(portfolioValue, currency)}</span>
          </div>
          <div className="portfolio-value-info">
            Total holdings (incl. cash): {formatCurrency(allocation.totalHoldings, currency)}
          </div>
        </section>

        {/* How to Use - Collapsible at top */}
        <section className="allocation-info collapsible-section">
          <button 
            className="collapsible-header" 
            onClick={() => setIsHowToUseOpen(!isHowToUseOpen)}
            aria-expanded={isHowToUseOpen}
            aria-controls="how-to-use-content"
          >
            <h4><span aria-hidden="true">💡</span> How to Use <span className="collapse-icon-small" aria-hidden="true">{isHowToUseOpen ? '▼' : '▶'}</span></h4>
          </button>
          {isHowToUseOpen && (
            <ul id="how-to-use-content" className="how-to-use-content">
              <li><strong>Add Asset:</strong> Click the "Add Asset" button to add a new asset with type selection</li>
              <li><strong>Edit Asset:</strong> Click the edit <span aria-label="edit button">(✎)</span> button in any row to edit the current value and target %</li>
              <li><strong>Delete Asset:</strong> When editing an asset, click the trash icon <span aria-label="delete button">(🗑️)</span> to delete it</li>
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
        </section>

        {/* Data Management Section - After "How to Use" */}
        <DataManagement
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleResetData}
          defaultOpen={false}
        />

        {!allocation.isValid && (
          <div className="validation-errors" role="alert" aria-live="polite">
            <strong><span aria-hidden="true">⚠️</span> Validation Errors:</strong>
            <ul>
              {allocation.validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <section className="allocation-section" aria-labelledby="asset-classes-heading">
          <div className="section-header-with-actions">
            <h3 id="asset-classes-heading">Asset Classes</h3>
            <button 
              onClick={handleOpenMassEditAssetClass} 
              className="btn-mass-edit" 
              style={{ marginLeft: '1rem' }}
              aria-label="Edit all asset class allocations"
            >
              <span aria-hidden="true">✏️</span> Edit All
            </button>
          </div>
          <EditableAssetClassTable
            assetClasses={allocation.assetClasses}
            totalValue={allocation.totalValue}
            totalHoldings={allocation.totalHoldings}
            cashDeltaAmount={cashDeltaAmount}
            currency={currency}
            assetClassTargets={assetClassTargets}
            onUpdateAssetClass={handleUpdateAssetClass}
          />
        </section>

        <div className="class-selector">
          <label htmlFor="asset-class-select">View Asset Class Details:</label>
          <select 
            id="asset-class-select"
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

        <section className="charts-section" aria-labelledby="charts-heading">
          <button 
            className="collapsible-header" 
            onClick={() => setIsChartsCollapsed(!isChartsCollapsed)}
            aria-expanded={!isChartsCollapsed}
            aria-controls="charts-content"
          >
            <h3 id="charts-heading">Graphs</h3>
            <span className="collapse-icon-small" aria-hidden="true">{isChartsCollapsed ? '▶' : '▼'}</span>
          </button>
          {!isChartsCollapsed && (
            <div id="charts-content" className="charts-row">
              <AllocationChart
                data={assetClassChartData}
                title="Portfolio allocation by asset class"
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
          )}
        </section>

        <section className="allocation-section" aria-labelledby="portfolio-details-heading">
          <div className="section-header-with-actions">
            <h3 id="portfolio-details-heading">Portfolio Details by Asset Class</h3>
            <div className="table-actions">
              <button 
                onClick={() => setIsDCADialogOpen(true)} 
                className="action-btn" 
                style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', color: 'white' }}
                aria-label="Open Dollar Cost Averaging helper"
              >
                <span aria-hidden="true">💰</span> DCA Helper
              </button>
              <button 
                onClick={() => setIsDialogOpen(true)} 
                className="action-btn primary-btn"
                aria-label="Add new asset to portfolio"
              >
                <span aria-hidden="true">➕</span> Add Asset
              </button>
              <button 
                onClick={handleStartFromScratch} 
                className="action-btn" 
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}
                aria-label="Reset all assets to defaults"
              >
                <span aria-hidden="true">🔄</span> Reset Assets
              </button>
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
            onBatchUpdateAssets={handleBatchUpdateAssets}
            onDeleteAsset={handleDeleteAsset}
            onMassEdit={handleOpenMassEditAsset}
          />
        </section>
      </main>

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

      <DCAHelperDialog
        isOpen={isDCADialogOpen}
        onClose={() => setIsDCADialogOpen(false)}
        assets={assets}
        assetClassTargets={assetClassTargets}
        currency={currency}
        onConfirmInvestments={(updates) => {
          // Apply confirmed investment amounts to the portfolio by updating asset current values
          const newAssets = assets.map(asset => {
            const update = updates[asset.id];
            if (update) {
              return {
                ...asset,
                currentValue: asset.currentValue + update.valueIncrease,
              };
            }
            return asset;
          });
          updateAllocation(newAssets);
        }}
      />
    </div>
  );
};
