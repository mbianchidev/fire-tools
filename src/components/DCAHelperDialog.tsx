import { useState } from 'react';
import { Asset, AssetClass, AllocationMode } from '../types/assetAllocation';
import { 
  calculateDCAAllocation, 
  fetchAssetPrices, 
  calculateShares,
  formatShares,
  formatDCACurrency,
  DCACalculation 
} from '../utils/dcaCalculator';
import { formatAssetName } from '../utils/allocationCalculator';

interface DCAHelperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  assetClassTargets: Record<AssetClass, { targetMode: AllocationMode; targetPercent?: number }>;
  currency: string;
}

export const DCAHelperDialog: React.FC<DCAHelperDialogProps> = ({
  isOpen,
  onClose,
  assets,
  assetClassTargets,
  currency,
}) => {
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [calculation, setCalculation] = useState<DCACalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

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
      
      // Show a warning if no prices could be fetched
      if (successfulFetches === 0 && tickers.length > 0) {
        setError('Unable to fetch current prices from Yahoo Finance API. Price data may be unavailable due to network issues or API limitations. You can still see the investment amounts for each asset.');
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
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

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

          {error && (
            <div className="error-message">
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {calculation && (
            <div className="dca-results">
              <div className="dca-summary">
                <h3>Investment Breakdown</h3>
                <p>
                  <strong>Total Amount:</strong> {formatDCACurrency(calculation.totalAmount, currency)}
                </p>
                <p className="dca-note">
                  💡 Prices fetched from Yahoo Finance API. 
                  {calculation.allocations.some(a => a.priceError) && (
                    <span className="warning-text"> Some prices could not be fetched.</span>
                  )}
                </p>
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
                      <th>Shares</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.allocations.map((allocation) => (
                      <tr key={allocation.assetId}>
                        <td>
                          <strong>{allocation.assetName}</strong>
                          <br />
                          <span className="ticker-label">{allocation.ticker || 'N/A'}</span>
                        </td>
                        <td>{formatAssetName(allocation.assetClass)}</td>
                        <td>{allocation.allocationPercent.toFixed(2)}%</td>
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
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan={3}><strong>Total</strong></td>
                      <td className="amount-cell">
                        <strong>{formatDCACurrency(calculation.totalAllocated, currency)}</strong>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="dca-actions">
                <button className="action-btn reset-btn" onClick={handleReset}>
                  Reset
                </button>
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
