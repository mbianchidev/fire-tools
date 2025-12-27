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
  CASH: ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT', 'MONEY_ETF'],
  CRYPTO: ['COIN'],
  REAL_ESTATE: ['PROPERTY', 'REIT'],
};

// Only these sub-types can use SET mode
const SET_MODE_ALLOWED: SubAssetType[] = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT', 'MONEY_ETF'];

// Sub-types that require ISIN code
const ISIN_REQUIRED: SubAssetType[] = ['ETF', 'SINGLE_STOCK', 'SINGLE_BOND', 'REIT', 'MONEY_ETF'];

// Sub-types that don't need ticker (use descriptive name instead)
const NO_TICKER_REQUIRED: SubAssetType[] = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT', 'PROPERTY'];

// Get ticker label based on sub-asset type
const getTickerLabel = (subAssetType: SubAssetType): string => {
  if (subAssetType === 'SINGLE_BOND') {
    return 'Nation Code *';
  }
  if (NO_TICKER_REQUIRED.includes(subAssetType)) {
    return 'Reference (optional)';
  }
  return 'Ticker/Symbol *';
};

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ isOpen, onClose, onAdd }) => {
  const [assetClass, setAssetClass] = useState<AssetClass>('STOCKS');
  const [subAssetType, setSubAssetType] = useState<SubAssetType>('ETF');
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [isin, setIsin] = useState('');
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
    // Reset ISIN when changing asset class
    setIsin('');
  };

  const handleSubAssetTypeChange = (newType: SubAssetType) => {
    setSubAssetType(newType);
    // Reset ISIN and ticker when changing sub-type
    setIsin('');
    if (NO_TICKER_REQUIRED.includes(newType)) {
      setTicker('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter an asset name');
      return;
    }

    // Check if ticker is required
    const needsTicker = !NO_TICKER_REQUIRED.includes(subAssetType);
    if (needsTicker && !ticker.trim()) {
      alert(`Please enter a ${subAssetType === 'SINGLE_BOND' ? 'nation code' : 'ticker/symbol'}`);
      return;
    }

    // Check if ISIN is required
    if (ISIN_REQUIRED.includes(subAssetType) && !isin.trim()) {
      alert('Please enter an ISIN code');
      return;
    }

    // Generate a fallback ticker if not provided (for cash accounts/property that don't need ticker)
    // Uses first 4 chars of name + timestamp to ensure uniqueness
    const generatedTicker = ticker.trim().toUpperCase() || 
      `${name.trim().substring(0, 4).toUpperCase()}${Date.now().toString().slice(-4)}`;

    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: name.trim(),
      ticker: generatedTicker,
      isin: ISIN_REQUIRED.includes(subAssetType) ? isin.trim().toUpperCase() : undefined,
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
    setIsin('');
    setCurrentValue(0);
    setTargetPercent(0);
    onClose();
  };

  if (!isOpen) return null;

  const needsTicker = !NO_TICKER_REQUIRED.includes(subAssetType);
  const needsIsin = ISIN_REQUIRED.includes(subAssetType);

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div 
        className="dialog-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-header">
          <h3 id="dialog-title">➕ Add New Asset</h3>
          <button 
            className="dialog-close" 
            onClick={onClose}
            aria-label="Close dialog"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-class">Asset Class *</label>
              <select
                id="asset-class"
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
              <label htmlFor="asset-type">Type *</label>
              <select
                id="asset-type"
                value={subAssetType}
                onChange={(e) => handleSubAssetTypeChange(e.target.value as SubAssetType)}
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
            <label htmlFor="asset-name">Asset Name *</label>
            <input
              id="asset-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., S&P 500 Index Fund"
              className="dialog-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-ticker">{getTickerLabel(subAssetType)}</label>
              <input
                id="asset-ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder={subAssetType === 'SINGLE_BOND' ? 'e.g., US, DE, IT' : needsTicker ? 'e.g., SPY' : 'Optional'}
                className="dialog-input"
                required={needsTicker}
              />
            </div>

            {needsIsin && (
              <div className="form-group">
                <label htmlFor="asset-isin">ISIN Code *</label>
                <input
                  id="asset-isin"
                  type="text"
                  value={isin}
                  onChange={(e) => setIsin(e.target.value)}
                  placeholder="e.g., US78462F1030"
                  className="dialog-input"
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="asset-value">Current Value (EUR) *</label>
            <input
              id="asset-value"
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
              <label htmlFor="target-mode">Target Mode</label>
              <select
                id="target-mode"
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as AllocationMode)}
                className="dialog-select"
                disabled={!SET_MODE_ALLOWED.includes(subAssetType)}
                aria-disabled={!SET_MODE_ALLOWED.includes(subAssetType)}
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
                <label htmlFor="target-percent">Target % (of Asset Class) *</label>
                <input
                  id="target-percent"
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
