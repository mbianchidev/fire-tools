import { CalculationResult } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';
import { useState } from 'react';

interface FIREMetricsProps {
  result: CalculationResult;
  currentAge: number;
  zoomYears: number | 'all';
}

export const FIREMetrics: React.FC<FIREMetricsProps> = ({ result, currentAge, zoomYears }) => {
  const { yearsToFIRE, fireTarget, validationErrors, projections } = result;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  
  const hasErrors = validationErrors && validationErrors.length > 0;

  // Calculate final portfolio value based on zoom level
  const getDisplayedFinalPortfolioValue = () => {
    if (hasErrors || projections.length === 0) return 0;
    
    if (zoomYears === 'all') {
      return projections[projections.length - 1]?.portfolioValue || 0;
    }
    
    // Find the projection at or before the zoomed age in a single pass
    const targetAge = currentAge + zoomYears;
    let lastValidProjection = projections[0];
    
    for (const projection of projections) {
      if (projection.age === targetAge) {
        return projection.portfolioValue;
      }
      if (projection.age <= targetAge) {
        lastValidProjection = projection;
      } else {
        break; // Projections are ordered by age, so we can stop early
      }
    }
    
    return lastValidProjection?.portfolioValue || 0;
  };

  const displayedFinalPortfolioValue = getDisplayedFinalPortfolioValue();
  const displayedEndAge = zoomYears === 'all' 
    ? projections[projections.length - 1]?.age 
    : Math.min(currentAge + zoomYears, projections[projections.length - 1]?.age || currentAge);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 3000);
    }
  };

  return (
    <section className="fire-metrics" aria-labelledby="fire-metrics-heading" data-tour="results-section">
      <div className="fire-metrics-header">
        <h3 id="fire-metrics-heading"><span aria-hidden="true">🎯</span> FIRE Metrics</h3>
        <button 
          className="share-button" 
          onClick={handleShare}
          aria-label={copied ? 'Link copied to clipboard' : 'Copy link to share this calculation'}
        >
          <span aria-hidden="true">{copied ? '✓' : copyFailed ? '✗' : '🔗'}</span> {copied ? 'Copied!' : copyFailed ? 'Failed' : 'Share'}
        </button>
      </div>
      <div className="metrics-grid" role="list">
        <div className="metric-card" role="listitem">
          <div className="metric-label">FIRE Target</div>
          <div className="metric-value">{hasErrors ? 'N/A' : formatCurrency(fireTarget)}</div>
        </div>
        
        <div className="metric-card highlight" role="listitem">
          <div className="metric-label">Years to FIRE</div>
          <div className="metric-value">
            {hasErrors ? 'N/A' : yearsToFIRE >= 0 ? `${yearsToFIRE} years` : 'Not achieved'}
          </div>
          {!hasErrors && yearsToFIRE >= 0 && (
            <div className="metric-subtitle">
              At age {currentAge + yearsToFIRE}
            </div>
          )}
        </div>

        <div className="metric-card" role="listitem">
          <div className="metric-label">Portfolio Value at Age {displayedEndAge}</div>
          <div className="metric-value">{hasErrors ? 'N/A' : formatCurrency(displayedFinalPortfolioValue)}</div>
        </div>

        <div className="metric-card highlight" role="listitem">
          <div className="metric-label">Current Age</div>
          <div className="metric-value">{currentAge} years</div>
        </div>
      </div>
    </section>
  );
};
