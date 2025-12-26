import { useState } from 'react';
import { Asset, AssetClass, SubAssetType, AllocationMode } from '../types/assetAllocation';
import { formatAssetName } from '../utils/allocationCalculator';

interface AddAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Asset) => void;
}

const SUB_ASSET_TYPES: Record<AssetClass, SubAssetType[]> = {
  STOCKS: ['ETF', 'SINGLE_STOCK'],
  BONDS: ['ETF', 'SINGLE_BOND'],
  CASH: ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'MONEY_ETF'],
  CRYPTO: ['COIN'],
  REAL_ESTATE: ['PROPERTY', 'REIT'],
};

// Only these sub-types can use SET mode
const SET_MODE_ALLOWED: SubAssetType[] = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'MONEY_ETF'];

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ isOpen, onClose, onAdd }) => {
  const [assetClass, setAssetClass] = useState<AssetClass>('STOCKS');
  const [subAssetType, setSubAssetType] = useState<SubAssetType>('ETF');
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [targetMode, setTargetMode] = useState<AllocationMode>('PERCENTAGE');
  const [targetPercent, setTargetPercent] = useState<number>(0);

  const handleAssetClassChange = (newClass: AssetClass) => {
    setAssetClass(newClass);
    // Reset sub-asset type to first option for new class
    const availableSubTypes = SUB_ASSET_TYPES[newClass];
    if (availableSubTypes.length > 0) {
      setSubAssetType(availableSubTypes[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !ticker.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      assetClass,
      subAssetType,
      currentValue,
      targetMode,
      targetPercent: targetMode === 'PERCENTAGE' ? targetPercent : undefined,
      targetValue: targetMode === 'SET' ? currentValue : undefined,
    };

    onAdd(newAsset);
    
    // Reset form
    setName('');
    setTicker('');
    setCurrentValue(0);
    setTargetPercent(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>➕ Add New Asset</h3>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label>Asset Class *</label>
              <select
                value={assetClass}
                onChange={(e) => handleAssetClassChange(e.target.value as AssetClass)}
                className="dialog-select"
              >
                <option value="STOCKS">Stocks</option>
                <option value="BONDS">Bonds</option>
                <option value="CASH">Cash</option>
                <option value="CRYPTO">Crypto</option>
                <option value="REAL_ESTATE">Real Estate</option>
              </select>
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select
                value={subAssetType}
                onChange={(e) => setSubAssetType(e.target.value as SubAssetType)}
                className="dialog-select"
              >
                {SUB_ASSET_TYPES[assetClass].map(type => (
                  <option key={type} value={type}>
                    {formatAssetName(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Asset Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., S&P 500 Index Fund"
              className="dialog-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Ticker/Symbol *</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g., SPY"
              className="dialog-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Current Value (EUR) *</label>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="dialog-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Mode</label>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as AllocationMode)}
                className="dialog-select"
                disabled={!SET_MODE_ALLOWED.includes(subAssetType)}
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                {SET_MODE_ALLOWED.includes(subAssetType) && (
                  <option value="SET">Fixed Amount (SET)</option>
                )}
                <option value="OFF">Excluded (OFF)</option>
              </select>
            </div>

            {targetMode === 'PERCENTAGE' && (
              <div className="form-group">
                <label>Target % (of Asset Class) *</label>
                <input
                  type="number"
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="dialog-input"
                />
              </div>
            )}
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Add Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
