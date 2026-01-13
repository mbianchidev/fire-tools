/**
 * Shared Asset Dialog Component
 * Used by both Asset Allocation Manager and Net Worth Tracker
 * Handles adding and editing assets with shares and price per share tracking
 */

import { useState, useEffect } from 'react';
import { Asset, AssetClass, SubAssetType, AllocationMode } from '../types/assetAllocation';
import { AssetHolding } from '../types/netWorthTracker';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../types/currency';
import { getUCITSWarning } from '../types/country';
import { BankInfo, getBanksByCountry, getBankByCode } from '../types/bank';
import { formatAssetName } from '../utils/allocationCalculator';
import { convertToEUR } from '../utils/currencyConverter';
import { loadSettings } from '../utils/cookieSettings';
import { MaterialIcon } from './MaterialIcon';

// Sub-types that should show bank/institution selector
const INSTITUTION_TYPES: SubAssetType[] = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT'];

interface SharedAssetDialogProps {
  mode: 'assetAllocation' | 'netWorthTracker';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void; // Asset or AssetHolding depending on mode
  initialData?: Asset | AssetHolding; // For editing
  defaultCurrency?: SupportedCurrency;
  isNameDuplicate?: (name: string) => boolean;
}

const SUB_ASSET_TYPES: Record<AssetClass, SubAssetType[]> = {
  STOCKS: ['ETF', 'SINGLE_STOCK', 'PRIVATE_EQUITY'],
  BONDS: ['ETF', 'SINGLE_BOND'],
  CASH: ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT', 'MONEY_ETF'],
  CRYPTO: ['COIN'],
  REAL_ESTATE: ['PROPERTY', 'REIT'],
};

// Sub-types that can use SET mode (Asset Allocation only)
const SET_MODE_ALLOWED: SubAssetType[] = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT', 'MONEY_ETF', 'PROPERTY'];

// Sub-types that require ISIN code (including MONEY_ETF now)
const ISIN_REQUIRED: SubAssetType[] = ['ETF', 'SINGLE_STOCK', 'SINGLE_BOND', 'REIT', 'MONEY_ETF'];

// Sub-types that don't need ticker (PRIVATE_EQUITY added - no ticker)
const NO_TICKER_REQUIRED: SubAssetType[] = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'BROKERAGE_ACCOUNT', 'PROPERTY', 'PRIVATE_EQUITY'];

// Sub-types that should show UCITS warning (only ETFs)
const UCITS_WARNING_TYPES: SubAssetType[] = ['ETF', 'MONEY_ETF'];

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

// Map Asset Allocation AssetClass to Net Worth Tracker assetClass
const mapToNetWorthAssetClass = (assetClass: AssetClass, subAssetType: SubAssetType): AssetHolding['assetClass'] => {
  if (assetClass === 'STOCKS') {
    if (subAssetType === 'PRIVATE_EQUITY') return 'PRIVATE_EQUITY';
    return 'STOCKS';
  }
  if (assetClass === 'BONDS') return 'BONDS';
  if (assetClass === 'REAL_ESTATE') {
    return subAssetType === 'REIT' ? 'ETF' : 'REAL_ESTATE';
  }
  if (assetClass === 'CRYPTO') return 'CRYPTO';
  if (assetClass === 'CASH') return 'OTHER'; // Cash as assets treated as OTHER
  return 'OTHER';
};

// Map Net Worth Tracker assetClass to Asset Allocation
const mapFromNetWorthAssetClass = (assetClass: AssetHolding['assetClass']): { assetClass: AssetClass, subAssetType: SubAssetType } => {
  if (assetClass === 'STOCKS') return { assetClass: 'STOCKS', subAssetType: 'ETF' };
  if (assetClass === 'BONDS') return { assetClass: 'BONDS', subAssetType: 'ETF' };
  if (assetClass === 'ETF') return { assetClass: 'STOCKS', subAssetType: 'ETF' };
  if (assetClass === 'CRYPTO') return { assetClass: 'CRYPTO', subAssetType: 'COIN' };
  if (assetClass === 'REAL_ESTATE') return { assetClass: 'REAL_ESTATE', subAssetType: 'PROPERTY' };
  if (assetClass === 'PRIVATE_EQUITY') return { assetClass: 'STOCKS', subAssetType: 'PRIVATE_EQUITY' };
  return { assetClass: 'STOCKS', subAssetType: 'ETF' };
};

