import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CalculationResult, CalculatorInputs } from '../types/calculator';
import { DEFAULT_INPUTS } from '../utils/defaults';
import { calculateFIRE } from '../utils/fireCalculator';
import { loadFireCalculatorInputs, loadAssetAllocation } from '../utils/cookieStorage';
import { MonteCarloSimulator } from './MonteCarloSimulator';

export const MonteCarloPage: React.FC = () => {
  const location = useLocation();
  
  // Load inputs from location state, cookies, or defaults.
  // Uses location.key as dependency to reload inputs when navigating back to this page.
  // ESLint warning suppressed because location.key is intentionally used instead of
  // location.state?.inputs - we want to reload from cookies on every navigation,
  // not just when location.state changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const baseInputs = useMemo<CalculatorInputs>(() => {
    return location.state?.inputs || loadFireCalculatorInputs() || DEFAULT_INPUTS;
  }, [location.key]);
  
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Load asset allocation data for use when useAssetAllocationValue is enabled.
  // Uses location.key as dependency to reload data when navigating back to this page.
  // ESLint warning suppressed because location.key is intentionally used to trigger
  // reload from cookies on every navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const assetAllocationData = useMemo(() => {
    const saved = loadAssetAllocation();
    if (!saved.assets || saved.assets.length === 0) {
      return undefined;
    }
    
    // Calculate total portfolio value (all assets including cash)
    const totalValue = saved.assets
      .filter(a => a.targetMode !== 'OFF')
      .reduce((sum, a) => sum + a.currentValue, 0);
    
    if (totalValue === 0) {
      return undefined;
    }
    
    // Calculate percentage for each major asset class
    const stocksValue = saved.assets
      .filter(a => a.assetClass === 'STOCKS' && a.targetMode !== 'OFF')
      .reduce((sum, a) => sum + a.currentValue, 0);
    const bondsValue = saved.assets
      .filter(a => a.assetClass === 'BONDS' && a.targetMode !== 'OFF')
      .reduce((sum, a) => sum + a.currentValue, 0);
    const cashValue = saved.assets
      .filter(a => a.assetClass === 'CASH' && a.targetMode !== 'OFF')
      .reduce((sum, a) => sum + a.currentValue, 0);
    
    return {
      totalValue,
      stocksPercent: (stocksValue / totalValue) * 100,
      bondsPercent: (bondsValue / totalValue) * 100,
      cashPercent: (cashValue / totalValue) * 100,
    };
  }, [location.key]);

  // Apply asset allocation data if useAssetAllocationValue is enabled
  const inputs: CalculatorInputs = useMemo(() => {
    if (baseInputs.useAssetAllocationValue && assetAllocationData) {
      return {
        ...baseInputs,
        initialSavings: assetAllocationData.totalValue,
        stocksPercent: assetAllocationData.stocksPercent,
        bondsPercent: assetAllocationData.bondsPercent,
        cashPercent: assetAllocationData.cashPercent,
      };
    }
    return baseInputs;
  }, [baseInputs, assetAllocationData]);

  useEffect(() => {
    const calculationResult = calculateFIRE(inputs);
    setResult(calculationResult);
  }, [inputs]);

  const hasValidationErrors = result?.validationErrors && result.validationErrors.length > 0;

  return (
    <div className="app-container monte-carlo-container">
      <main className="main-content" id="main-content">
        <header className="page-header">
          <h2><span aria-hidden="true" className="page-header-emoji">🎲</span> Monte Carlo Simulations</h2>
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
