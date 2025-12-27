import { useState } from 'react';
import { CalculatorInputs, MonteCarloInputs, MonteCarloResult } from '../types/calculator';
import { runMonteCarloSimulation } from '../utils/monteCarlo';

interface MonteCarloSimulatorProps {
  inputs: CalculatorInputs;
}

export const MonteCarloSimulator: React.FC<MonteCarloSimulatorProps> = ({ inputs }) => {
  const [mcInputs, setMcInputs] = useState<MonteCarloInputs>({
    numSimulations: 1000,
    stockVolatility: 15,
    bondVolatility: 5,
    blackSwanProbability: 2,
    blackSwanImpact: -40,
  });

  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleInputChange = (field: keyof MonteCarloInputs, value: number) => {
    setMcInputs({ ...mcInputs, [field]: value });
  };

  const runSimulation = () => {
    setIsRunning(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const mcResult = runMonteCarloSimulation(inputs, mcInputs);
      setResult(mcResult);
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="monte-carlo-section">
      <h2>🎲 Monte Carlo Simulations</h2>
      <p className="section-description">
        Run multiple simulations with random market returns to assess the probability of reaching FIRE.
      </p>

      <div className="mc-inputs">
        <div className="form-group">
          <label htmlFor="num-simulations">Number of Simulations</label>
          <input
            id="num-simulations"
            type="number"
            value={mcInputs.numSimulations}
            onChange={(e) => handleInputChange('numSimulations', parseInt(e.target.value) || 100)}
            min="100"
            max="10000"
            step="100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock-volatility">Stock Volatility (% std dev)</label>
          <input
            id="stock-volatility"
            type="number"
            value={mcInputs.stockVolatility}
            onChange={(e) => handleInputChange('stockVolatility', parseFloat(e.target.value) || 0)}
            step="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="bond-volatility">Bond Volatility (% std dev)</label>
          <input
            id="bond-volatility"
            type="number"
            value={mcInputs.bondVolatility}
            onChange={(e) => handleInputChange('bondVolatility', parseFloat(e.target.value) || 0)}
            step="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="black-swan-probability">Black Swan Probability (% per year)</label>
          <input
            id="black-swan-probability"
            type="number"
            value={mcInputs.blackSwanProbability}
            onChange={(e) => handleInputChange('blackSwanProbability', parseFloat(e.target.value) || 0)}
            step="0.5"
            min="0"
            max="10"
          />
        </div>

        <div className="form-group">
          <label htmlFor="black-swan-impact">Black Swan Impact (%)</label>
          <input
            id="black-swan-impact"
            type="number"
            value={mcInputs.blackSwanImpact}
            onChange={(e) => handleInputChange('blackSwanImpact', parseFloat(e.target.value) || 0)}
            step="5"
          />
        </div>
      </div>

      <button 
        className="run-simulation-btn" 
        onClick={runSimulation}
        disabled={isRunning}
        aria-label={isRunning ? 'Running Monte Carlo simulations' : 'Run Monte Carlo simulations'}
      >
        {isRunning ? '⏳ Running Simulations...' : '▶️ Run Simulations'}
      </button>

      {result && (
        <div className="mc-results" role="region" aria-live="polite" aria-label="Monte Carlo simulation results">
          <h3>Simulation Results</h3>
          <div className="results-grid">
            <div className="result-card success">
              <div className="result-label">Success Rate</div>
              <div className="result-value" aria-label={`Success rate: ${result.successRate.toFixed(1)} percent`}>
                {result.successRate.toFixed(1)}%
              </div>
              <div className="result-subtitle">
                {result.successCount} / {result.successCount + result.failureCount} simulations
              </div>
            </div>

            <div className="result-card">
              <div className="result-label">Successful Simulations</div>
              <div className="result-value">{result.successCount}</div>
            </div>

            <div className="result-card failure">
              <div className="result-label">Failed Simulations</div>
              <div className="result-value">{result.failureCount}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Median Years to FIRE</div>
              <div className="result-value">
                {result.medianYearsToFIRE > 0 ? `${result.medianYearsToFIRE} years` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="success-bar" role="progressbar" aria-valuenow={result.successRate} aria-valuemin={0} aria-valuemax={100} aria-label={`Success rate progress bar: ${result.successRate.toFixed(1)}%`}>
            <div className="success-bar-fill" style={{ width: `${result.successRate}%` }}>
              {result.successRate > 10 && `${result.successRate.toFixed(1)}%`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