export const SharedAssetDialog: React.FC<SharedAssetDialogProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultCurrency = 'EUR',
  isNameDuplicate,
}) => {
  // Determine if editing
  const isEditing = Boolean(initialData);
  
  // Initialize form state
  const [assetClass, setAssetClass] = useState<AssetClass>('STOCKS');
  const [subAssetType, setSubAssetType] = useState<SubAssetType>('ETF');
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [isin, setIsin] = useState('');
  const [shares, setShares] = useState<string>('1');
  const [pricePerShare, setPricePerShare] = useState<string>('');
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [targetMode, setTargetMode] = useState<AllocationMode>('PERCENTAGE');
  const [targetPercent, setTargetPercent] = useState<string>('0');
  const [note, setNote] = useState('');
  const [institutionCode, setInstitutionCode] = useState<string>('');
  const [institutionName, setInstitutionName] = useState<string>('');

  // Get fallback rates from settings
  const settings = loadSettings();

  // Get banks for the user's country
  const countryBanks: BankInfo[] = settings.country ? getBanksByCountry(settings.country) : [];

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      if (mode === 'assetAllocation') {
        const asset = initialData as Asset;
        setAssetClass(asset.assetClass);
        setSubAssetType(asset.subAssetType);
        setName(asset.name);
        setTicker(asset.ticker);
        setIsin(asset.isin || '');
        setShares(asset.shares?.toString() || '1');
        setPricePerShare(asset.pricePerShare?.toString() || '');
        setCurrency(asset.originalCurrency || 'EUR');
        setTargetMode(asset.targetMode);
        setTargetPercent(asset.targetPercent?.toString() || '0');
        setInstitutionCode(asset.institutionCode || '');
        setInstitutionName(asset.institutionName || '');
      } else {
        // Net Worth Tracker mode
        const holding = initialData as AssetHolding;
        const mapped = mapFromNetWorthAssetClass(holding.assetClass);
        setAssetClass(mapped.assetClass);
        setSubAssetType(mapped.subAssetType);
        setName(holding.name);
        setTicker(holding.ticker);
        setShares(holding.shares.toString());
        setPricePerShare(holding.pricePerShare.toString());
        setCurrency(holding.currency);
        setNote(holding.note || '');
        setInstitutionCode('');
        setInstitutionName('');
      }
    } else {
      // Reset for new entry
      setAssetClass('STOCKS');
      setSubAssetType('ETF');
      setName('');
      setTicker('');
      setIsin('');
      setShares('1');
      setPricePerShare('');
      setCurrency(defaultCurrency);
      setTargetMode('PERCENTAGE');
      setTargetPercent('0');
      setNote('');
      setInstitutionCode('');
      setInstitutionName('');
    }
  }, [initialData, mode, defaultCurrency]);

  // Computed current value
  const currentValue = (() => {
    const sharesNum = parseFloat(shares) || 0;
    const priceNum = parseFloat(pricePerShare) || 0;
    if (sharesNum > 0 && priceNum > 0) {
      return (sharesNum * priceNum).toFixed(2);
    }
    return '0';
  })();

  const handleAssetClassChange = (newClass: AssetClass) => {
    setAssetClass(newClass);
    const availableSubTypes = SUB_ASSET_TYPES[newClass];
    if (availableSubTypes.length > 0) {
      setSubAssetType(availableSubTypes[0]);
    }
    setIsin('');
    // Reset institution when changing asset class
    if (!INSTITUTION_TYPES.includes(SUB_ASSET_TYPES[newClass][0])) {
      setInstitutionCode('');
      setInstitutionName('');
    }
  };

  const handleSubAssetTypeChange = (newType: SubAssetType) => {
    setSubAssetType(newType);
    setIsin('');
    if (NO_TICKER_REQUIRED.includes(newType)) {
      setTicker('');
    }
    // Reset institution when changing to a type that doesn't need it
    if (!INSTITUTION_TYPES.includes(newType)) {
      setInstitutionCode('');
      setInstitutionName('');
    }
  };

  const handleInstitutionChange = (code: string) => {
    setInstitutionCode(code);
    if (code && code !== 'OTHER') {
      const bank = getBankByCode(code);
      if (bank) {
        setInstitutionName(bank.name);
      }
    } else if (code === 'OTHER') {
      setInstitutionName('');
    }
  };

  const handleSharesChange = (value: string) => {
    setShares(value);
  };

  const handlePricePerShareChange = (value: string) => {
    setPricePerShare(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter an asset name');
      return;
    }

    // Check duplicate name
    if (isNameDuplicate && isNameDuplicate(name.trim())) {
      alert('An asset with this name already exists');
      return;
    }

    // Check if ticker is required
    const needsTicker = !NO_TICKER_REQUIRED.includes(subAssetType);
    if (needsTicker && !ticker.trim()) {
      alert(`Please enter a ${subAssetType === 'SINGLE_BOND' ? 'nation code' : 'ticker/symbol'}`);
      return;
    }

    // Check if ISIN is required (now includes MONEY_ETF)
    if (ISIN_REQUIRED.includes(subAssetType) && !isin.trim()) {
      alert('Please enter an ISIN code');
      return;
    }

    // Shares and pricePerShare are required EXCEPT for cash accounts (not MONEY_ETF) in assetAllocation mode
    const isCashAccount = mode === 'assetAllocation' && assetClass === 'CASH' && subAssetType !== 'MONEY_ETF';
    
    if (!isCashAccount) {
      if (!shares.trim() || parseFloat(shares) <= 0) {
        alert('Please enter a valid number of shares');
        return;
      }
      if (!pricePerShare.trim() || parseFloat(pricePerShare) <= 0) {
        alert('Please enter a valid price per share');
        return;
      }
    }

    // Generate ticker if not provided
    const generatedTicker = ticker.trim().toUpperCase() || 
      `${name.trim().substring(0, 4).toUpperCase()}${Date.now().toString().slice(-4)}`;

    // Calculate value differently for cash accounts (not MONEY_ETF)
    const sharesNum = parseFloat(shares) || 1;
    const priceNum = parseFloat(pricePerShare) || 0;
    
    // For cash accounts (not MONEY_ETF) in Asset Allocation, value is directly entered (not shares × price)
    // Note: isCashAccount is already declared above in validation section
    const valueNum = isCashAccount && priceNum === 0 ? sharesNum : sharesNum * priceNum;

    // Convert to EUR if needed
    const valueInEUR = currency === 'EUR'
      ? valueNum
      : convertToEUR(valueNum, currency, settings.currencySettings.fallbackRates);

    if (mode === 'assetAllocation') {
      // Asset Allocation mode
      const asset: Omit<Asset, 'id'> & { id?: string } = {
        ...(initialData && { id: (initialData as Asset).id }),
        name: name.trim(),
        ticker: generatedTicker,
        isin: ISIN_REQUIRED.includes(subAssetType) ? isin.trim().toUpperCase() : undefined,
        assetClass,
        subAssetType,
        currentValue: valueInEUR,
        shares: sharesNum,
        pricePerShare: priceNum,
        originalCurrency: currency !== 'EUR' ? currency : undefined,
        originalValue: currency !== 'EUR' ? valueNum : undefined,
        targetMode,
        targetPercent: targetMode === 'PERCENTAGE' ? (parseFloat(targetPercent) || 0) : undefined,
        targetValue: targetMode === 'SET' ? valueInEUR : undefined,
        institutionCode: INSTITUTION_TYPES.includes(subAssetType) && institutionCode ? institutionCode : undefined,
        institutionName: INSTITUTION_TYPES.includes(subAssetType) && institutionName ? institutionName.trim() : undefined,
      };
      
      onSubmit(asset);
    } else {
      // Net Worth Tracker mode
      const holding: Omit<AssetHolding, 'id'> & { id?: string } = {
        ...(initialData && { id: (initialData as AssetHolding).id }),
        name: name.trim(),
        ticker: generatedTicker,
        shares: sharesNum,
        pricePerShare: priceNum,
        currency,
        assetClass: mapToNetWorthAssetClass(assetClass, subAssetType),
        note: note.trim() || undefined,
      };
      
      onSubmit(holding);
    }

    // Reset form
    setName('');
    setTicker('');
    setIsin('');
    setShares('1');
    setPricePerShare('');
    setCurrency(defaultCurrency);
    setTargetPercent('0');
    setNote('');
    setInstitutionCode('');
    setInstitutionName('');
    onClose();
  };

  if (!isOpen) return null;

  const needsTicker = !NO_TICKER_REQUIRED.includes(subAssetType);
  const needsIsin = ISIN_REQUIRED.includes(subAssetType);
  const showTargetSettings = mode === 'assetAllocation';
  const showInstitution = mode === 'assetAllocation' && INSTITUTION_TYPES.includes(subAssetType);
  
  // UCITS warning for EU users (only for ETFs)
  const showUcitsWarning = UCITS_WARNING_TYPES.includes(subAssetType);
  const ucitsWarning = showUcitsWarning && needsIsin ? getUCITSWarning(isin, settings.country) : null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>{isEditing ? 'Edit' : 'Add'} Asset</h3>
          <button className="dialog-close" onClick={onClose}><MaterialIcon name="close" size="small" /></button>
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

          {/* Bank/Institution selector for cash and brokerage accounts */}
          {showInstitution && (
            <div className="form-row">
              <div className="form-group">
                <label>
                  Bank/Institution{!settings.country && ' (Set country in Settings)'}
                </label>
                <select
                  value={institutionCode}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className="dialog-select"
                >
                  <option value="">Select Bank/Broker...</option>
                  {countryBanks.length > 0 ? (
                    <>
                      {countryBanks.map(bank => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                          {bank.supportsOpenBanking ? ' 🔗' : ''}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="" disabled>No banks available for your country</option>
                  )}
                  <option value="OTHER">Other (Custom Name)</option>
                </select>
                {institutionCode && getBankByCode(institutionCode)?.supportsOpenBanking && (
                  <div className="openbanking-info">
                    <MaterialIcon name="link" size="small" /> Supports OpenBanking PSD2
                  </div>
                )}
              </div>
              {institutionCode === 'OTHER' && (
                <div className="form-group">
                  <label>Institution Name *</label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g., Local Credit Union"
                    className="dialog-input"
                  />
                </div>
              )}
            </div>
          )}

          {/* Ticker/ISIN row - hide ticker for PRIVATE_EQUITY */}
          <div className="form-row">
            {subAssetType !== 'PRIVATE_EQUITY' && (
              <div className="form-group">
                <label>{getTickerLabel(subAssetType)}</label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder={needsTicker ? "e.g., SPY" : "Optional"}
                  className="dialog-input"
                />
              </div>
            )}

            {needsIsin && (
              <div className="form-group">
                <label>ISIN *</label>
                <input
                  type="text"
                  value={isin}
                  onChange={(e) => setIsin(e.target.value)}
                  placeholder="e.g., US78462F1030"
                  className="dialog-input"
                  required
                />
                {ucitsWarning && (
                  <div className="ucits-warning" role="alert">
                    <MaterialIcon name="warning" size="small" /> {ucitsWarning}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Only show shares and price fields for non-cash accounts or for MONEY_ETF */}
          {(assetClass !== 'CASH' || subAssetType === 'MONEY_ETF') && (
            <div className="form-row">
              <div className="form-group">
                <label>Number of Shares *</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => handleSharesChange(e.target.value)}
                  placeholder="e.g., 100"
                  className="dialog-input"
                  min="0"
                  step="any"
                  required
                />
              </div>

              <div className="form-group">
                <label>Price per Share *</label>
                <input
                  type="number"
                  value={pricePerShare}
                  onChange={(e) => handlePricePerShareChange(e.target.value)}
                  placeholder="e.g., 450.00"
                  className="dialog-input"
                  min="0"
                  step="any"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Current Value {(assetClass !== 'CASH' || subAssetType === 'MONEY_ETF') && mode === 'assetAllocation' ? '(Calculated)' : (mode === 'netWorthTracker' && (assetClass !== 'CASH' || subAssetType === 'MONEY_ETF')) ? '(Calculated)' : ''} *</label>
              <input
                type={(assetClass === 'CASH' && subAssetType !== 'MONEY_ETF' && mode === 'assetAllocation') ? 'number' : 'text'}
                value={currentValue}
                onChange={(assetClass === 'CASH' && subAssetType !== 'MONEY_ETF' && mode === 'assetAllocation') ? (e) => {
                  setShares(e.target.value);
                  setPricePerShare('1');
                } : undefined}
                className="dialog-input dialog-input-calculated"
                disabled={(assetClass !== 'CASH' || subAssetType === 'MONEY_ETF') || mode === 'netWorthTracker'}
                placeholder={(assetClass === 'CASH' && subAssetType !== 'MONEY_ETF' && mode === 'assetAllocation') ? 'Enter cash amount' : ''}
                min={(assetClass === 'CASH' && subAssetType !== 'MONEY_ETF' && mode === 'assetAllocation') ? '0' : undefined}
                step={(assetClass === 'CASH' && subAssetType !== 'MONEY_ETF' && mode === 'assetAllocation') ? 'any' : undefined}
                required
              />
            </div>

            <div className="form-group">
              <label>Currency *</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
                className="dialog-select"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.code}</option>
                ))}
              </select>
            </div>
          </div>

          {showTargetSettings && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Mode *</label>
                  <select
                    value={targetMode}
                    onChange={(e) => setTargetMode(e.target.value as AllocationMode)}
                    className="dialog-select"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    {SET_MODE_ALLOWED.includes(subAssetType) && (
                      <option value="SET">Fixed Amount</option>
                    )}
                    <option value="OFF">Off (Excluded)</option>
                  </select>
                </div>

                {targetMode === 'PERCENTAGE' && (
                  <div className="form-group">
                    <label>Target % (within asset class) *</label>
                    <input
                      type="number"
                      value={targetPercent}
                      onChange={(e) => setTargetPercent(e.target.value)}
                      placeholder="e.g., 50"
                      className="dialog-input"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'netWorthTracker' && (
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any notes about this asset..."
                className="dialog-input"
                rows={2}
              />
            </div>
          )}

          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {isEditing ? 'Update' : mode === 'assetAllocation' ? 'Add' : 'Log'} Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
