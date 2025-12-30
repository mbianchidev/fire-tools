import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CalculationResult } from '../types/calculator';
import { DEFAULT_INPUTS } from '../utils/defaults';
import { calculateFIRE } from '../utils/fireCalculator';
import { MonteCarloSimulator } from './MonteCarloSimulator';

export const MonteCarloPage: React.FC = () => {
  const location = useLocation();
  const inputs = location.state?.inputs || DEFAULT_INPUTS;
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const calculationResult = calculateFIRE(inputs);
    setResult(calculationResult);
  }, [inputs]);

  const hasValidationErrors = result?.validationErrors && result.validationErrors.length > 0;

  return (
    <div className="app-container monte-carlo-container">
      <main className="main-content" id="main-content">
        <header className="page-header">
          <h2><span aria-hidden="true">🎲</span> Monte Carlo Simulations</h2>
          <p className="page-description">
            Run multiple simulations with random market returns to assess the probability of reaching FIRE.
            This helps you understand the range of potential outcomes and the likelihood of success under different market conditions.
          </p>
        </header>

        {hasValidationErrors && (
          <div className="validation-error-banner" role="alert" aria-live="polite">
            <strong><span aria-hidden="true">⚠️</span> Validation Error</strong>
            {result.validationErrors?.map((error, index) => (
              <div key={index} className="validation-error-message">{error}</div>
            ))}
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Please return to the FIRE Calculator to fix these issues.
            </p>
          </div>
        )}

        {result && !hasValidationErrors && (
          <MonteCarloSimulator inputs={inputs} />
        )}
      </main>
    </div>
  );
};
