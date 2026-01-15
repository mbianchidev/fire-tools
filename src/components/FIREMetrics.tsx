import { CalculationResult } from '../types/calculator';
import { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { PrivacyBlur } from './PrivacyBlur';
import { AbbreviatedValue } from './AbbreviatedValue';

interface FIREMetricsProps {
  result: CalculationResult;
  currentAge: number;
  zoomYears: number | 'all';
  isPrivacyMode?: boolean;
  onTogglePrivacyMode?: () => void;
}

export const FIREMetrics: React.FC<FIREMetricsProps> = ({ 
  result, 
  currentAge, 
  zoomYears,
  isPrivacyMode = false,
  onTogglePrivacyMode
}) => {
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
        <h3 id="fire-metrics-heading"><MaterialIcon name="gps_fixed" /> FIRE Metrics</h3>
        <button 
          className="share-button" 
          onClick={handleShare}
          aria-label={copied ? 'Link copied to clipboard' : 'Copy link to share this calculation'}
        >
          {copied ? <MaterialIcon name="check" /> : copyFailed ? <MaterialIcon name="close" /> : <MaterialIcon name="link" />} {copied ? 'Copied!' : copyFailed ? 'Failed' : 'Share'}
        </button>
      </div>
      <div className="metrics-grid" role="list">
        <div className="metric-card" role="listitem">
          <div className="metric-header">
            <span className="metric-label">FIRE Target</span>
            {onTogglePrivacyMode && (
              <button 
                className="privacy-eye-btn metric-privacy-btn"
                onClick={onTogglePrivacyMode}
                title={isPrivacyMode ? 'Show values' : 'Hide values'}
                aria-pressed={isPrivacyMode}
              >
                <MaterialIcon name={isPrivacyMode ? 'visibility_off' : 'visibility'} size="small" />
              </button>
            )}
          </div>
          <div className="metric-value"><PrivacyBlur isPrivacyMode={isPrivacyMode}>{hasErrors ? 'N/A' : <AbbreviatedValue value={fireTarget} />}</PrivacyBlur></div>
          <div className="metric-subtitle">for standard FIRE</div>
        </div>
        
        <div className="metric-card highlight" role="listitem">
          <div className="metric-header">
            <span className="metric-label">Years to FIRE</span>
          </div>
          <div className="metric-value">
            {hasErrors ? 'N/A' : yearsToFIRE >= 0 ? yearsToFIRE : 'N/A'}
          </div>
          {!hasErrors && yearsToFIRE >= 0 && (
            <div className="metric-subtitle">At age {currentAge + yearsToFIRE}</div>
          )}
        </div>

        <div className="metric-card" role="listitem">
          <div className="metric-header">
            <span className="metric-label">Portfolio Value</span>
          </div>
          <div className="metric-value"><PrivacyBlur isPrivacyMode={isPrivacyMode}>{hasErrors ? 'N/A' : <AbbreviatedValue value={displayedFinalPortfolioValue} />}</PrivacyBlur></div>
          <div className="metric-subtitle">At age {displayedEndAge}</div>
        </div>

        <div className="metric-card highlight" role="listitem">
          <div className="metric-header">
            <span className="metric-label">Current Age</span>
          </div>
          <div className="metric-value">{currentAge}</div>
          <div className="metric-subtitle">years</div>
        </div>
      </div>
    </section>
  );
};
