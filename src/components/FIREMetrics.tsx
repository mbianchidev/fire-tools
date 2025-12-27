import { CalculationResult } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';

interface FIREMetricsProps {
  result: CalculationResult;
  currentAge: number;
}

export const FIREMetrics: React.FC<FIREMetricsProps> = ({ result, currentAge }) => {
  const { yearsToFIRE, fireTarget, finalPortfolioValue } = result;

  return (
    <div className="fire-metrics">
      <h3>🎯 FIRE Metrics</h3>
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
