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
    <section className="monte-carlo-section" aria-labelledby="monte-carlo-heading">
      <h2 id="monte-carlo-heading"><span aria-hidden="true">🎲</span> Monte Carlo Simulations</h2>
      <p className="section-description">
        Run multiple simulations with random market returns to assess the probability of reaching FIRE.
      </p>

      <div className="mc-inputs">
        <div className="form-group">
          <label htmlFor="num-simulations">Number of Simulations</label>
          <NumberInput
            id="num-simulations"
            value={mcInputs.numSimulations}
            onChange={(value) => handleInputChange('numSimulations', value)}
            allowDecimals={false}
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock-volatility">Stock Volatility (% std dev)</label>
          <NumberInput
            id="stock-volatility"
            value={mcInputs.stockVolatility}
            onChange={(value) => handleInputChange('stockVolatility', value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="bond-volatility">Bond Volatility (% std dev)</label>
          <NumberInput
            id="bond-volatility"
            value={mcInputs.bondVolatility}
            onChange={(value) => handleInputChange('bondVolatility', value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="black-swan-prob">Black Swan Probability (% per year)</label>
          <NumberInput
            id="black-swan-prob"
            value={mcInputs.blackSwanProbability}
            onChange={(value) => handleInputChange('blackSwanProbability', value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="black-swan-impact">Black Swan Impact (%)</label>
          <NumberInput
            id="black-swan-impact"
            value={mcInputs.blackSwanImpact}
            onChange={(value) => handleInputChange('blackSwanImpact', value)}
          />
        </div>
      </div>

      <button 
        className="run-simulation-btn" 
        onClick={runSimulation}
        disabled={isRunning}
        aria-label={isRunning ? 'Running simulations, please wait' : 'Run Monte Carlo simulations'}
      >
        <span aria-hidden="true">{isRunning ? '⏳' : '▶️'}</span> {isRunning ? 'Running Simulations...' : 'Run Simulations'}
      </button>

      {result && (
        <div className="mc-results" role="region" aria-labelledby="simulation-results-heading" aria-live="polite">
          <h3 id="simulation-results-heading">Simulation Results</h3>
          <div className="results-grid" role="list">
            <div className="result-card success" role="listitem">
              <div className="result-label">Success Rate</div>
              <div className="result-value">{result.successRate.toFixed(2)}%</div>
              <div className="result-subtitle">
                {result.successCount} / {result.successCount + result.failureCount} simulations
              </div>
            </div>

            <div className="result-card" role="listitem">
              <div className="result-label">Successful Simulations</div>
              <div className="result-value">{result.successCount}</div>
            </div>

            <div className="result-card failure" role="listitem">
              <div className="result-label">Failed Simulations</div>
              <div className="result-value">{result.failureCount}</div>
            </div>

            <div className="result-card" role="listitem">
              <div className="result-label">Median Years to FIRE</div>
              <div className="result-value">
                {result.medianYearsToFIRE > 0 ? `${result.medianYearsToFIRE} years` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="success-bar" role="progressbar" aria-valuenow={result.successRate} aria-valuemin={0} aria-valuemax={100} aria-label={`Success rate: ${result.successRate.toFixed(2)}%`}>
            <div className="success-bar-fill" style={{ width: `${result.successRate}%` }}>
              {result.successRate > 10 && `${result.successRate.toFixed(2)}%`}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
