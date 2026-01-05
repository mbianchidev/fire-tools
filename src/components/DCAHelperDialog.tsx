import { useState } from 'react';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { 
  calculateDCAAllocation, 
  fetchAssetPrices, 
  calculateShares,
  formatShares,
  formatDCACurrency,
  DCACalculation,
  DCAAssetAllocation,
  confirmInvestment,
  formatDeviation,
  ConfirmedDCAAssetAllocation
} from '../utils/dcaCalculator';
import { formatAssetName } from '../utils/allocationCalculator';
import { formatDisplayPercent } from '../utils/numberFormatter';

// Constants for deviation feedback thresholds
const DEVIATION_CLOSE_THRESHOLD = 2; // Deviation <= 2% is considered "close"
const DEVIATION_FAR_THRESHOLD = 10; // Deviation > 10% is considered "far"

interface DCAHelperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
  currency: string;
  onConfirmInvestments?: (updates: Record<string, { valueIncrease: number }>) => void;
}

export const DCAHelperDialog: React.FC<DCAHelperDialogProps> = ({
  isOpen,
  onClose,
  assets,
  assetClassTargets,
  currency,
  onConfirmInvestments,
}) => {
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [calculation, setCalculation] = useState<DCACalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConfirmMode, setIsConfirmMode] = useState(false);
  const [confirmedAllocations, setConfirmedAllocations] = useState<Record<string, ConfirmedDCAAssetAllocation>>({});
  const [actualSharesInputs, setActualSharesInputs] = useState<Record<string, string>>({});
  const [actualAmountInputs, setActualAmountInputs] = useState<Record<string, string>>({});
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [hasShownPriceError, setHasShownPriceError] = useState(false);

  // Validate and parse input value
  const validateInput = (value: string): { isValid: boolean; parsedValue?: number; error?: string } => {
    if (!value || value.trim() === '') {
      return { isValid: false, error: 'Required' };
    }
    
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return { isValid: false, error: 'Invalid number' };
    }
    
    if (parsed < 0) {
      return { isValid: false, error: 'Must be positive' };
    }
    
    return { isValid: true, parsedValue: parsed };
  };

  const handleCalculate = async () => {
    const amount = parseFloat(investmentAmount);
    
    // Validate input
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid investment amount greater than 0');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Calculate DCA allocation
      const dcaCalc = calculateDCAAllocation(assets, amount, assetClassTargets);
      
      // Fetch current prices for all tickers
      const tickers = dcaCalc.allocations.map(a => a.ticker).filter(t => t && t.trim());
      const prices = await fetchAssetPrices(tickers);
      
      // Check if any prices were successfully fetched
      const successfulFetches = Object.values(prices).filter(p => p !== null).length;
      
      // Calculate shares based on prices
      const calcWithShares = calculateShares(dcaCalc, prices);
      
      setCalculation(calcWithShares);
      
      // Initialize actual inputs with suggested values
      const initialSharesInputs: Record<string, string> = {};
      const initialAmountInputs: Record<string, string> = {};
      calcWithShares.allocations.forEach(a => {
        initialSharesInputs[a.assetId] = a.shares !== undefined ? formatShares(a.shares) : '';
        initialAmountInputs[a.assetId] = a.investmentAmount.toFixed(2);
      });
      setActualSharesInputs(initialSharesInputs);
      setActualAmountInputs(initialAmountInputs);
      
      // Show a warning if no prices could be fetched (only first time)
      if (successfulFetches === 0 && tickers.length > 0 && !hasShownPriceError) {
        setError('Unable to fetch current prices from Yahoo Finance API. Price data may be unavailable due to network issues or API limitations. You can still see the investment amounts for each asset.');
        setHasShownPriceError(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate DCA allocation');
      console.error('DCA calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInvestmentAmount('');
    setCalculation(null);
    setError('');
    setIsConfirmMode(false);
    setConfirmedAllocations({});
    setActualSharesInputs({});
    setActualAmountInputs({});
    setInputErrors({});
    setHasShownPriceError(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Helper function for real-time deviation calculation
  const updateRealTimeDeviation = (
    assetId: string, 
    actualShares: number | undefined, 
    actualAmount: number | undefined
  ) => {
    if (!calculation) return;
    
    const allocation = calculation.allocations.find(a => a.assetId === assetId);
    if (!allocation) return;
    
    // For shares-based, we need price. For amount-based, we don't.
    if (actualShares !== undefined && (!allocation.currentPrice || allocation.priceError)) {
      return;
    }
    
    const value = actualShares ?? actualAmount;
    if (value !== undefined && !isNaN(value) && value >= 0) {
      const confirmed = confirmInvestment(allocation, actualShares, actualAmount);
      setConfirmedAllocations(prev => ({
        ...prev,
        [assetId]: { ...confirmed, isConfirmed: false }, // Keep unconfirmed but show deviation
      }));
    } else {
      // Clear invalid entries
      setConfirmedAllocations(prev => {
        const { [assetId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleActualSharesChange = (assetId: string, value: string) => {
    setActualSharesInputs(prev => ({
      ...prev,
      [assetId]: value,
    }));
    // Clear error when typing
    if (inputErrors[assetId]) {
      setInputErrors(prev => {
        const { [assetId]: _, ...rest } = prev;
        return rest;
      });
    }
    
    // Real-time deviation calculation
    const actualShares = parseFloat(value);
    updateRealTimeDeviation(assetId, actualShares, undefined);
  };

  const handleActualAmountChange = (assetId: string, value: string) => {
    setActualAmountInputs(prev => ({
      ...prev,
      [assetId]: value,
    }));
    // Clear error when typing
    if (inputErrors[assetId]) {
      setInputErrors(prev => {
        const { [assetId]: _, ...rest } = prev;
        return rest;
      });
    }
    
    // Real-time deviation calculation
    const actualAmount = parseFloat(value);
    updateRealTimeDeviation(assetId, undefined, actualAmount);
  };

  const handleConfirmInvestment = (allocation: DCAAssetAllocation) => {
    const hasPrice = allocation.currentPrice !== undefined && !allocation.priceError;
    
    if (hasPrice) {
      // Use shares-based confirmation when price is available
      const actualSharesStr = actualSharesInputs[allocation.assetId];
      const actualShares = parseFloat(actualSharesStr);
      
      if (isNaN(actualShares) || actualShares < 0) {
        setError(`Please enter a valid number of shares for ${allocation.assetName}`);
        return;
      }
      
      const confirmed = confirmInvestment(allocation, actualShares, undefined);
      setConfirmedAllocations(prev => ({
        ...prev,
        [allocation.assetId]: confirmed,
      }));
    } else {
      // Use amount-based confirmation when price is unavailable
      const actualAmountStr = actualAmountInputs[allocation.assetId];
      const actualAmount = parseFloat(actualAmountStr);
      
      if (isNaN(actualAmount) || actualAmount < 0) {
        setError(`Please enter a valid amount for ${allocation.assetName}`);
        return;
      }
      
      const confirmed = confirmInvestment(allocation, undefined, actualAmount);
      setConfirmedAllocations(prev => ({
        ...prev,
        [allocation.assetId]: confirmed,
      }));
    }
    setError('');
  };

  const handleConfirmAll = () => {
    if (!calculation) return;
    
    const newConfirmed: Record<string, ConfirmedDCAAssetAllocation> = {};
    const newErrors: Record<string, string> = {};
    let hasError = false;
    
    calculation.allocations.forEach(allocation => {
      const hasPrice = allocation.currentPrice !== undefined && !allocation.priceError;
      
      if (hasPrice) {
        // Use shares-based confirmation when price is available
        const actualSharesStr = actualSharesInputs[allocation.assetId];
        const validation = validateInput(actualSharesStr);
        
        if (!validation.isValid) {
          hasError = true;
          newErrors[allocation.assetId] = validation.error || 'Invalid';
          return;
        }
        
        newConfirmed[allocation.assetId] = confirmInvestment(allocation, validation.parsedValue!, undefined);
      } else {
        // Use amount-based confirmation when price is unavailable
        const actualAmountStr = actualAmountInputs[allocation.assetId];
        const validation = validateInput(actualAmountStr);
        
        if (!validation.isValid) {
          hasError = true;
          newErrors[allocation.assetId] = validation.error || 'Invalid';
          return;
        }
        
        newConfirmed[allocation.assetId] = confirmInvestment(allocation, undefined, validation.parsedValue!);
      }
    });
    
    if (hasError) {
      setInputErrors(newErrors);
      setError('Please enter valid amounts for all assets before confirming');
      return;
    }
    
    setConfirmedAllocations(newConfirmed);
    setInputErrors({});
    setError('');
    
    // Apply investments to portfolio automatically after confirm all
    if (onConfirmInvestments) {
      const updates: Record<string, { valueIncrease: number }> = {};
      calculation.allocations.forEach(allocation => {
        const confirmed = newConfirmed[allocation.assetId];
        if (confirmed?.deviation?.actualAmount !== undefined) {
          updates[allocation.assetId] = {
            valueIncrease: confirmed.deviation.actualAmount,
          };
        }
      });
      
      if (Object.keys(updates).length > 0) {
        onConfirmInvestments(updates);
      }
    }
  };

  const getDeviationClass = (status?: string) => {
    switch (status) {
      case 'exact': return 'deviation-exact';
      case 'over': return 'deviation-over';
      case 'under': return 'deviation-under';
      default: return '';
    }
  };

  const calculateTotalDeviation = () => {
    if (!calculation || Object.keys(confirmedAllocations).length === 0) return null;
    
    let totalSuggested = 0;
    let totalActual = 0;
    
    calculation.allocations.forEach(allocation => {
      const confirmed = confirmedAllocations[allocation.assetId];
      if (confirmed?.deviation?.actualAmount !== undefined) {
        totalSuggested += allocation.investmentAmount;
        totalActual += confirmed.deviation.actualAmount;
      }
    });
    
    if (totalSuggested === 0) return null;
    
    const deviationPercent = ((totalActual - totalSuggested) / totalSuggested) * 100;
    return {
      totalSuggested,
      totalActual,
      deviationPercent,
    };
  };

  if (!isOpen) return null;

  const totalDeviation = calculateTotalDeviation();
  const allConfirmed = calculation && 
    calculation.allocations.length > 0 && 
    Object.keys(confirmedAllocations).length === calculation.allocations.length;

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog-content dca-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>💰 DCA Investment Calculator</h2>
          <button className="dialog-close" onClick={handleClose}>×</button>
        </div>

        <div className="dialog-body">
          <p className="dialog-description">
            Calculate how to invest a lump sum according to your asset allocation targets.
            Enter an amount below to see the exact dollar and share breakdown for each asset.
          </p>

          {!calculation && (
            <div className="dca-input-section">
              <label htmlFor="investment-amount">Investment Amount ({currency}):</label>
              <div className="input-row">
                <input
                  id="investment-amount"
                  type="text"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount to invest"
                  disabled={isLoading}
                />
                <button 
                  className="action-btn primary-btn"
                  onClick={handleCalculate}
                  disabled={isLoading || !investmentAmount}
                >
                  {isLoading ? 'Calculating...' : 'Calculate'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {calculation && (
            <div className="dca-results">
              <div className="dca-summary">
                <h3>{allConfirmed ? 'Investment Summary' : isConfirmMode ? 'Confirm Your Investments' : 'Investment Breakdown'}</h3>
                <p>
                  <strong>Total Amount:</strong> {formatDCACurrency(calculation.totalAmount, currency)}
                </p>
                {isConfirmMode && !allConfirmed ? (
                  <p className="dca-note">
                    ✍️ Enter the actual shares you purchased to track how closely you followed the suggestion.
                  </p>
                ) : !isConfirmMode && (
                  <p className="dca-note">
                    💡 Prices fetched from Yahoo Finance API. 
                    {calculation.allocations.some(a => a.priceError) && (
                      <span className="warning-text"> Some prices could not be fetched.</span>
                    )}
                  </p>
                )}
              </div>

              <div className="dca-table-container">
                <table className="dca-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Class</th>
                      <th>Allocation</th>
                      <th>Amount</th>
                      <th>Price</th>
                      <th>Suggested</th>
                      {isConfirmMode && (
                        <>
                          <th>Actual</th>
                          <th>Deviation</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.allocations.map((allocation) => {
                      const confirmed = confirmedAllocations[allocation.assetId];
                      return (
                        <tr key={allocation.assetId} className={confirmed?.isConfirmed ? 'confirmed-row' : ''}>
                          <td>
                            <strong>{allocation.assetName}</strong>
                            <br />
                            <span className="ticker-label">{allocation.ticker || 'N/A'}</span>
                          </td>
                          <td>{formatAssetName(allocation.assetClass)}</td>
                          <td>{formatDisplayPercent(allocation.allocationPercent)}</td>
                          <td className="amount-cell">
                            {formatDCACurrency(allocation.investmentAmount, currency)}
                          </td>
                          <td className="price-cell">
                            {allocation.priceError ? (
                              <span className="error-text" title={allocation.priceError}>
                                N/A
                              </span>
                            ) : allocation.currentPrice ? (
                              formatDCACurrency(allocation.currentPrice, currency)
                            ) : (
                              <span className="loading-text">Loading...</span>
                            )}
                          </td>
                          <td className="shares-cell">
                            {allocation.priceError ? (
                              <span className="error-text">-</span>
                            ) : allocation.shares !== undefined ? (
                              <strong>{formatShares(allocation.shares)}</strong>
                            ) : (
                              <span className="loading-text">-</span>
                            )}
                          </td>
                          {isConfirmMode && (
                            <>
                              <td className="actual-shares-cell">
                                {confirmed?.isConfirmed ? (
                                  // Show confirmed value
                                  allocation.currentPrice && !allocation.priceError ? (
                                    <strong>{formatShares(confirmed.actualShares || 0)}</strong>
                                  ) : (
                                    <strong>{formatDCACurrency(confirmed.actualAmount || 0, currency)}</strong>
                                  )
                                ) : (
                                  // Show input field - shares if price available, amount otherwise
                                  allocation.currentPrice && !allocation.priceError ? (
                                    <div className="validated-input-wrapper actual-shares-input-group">
                                      <input
                                        type="text"
                                        className={`actual-shares-input ${inputErrors[allocation.assetId] ? 'input-error' : ''}`}
                                        value={actualSharesInputs[allocation.assetId] || ''}
                                        onChange={(e) => handleActualSharesChange(allocation.assetId, e.target.value)}
                                        placeholder="Shares"
                                        aria-label={`Actual shares for ${allocation.assetName}`}
                                      />
                                      {inputErrors[allocation.assetId] && (
                                        <div className="input-error-tooltip" role="alert">
                                          {inputErrors[allocation.assetId]}
                                        </div>
                                      )}
                                      <button
                                        className="confirm-single-btn"
                                        onClick={() => handleConfirmInvestment(allocation)}
                                        disabled={!actualSharesInputs[allocation.assetId]}
                                        aria-label={`Confirm ${allocation.assetName}`}
                                      >
                                        ✓
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="validated-input-wrapper actual-shares-input-group">
                                      <input
                                        type="text"
                                        className={`actual-amount-input ${inputErrors[allocation.assetId] ? 'input-error' : ''}`}
                                        value={actualAmountInputs[allocation.assetId] || ''}
                                        onChange={(e) => handleActualAmountChange(allocation.assetId, e.target.value)}
                                        placeholder={currency}
                                        aria-label={`Actual amount for ${allocation.assetName}`}
                                      />
                                      {inputErrors[allocation.assetId] && (
                                        <div className="input-error-tooltip" role="alert">
                                          {inputErrors[allocation.assetId]}
                                        </div>
                                      )}
                                      <button
                                        className="confirm-single-btn"
                                        onClick={() => handleConfirmInvestment(allocation)}
                                        disabled={!actualAmountInputs[allocation.assetId]}
                                        aria-label={`Confirm ${allocation.assetName}`}
                                      >
                                        ✓
                                      </button>
                                    </div>
                                  )
                                )}
                              </td>
                              <td className={`deviation-cell ${getDeviationClass(confirmed?.deviation?.status)}`}>
                                {confirmed?.deviation ? (
                                  <div className="deviation-display">
                                    <span className="deviation-percent">
                                      {formatDeviation(confirmed.deviation.deviationPercent)}
                                    </span>
                                    {confirmed.deviation.deviationAmount !== undefined && (
                                      <span className="deviation-amount">
                                        ({confirmed.deviation.deviationAmount >= 0 ? '+' : ''}{formatDCACurrency(confirmed.deviation.deviationAmount, currency)})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="pending-text">-</span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan={3}><strong>Total</strong></td>
                      <td className="amount-cell">
                        <strong>{formatDCACurrency(calculation.totalAllocated, currency)}</strong>
                      </td>
                      <td colSpan={2}></td>
                      {isConfirmMode && totalDeviation && (
                        <>
                          <td className="amount-cell">
                            <strong>{formatDCACurrency(totalDeviation.totalActual, currency)}</strong>
                          </td>
                          <td className={`deviation-cell ${totalDeviation.deviationPercent === 0 ? 'deviation-exact' : totalDeviation.deviationPercent > 0 ? 'deviation-over' : 'deviation-under'}`}>
                            <strong>{formatDeviation(totalDeviation.deviationPercent)}</strong>
                          </td>
                        </>
                      )}
                      {isConfirmMode && !totalDeviation && (
                        <>
                          <td></td>
                          <td></td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Confirmation Summary */}
              {allConfirmed && totalDeviation && (
                <div className={`confirmation-summary ${totalDeviation.deviationPercent === 0 ? 'exact' : Math.abs(totalDeviation.deviationPercent) <= DEVIATION_FAR_THRESHOLD / 2 ? 'close' : 'far'}`}>
                  <h4>📊 Investment Summary</h4>
                  <p>
                    <strong>Suggested Total:</strong> {formatDCACurrency(totalDeviation.totalSuggested, currency)}
                  </p>
                  <p>
                    <strong>Actual Total:</strong> {formatDCACurrency(totalDeviation.totalActual, currency)}
                  </p>
                  <p>
                    <strong>Overall Deviation:</strong>{' '}
                    <span className={getDeviationClass(totalDeviation.deviationPercent === 0 ? 'exact' : totalDeviation.deviationPercent > 0 ? 'over' : 'under')}>
                      {formatDeviation(totalDeviation.deviationPercent)}
                    </span>
                  </p>
                  {Math.abs(totalDeviation.deviationPercent) <= DEVIATION_CLOSE_THRESHOLD && (
                    <p className="success-message">✅ Great job! Your investments closely match the suggested allocation.</p>
                  )}
                  {Math.abs(totalDeviation.deviationPercent) > DEVIATION_CLOSE_THRESHOLD && Math.abs(totalDeviation.deviationPercent) <= DEVIATION_FAR_THRESHOLD && (
                    <p className="info-message">ℹ️ Your investments are reasonably close to the suggested allocation.</p>
                  )}
                  {Math.abs(totalDeviation.deviationPercent) > DEVIATION_FAR_THRESHOLD && (
                    <p className="warning-message">⚠️ Your investments deviate significantly from the suggestion. Consider adjusting future investments.</p>
                  )}
                </div>
              )}

              <div className="dca-actions">
                {!isConfirmMode ? (
                  <>
                    <button className="action-btn start-over-btn" onClick={handleReset}>
                      🔄 Start Over
                    </button>
                    <button 
                      className="action-btn primary-btn"
                      onClick={() => setIsConfirmMode(true)}
                    >
                      ✍️ Confirm Investments
                    </button>
                  </>
                ) : allConfirmed ? (
                  <>
                    <button className="action-btn primary-btn" onClick={handleReset}>
                      💰 Invest Again
                    </button>
                  </>
                ) : (
                  <>
                    <button className="action-btn back-btn" onClick={() => {
                      setIsConfirmMode(false);
                      setConfirmedAllocations({});
                      setInputErrors({});
                    }}>
                      ← Back to Suggestions
                    </button>
                    <button 
                      className="action-btn primary-btn"
                      onClick={handleConfirmAll}
                    >
                      ✓ Confirm All
                    </button>
                    <button className="action-btn start-over-btn" onClick={handleReset}>
                      🔄 Start Over
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {!calculation && !error && (
            <div className="dca-info">
              <h4>📊 How it works:</h4>
              <ul>
                <li>Enter the amount you want to invest</li>
                <li>The calculator will distribute it according to your asset allocation targets</li>
                <li>Current prices are fetched from Yahoo Finance API</li>
                <li>You'll see the exact number of shares (fractional) to buy for each asset</li>
                <li><strong>NEW:</strong> After investing, click "Confirm Investments" to record actual shares purchased and track deviations</li>
              </ul>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="action-btn" onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
