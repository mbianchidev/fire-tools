import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CalculatorInputs, CalculationResult } from './types/calculator';
import { DEFAULT_INPUTS } from './utils/defaults';
import { calculateFIRE } from './utils/fireCalculator';
import { CalculatorInputsForm } from './components/CalculatorInputsForm';
import { IncomeExpensesChart } from './components/IncomeExpensesChart';
import { NetWorthChart } from './components/NetWorthChart';
import { FIREMetrics } from './components/FIREMetrics';
import { MonteCarloSimulator } from './components/MonteCarloSimulator';
import { AssetAllocationPage } from './components/AssetAllocationPage';
import { HomePage } from './components/HomePage';
import './App.css';
import './components/AssetAllocationManager.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="app-nav">
      <Link 
        to="/" 
        className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
      >
        🏠 Home
      </Link>
      <Link 
        to="/fire-calculator" 
        className={`nav-link ${location.pathname === '/fire-calculator' ? 'active' : ''}`}
      >
        🔥 FIRE Calculator
      </Link>
      <Link 
        to="/asset-allocation" 
        className={`nav-link ${location.pathname === '/asset-allocation' ? 'active' : ''}`}
      >
        📊 Asset Allocation
      </Link>
    </nav>
  );
}

function FIRECalculatorPage() {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const calculationResult = calculateFIRE(inputs);
    setResult(calculationResult);
  }, [inputs]);

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - inputs.yearOfBirth;
  
  const hasValidationErrors = result?.validationErrors && result.validationErrors.length > 0;

  return (
    <div className="app-container">
      <div className="sidebar">
        <CalculatorInputsForm inputs={inputs} onChange={setInputs} />
      </div>

      <div className="main-content">
        {hasValidationErrors && (
          <div className="validation-error-banner">
            <strong>⚠️ Validation Error</strong>
            {result.validationErrors?.map((error, index) => (
              <div key={index} className="validation-error-message">{error}</div>
            ))}
          </div>
        )}
        
        {result && !hasValidationErrors && (
          <>
            <FIREMetrics result={result} currentAge={currentAge} />
            
            <div className="charts-section">
              <NetWorthChart projections={result.projections} fireTarget={result.fireTarget} />
              <IncomeExpensesChart projections={result.projections} />
            </div>

            <div className="separator" />

            <MonteCarloSimulator inputs={inputs} />
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  // Use base path only in production (for GitHub Pages), not in local development
  const basename = import.meta.env.MODE === 'production' ? '/fire-tools' : '/';
  
  return (
    <Router basename={basename}>
      <div className="app">
        <header className="app-header">
          <h1>🔥 Fire Tools</h1>
          <p>Financial Independence Retire Early - Plan Your Path to Freedom</p>
        </header>

        <Navigation />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/fire-calculator" element={<FIRECalculatorPage />} />
          <Route path="/asset-allocation" element={<AssetAllocationPage />} />
        </Routes>

        <footer className="app-footer">
          <p>
            Fire Tools - Disclaimer: This is for educational purposes only. 
            Consult with a financial advisor for professional advice.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
