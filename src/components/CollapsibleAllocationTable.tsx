import { useState } from 'react';
import { Asset, AllocationDelta, AssetClass, AllocationMode } from '../types/assetAllocation';
import { formatCurrency, formatPercent, formatAssetName, redistributeAssetPercentagesInClass } from '../utils/allocationCalculator';

interface CollapsibleAllocationTableProps {
  assets: Asset[];
  deltas: AllocationDelta[];
  currency: string;
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => void;
  onUpdateAssets: (newAssets: Asset[]) => void;
  onDeleteAsset: (assetId: string) => void;
}

export const CollapsibleAllocationTable: React.FC<CollapsibleAllocationTableProps> = ({
  assets,
  deltas,
  currency,
  onUpdateAsset,
  onUpdateAssets,
  onDeleteAsset,
}) => {
  // Initialize with all classes collapsed
  const allClasses = new Set(assets.map(a => a.assetClass));
  const [collapsedClasses, setCollapsedClasses] = useState<Set<AssetClass>>(allClasses);
  const [editingAsset, setEditingAsset] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ currentValue: number; targetPercent: number }>({
    currentValue: 0,
    targetPercent: 0,
  });

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
    console.log('[Sub-table] Starting to edit asset:', asset.name);
    console.log('[Sub-table] Current target percent:', asset.targetPercent);
    setEditingAsset(asset.id);
    setEditValues({
      currentValue: asset.currentValue,
      targetPercent: asset.targetPercent || 0,
    });
  };

  const saveEditing = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    console.log('[Sub-table] Saving changes for asset:', asset.name);
    console.log('[Sub-table] New current value:', editValues.currentValue);
    console.log('[Sub-table] New target percent:', editValues.targetPercent);
    
    // Update current value first
    let updatedAssets = assets.map(a =>
      a.id === assetId ? { ...a, currentValue: editValues.currentValue } : a
    );
    
    // If this is a percentage-based asset and we have a valid target percent, use the proper redistribution logic
    if (asset.targetMode === 'PERCENTAGE' && editValues.targetPercent !== undefined) {
      updatedAssets = redistributeAssetPercentagesInClass(
        updatedAssets,
        assetId,
        editValues.targetPercent
      );
    } else if (editValues.targetPercent !== undefined) {
      // For non-percentage assets, just update the values
      updatedAssets = updatedAssets.map(a =>
        a.id === assetId ? { ...a, targetPercent: editValues.targetPercent } : a
      );
    }
    
    // Use bulk update to apply all changes at once
    onUpdateAssets(updatedAssets);
    setEditingAsset(null);
  };

  const cancelEditing = () => {
    console.log('[Sub-table] Canceling edit');
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

  return (
    <div className="collapsible-allocation-table">
      {Object.entries(groupedAssets).map(([assetClass, classAssets]) => {
        const isCollapsed = collapsedClasses.has(assetClass as AssetClass);
        const classTotal = classAssets.reduce((sum, asset) => 
          sum + (asset.targetMode === 'OFF' ? 0 : asset.currentValue), 0
        );
        const classDeltas = classAssets.map(asset => deltas.find(d => d.assetId === asset.id)!).filter(Boolean);
        const classTargetTotal = classDeltas.reduce((sum, delta) => sum + delta.targetValue, 0);
        const classDelta = classTargetTotal - classTotal;

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
              </div>
              <div className="class-header-right">
                <span className="class-total">{formatCurrency(classTotal, currency)}</span>
                <span className={`class-delta ${classDelta > 0 ? 'positive' : classDelta < 0 ? 'negative' : ''}`}>
                  {classDelta !== 0 && (classDelta > 0 ? '+' : '')}{formatCurrency(classDelta, currency)}
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
                        <td className="asset-name">{asset.name}</td>
                        <td>
                          <span className="sub-type-badge">
                            {formatAssetName(asset.subAssetType)}
                          </span>
                        </td>
                        <td>{asset.ticker}</td>
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
                              step="0.1"
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
                              step="100"
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
