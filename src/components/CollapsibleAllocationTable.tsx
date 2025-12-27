import { useState, useEffect, useRef } from 'react';
import { Asset, AllocationDelta, AssetClass, AllocationMode } from '../types/assetAllocation';
import { formatCurrency, formatPercent, formatAssetName } from '../utils/allocationCalculator';

interface CollapsibleAllocationTableProps {
  assets: Asset[];
  deltas: AllocationDelta[];
  currency: string;
  cashDeltaAmount?: number; // Cash delta (positive = SAVE/subtract from other classes, negative = INVEST/add to other classes)
  assetClassTargets?: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
  portfolioValue?: number;
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => void;
  onDeleteAsset: (assetId: string) => void;
  onMassEdit?: (assetClass: AssetClass) => void; // Handler for opening mass edit dialog
}

// Sub-types that require ISIN code (clicking ticker should copy ISIN)
const ISIN_TYPES = ['ETF', 'SINGLE_STOCK', 'SINGLE_BOND', 'REIT', 'MONEY_ETF'];

export const CollapsibleAllocationTable: React.FC<CollapsibleAllocationTableProps> = ({
  assets,
  deltas,
  currency,
  cashDeltaAmount = 0,
  assetClassTargets,
  portfolioValue,
  onUpdateAsset,
  onDeleteAsset,
  onMassEdit,
}) => {
  // Initialize with all classes collapsed
  const allClasses = new Set(assets.map(a => a.assetClass));
  const [copiedIsin, setCopiedIsin] = useState<string | null>(null);
  const [collapsedClasses, setCollapsedClasses] = useState<Set<AssetClass>>(allClasses);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ name: string; currentValue: number; targetPercent: number }>({
    name: '',
    currentValue: 0,
    targetPercent: 0,
  });
  const tableRef = useRef<HTMLDivElement>(null);
  const editValuesRef = useRef(editValues);
  
  // Keep ref updated with latest edit values
  useEffect(() => {
    editValuesRef.current = editValues;
  }, [editValues]);

  // Redistribute percentages helper function
  const redistributePercentages = (assetId: string, newTargetPercent: number, assetClass: AssetClass) => {
    // Get all percentage-based assets in the same class
    const classAssets = assets.filter(a => 
      a.assetClass === assetClass && 
      a.targetMode === 'PERCENTAGE' &&
      a.id !== assetId
    );
    
    if (classAssets.length === 0) return;
    
    // Calculate remaining percentage to distribute
    const remainingPercent = 100 - newTargetPercent;
    
    // Get total of other assets' current VALUES (not percentages) for proportional distribution
    const otherAssetsValueTotal = classAssets.reduce((sum, a) => sum + a.currentValue, 0);
    
    if (otherAssetsValueTotal === 0) {
      // Distribute equally if all others have 0 value
      const equalPercent = remainingPercent / classAssets.length;
      classAssets.forEach(asset => {
        onUpdateAsset(asset.id, { targetPercent: equalPercent });
      });
    } else {
      // Distribute proportionally based on current VALUES
      classAssets.forEach(asset => {
        const proportion = asset.currentValue / otherAssetsValueTotal;
        const newPercent = proportion * remainingPercent;
        onUpdateAsset(asset.id, { targetPercent: newPercent });
      });
    }
  };

  // Click outside to save (same behavior as Asset Classes table)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingAsset && tableRef.current && !tableRef.current.contains(event.target as Node)) {
        // Use ref to get latest edit values without causing re-renders
        const asset = assets.find(a => a.id === editingAsset);
        if (asset) {
          onUpdateAsset(editingAsset, {
            name: editValuesRef.current.name,
            currentValue: editValuesRef.current.currentValue,
            targetPercent: editValuesRef.current.targetPercent,
          });
          
          if (asset.targetMode === 'PERCENTAGE') {
            redistributePercentages(editingAsset, editValuesRef.current.targetPercent, asset.assetClass);
          }
        }
        setEditingAsset(null);
      }
    };

    if (editingAsset) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingAsset, assets, onUpdateAsset]);

  const toggleCollapse = (assetClass: AssetClass) => {
    const newCollapsed = new Set(collapsedClasses);
    if (newCollapsed.has(assetClass)) {
      newCollapsed.delete(assetClass);
    } else {
      newCollapsed.add(assetClass);
    }
    setCollapsedClasses(newCollapsed);
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.assetClass]) {
      acc[asset.assetClass] = [];
    }
    acc[asset.assetClass].push(asset);
    return acc;
  }, {} as Record<AssetClass, Asset[]>);

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

  const startEditing = (asset: Asset) => {
    setEditingAsset(asset.id);
    setEditValues({
      name: asset.name,
      currentValue: asset.currentValue,
      targetPercent: asset.targetPercent || 0,
    });
  };

  const saveEditing = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    // First update the edited asset (including name)
    onUpdateAsset(assetId, {
      name: editValues.name,
      currentValue: editValues.currentValue,
      targetPercent: editValues.targetPercent,
    });
    
    // Then redistribute percentages if this is a percentage-based asset
    if (asset.targetMode === 'PERCENTAGE') {
      redistributePercentages(assetId, editValues.targetPercent, asset.assetClass);
    }
    
    setEditingAsset(null);
  };

  const cancelEditing = () => {
    setEditingAsset(null);
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

  const handleTargetValueChange = (assetId: string, value: string) => {
    const val = parseFloat(value) || 0;
    onUpdateAsset(assetId, { targetValue: val });
  };

  const copyIsinToClipboard = (asset: Asset) => {
    if (asset.isin) {
      navigator.clipboard.writeText(asset.isin).then(() => {
        setCopiedIsin(asset.id);
        setTimeout(() => setCopiedIsin(null), 2000);
      });
    }
  };

  return (
    <div className="collapsible-allocation-table" ref={tableRef}>
      {Object.entries(groupedAssets).map(([assetClass, classAssets]) => {
        const isCollapsed = collapsedClasses.has(assetClass as AssetClass);
        const classTotal = classAssets.reduce((sum, asset) => 
          sum + (asset.targetMode === 'OFF' ? 0 : asset.currentValue), 0
        );
        
        // Calculate class target value based on assetClassTargets and portfolioValue
        const classTarget = assetClassTargets?.[assetClass as AssetClass];
        let classTargetValue = 0;
        if (classTarget?.targetMode === 'PERCENTAGE' && classTarget.targetPercent !== undefined && portfolioValue) {
          classTargetValue = (classTarget.targetPercent / 100) * portfolioValue;
        } else if (classTarget?.targetMode === 'SET') {
          // For SET mode, sum up the target values of assets in this class
          classTargetValue = classAssets.reduce((sum, asset) => 
            sum + (asset.targetMode === 'SET' ? (asset.targetValue || 0) : 0), 0
          );
        }
        
        // Calculate cash adjustment distributed proportionally to non-cash classes
        // Cash delta: positive = SAVE (subtract from other classes), negative = INVEST (add to other classes)
        // The cash amount should be distributed based on each non-cash class's target percentage
        let cashAdjustment = 0;
        if (assetClass !== 'CASH' && cashDeltaAmount !== 0 && assetClassTargets) {
          // Get total percentage of all non-cash percentage-based classes
          const nonCashPercentageTotal = Object.entries(assetClassTargets)
            .filter(([cls, target]) => 
              cls !== 'CASH' && 
              target.targetMode === 'PERCENTAGE' && 
              (target.targetPercent || 0) > 0
            )
            .reduce((sum, [, target]) => sum + (target.targetPercent || 0), 0);
          
          if (nonCashPercentageTotal > 0 && classTarget?.targetMode === 'PERCENTAGE' && classTarget.targetPercent) {
            // Distribute cash proportionally based on this class's share of total non-cash targets
            const proportion = classTarget.targetPercent / nonCashPercentageTotal;
            // Negative cash delta = INVEST = add to this class
            // Positive cash delta = SAVE = subtract from this class
            cashAdjustment = -cashDeltaAmount * proportion;
          }
        }
        const classDelta = classTargetValue - classTotal + cashAdjustment;

        return (
          <div key={assetClass} className="asset-class-group">
            <div 
              className="asset-class-header"
              onClick={() => toggleCollapse(assetClass as AssetClass)}
            >
              <div className="class-header-left">
                <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
                <span className={`asset-class-badge ${assetClass.toLowerCase()}`}>
                  {formatAssetName(assetClass)}
                </span>
                <span className="asset-count">({classAssets.length} assets)</span>
                {onMassEdit && (
                  <button
                    className="btn-mass-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMassEdit(assetClass as AssetClass);
                    }}
                    title="Mass Edit Percentages"
                  >
                    ✏️ Mass Edit
                  </button>
                )}
              </div>
              <div className="class-header-right">
                <span className="class-total">{formatCurrency(classTotal, currency)}</span>
                <span className={`class-delta ${classDelta > 0 ? 'positive' : classDelta < 0 ? 'negative' : ''}`}>
                  {classDelta > 0 ? '+' : classDelta < 0 ? '-' : ''}{formatCurrency(Math.abs(classDelta), currency)}
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <table className="assets-table">
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Ticker</th>
                    <th>Target Mode</th>
                    <th>% Target</th>
                    <th>% Current (Total)</th>
                    <th>% Current (Class)</th>
                    <th>Current Value</th>
                    <th>Target Value</th>
                    <th>Delta</th>
                    <th>Action</th>
                    <th>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {classAssets.map(asset => {
                    const delta = deltas.find(d => d.assetId === asset.id);
                    if (!delta) return null;

                    const isEditing = editingAsset === asset.id;

                    return (
                      <tr 
                        key={asset.id} 
                        className={`${asset.targetMode === 'OFF' ? 'excluded-row' : ''} ${isEditing ? 'editing-row' : ''}`}
                        onClick={() => !isEditing && startEditing(asset)}
                      >
                        <td className="asset-name">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="edit-input edit-name-input"
                            />
                          ) : (
                            asset.name
                          )}
                        </td>
                        <td>
                          <span className="sub-type-badge">
                            {formatAssetName(asset.subAssetType)}
                          </span>
                        </td>
                        <td className="ticker-cell">
                          {ISIN_TYPES.includes(asset.subAssetType) && asset.isin ? (
                            <span 
                              className={`ticker-with-isin ${copiedIsin === asset.id ? 'copied' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyIsinToClipboard(asset);
                              }}
                              title={`Click to copy ISIN: ${asset.isin}`}
                            >
                              {asset.ticker}
                              <span className="copy-icon">📋</span>
                              {copiedIsin === asset.id && <span className="copied-tooltip">Copied!</span>}
                            </span>
                          ) : (
                            asset.ticker
                          )}
                        </td>
                        <td>
                          <select
                            value={asset.targetMode}
                            onChange={(e) => handleTargetModeChange(asset.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="target-mode-select"
                          >
                            <option value="PERCENTAGE">%</option>
                            <option value="SET">SET</option>
                            <option value="OFF">OFF</option>
                          </select>
                        </td>
                        <td>
                          {isEditing && asset.targetMode === 'PERCENTAGE' ? (
                            <input
                              type="number"
                              value={editValues.targetPercent}
                              onChange={(e) => setEditValues({ ...editValues, targetPercent: parseFloat(e.target.value) || 0 })}
                              className="edit-input"
                              min="0"
                              max="100"
                            />
                          ) : asset.targetMode === 'PERCENTAGE' ? (
                            formatPercent(asset.targetPercent || 0)
                          ) : asset.targetMode === 'SET' ? (
                            <span className="set-label">SET</span>
                          ) : (
                            <span className="off-label">OFF</span>
                          )}
                        </td>
                        <td>{formatPercent(delta.currentPercent)}</td>
                        <td>{formatPercent(delta.currentPercentInClass)}</td>
                        <td className="currency-value">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.currentValue}
                              onChange={(e) => setEditValues({ ...editValues, currentValue: parseFloat(e.target.value) || 0 })}
                              className="edit-input"
                              min="0"
                            />
                          ) : (
                            formatCurrency(delta.currentValue, currency)
                          )}
                        </td>
                        <td className="currency-value">
                          {asset.targetMode === 'SET' ? (
                            <input
                              type="number"
                              value={asset.targetValue || 0}
                              onChange={(e) => handleTargetValueChange(asset.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="target-input"
                              min="0"
                            />
                          ) : (
                            formatCurrency(delta.targetValue, currency)
                          )}
                        </td>
                        <td className={`currency-value ${delta.delta > 0 ? 'positive' : delta.delta < 0 ? 'negative' : ''}`}>
                          {delta.delta > 0 ? '+' : delta.delta < 0 ? '-' : ''}{formatCurrency(Math.abs(delta.delta), currency)}
                        </td>
                        <td>
                          <span 
                            className="action-badge"
                            style={{ backgroundColor: getActionColor(delta.action) }}
                          >
                            {delta.action}
                          </span>
                        </td>
                        <td>
                          {isEditing ? (
                            <div className="edit-actions">
                              <button onClick={() => saveEditing(asset.id)} className="btn-save" title="Save">✓</button>
                              <button onClick={cancelEditing} className="btn-cancel-edit" title="Cancel">✕</button>
                              <button onClick={() => {
                                if (confirm(`Delete ${asset.name}?`)) {
                                  onDeleteAsset(asset.id);
                                  setEditingAsset(null);
                                }
                              }} className="btn-delete" title="Delete">🗑️</button>
                            </div>
                          ) : (
                            <button onClick={() => startEditing(asset)} className="btn-edit" title="Edit">✎</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};
