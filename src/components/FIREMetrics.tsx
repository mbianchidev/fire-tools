import { CalculationResult } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';
import { useState } from 'react';

interface FIREMetricsProps {
  result: CalculationResult;
  currentAge: number;
}

export const FIREMetrics: React.FC<FIREMetricsProps> = ({ result, currentAge }) => {
  const { yearsToFIRE, fireTarget, finalPortfolioValue } = result;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="fire-metrics">
      <div className="fire-metrics-header">
        <h3>🎯 FIRE Metrics</h3>
        <button className="share-button" onClick={handleShare}>
          {copied ? '✓ Copied!' : '🔗 Share'}
        </button>
      </div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">FIRE Target</div>
          <div className="metric-value">{formatCurrency(fireTarget)}</div>
        </div>
        
        <div className="metric-card highlight">
          <div className="metric-label">Years to FIRE</div>
          <div className="metric-value">
            {yearsToFIRE >= 0 ? `${yearsToFIRE} years` : 'Not achieved'}
          </div>
          {yearsToFIRE >= 0 && (
            <div className="metric-subtitle">
              At age {currentAge + yearsToFIRE}
            </div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-label">Final Portfolio Value</div>
          <div className="metric-value">{formatCurrency(finalPortfolioValue)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Current Age</div>
          <div className="metric-value">{currentAge} years</div>
        </div>
      </div>
    </div>
  );
};
