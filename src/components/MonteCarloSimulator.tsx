import { useState } from 'react';
import { CalculatorInputs, MonteCarloInputs, MonteCarloResult } from '../types/calculator';
import { runMonteCarloSimulation } from '../utils/monteCarlo';
import { NumberInput } from './NumberInput';

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
          <label>Number of Simulations</label>
          <NumberInput
            value={mcInputs.numSimulations}
            onChange={(value) => handleInputChange('numSimulations', value)}
            allowDecimals={false}
          />
        </div>

        <div className="form-group">
          <label>Stock Volatility (% std dev)</label>
          <NumberInput
            value={mcInputs.stockVolatility}
            onChange={(value) => handleInputChange('stockVolatility', value)}
          />
        </div>

        <div className="form-group">
          <label>Bond Volatility (% std dev)</label>
          <NumberInput
            value={mcInputs.bondVolatility}
            onChange={(value) => handleInputChange('bondVolatility', value)}
          />
        </div>

        <div className="form-group">
          <label>Black Swan Probability (% per year)</label>
          <NumberInput
            value={mcInputs.blackSwanProbability}
            onChange={(value) => handleInputChange('blackSwanProbability', value)}
          />
        </div>

        <div className="form-group">
          <label>Black Swan Impact (%)</label>
          <NumberInput
            value={mcInputs.blackSwanImpact}
            onChange={(value) => handleInputChange('blackSwanImpact', value)}
          />
        </div>
      </div>

      <button 
        className="run-simulation-btn" 
        onClick={runSimulation}
        disabled={isRunning}
      >
        {isRunning ? '⏳ Running Simulations...' : '▶️ Run Simulations'}
      </button>

      {result && (
        <div className="mc-results">
          <h3>Simulation Results</h3>
          <div className="results-grid">
            <div className="result-card success">
              <div className="result-label">Success Rate</div>
              <div className="result-value">{result.successRate.toFixed(2)}%</div>
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

          <div className="success-bar">
            <div className="success-bar-fill" style={{ width: `${result.successRate}%` }}>
              {result.successRate > 10 && `${result.successRate.toFixed(2)}%`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
