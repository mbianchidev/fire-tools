import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CalculatorInputs, CalculationResult } from './types/calculator';
import { DEFAULT_INPUTS } from './utils/defaults';
import { calculateFIRE } from './utils/fireCalculator';
import { CalculatorInputsForm } from './components/CalculatorInputsForm';
import { IncomeExpensesChart } from './components/IncomeExpensesChart';
import { NetWorthChart } from './components/NetWorthChart';
import { FIREMetrics } from './components/FIREMetrics';
import { MonteCarloPage } from './components/MonteCarloPage';
import { AssetAllocationPage } from './components/AssetAllocationPage';
import { HomePage } from './components/HomePage';
import { serializeInputsToURL, deserializeInputsFromURL, hasURLParams } from './utils/urlParams';
import './App.css';
import './components/AssetAllocationManager.css';

function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  
  return (
    <nav className="app-nav" aria-label="Main navigation">
      <button className="nav-toggle" onClick={toggleMenu} aria-label="Toggle navigation">
        {isOpen ? '✕' : '☰'}
      </button>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          onClick={closeMenu}
          aria-current={location.pathname === '/' ? 'page' : undefined}
        >
          🏠 Home
        </Link>
        <Link 
          to="/fire-calculator" 
          className={`nav-link ${location.pathname === '/fire-calculator' ? 'active' : ''}`}
        >
          <span aria-hidden="true">🔥</span> FIRE Calculator
        </Link>
        <Link 
          to="/monte-carlo" 
          className={`nav-link ${location.pathname === '/monte-carlo' ? 'active' : ''}`}
          onClick={closeMenu}
          aria-current={location.pathname === '/monte-carlo' ? 'page' : undefined}
        >
          <span aria-hidden="true">🎲</span> Monte Carlo
        </Link>
        <Link 
          to="/asset-allocation" 
          className={`nav-link ${location.pathname === '/asset-allocation' ? 'active' : ''}`}
          onClick={closeMenu}
          aria-current={location.pathname === '/asset-allocation' ? 'page' : undefined}
        >
          <span aria-hidden="true">📊</span> Asset Allocation
        </Link>
      </div>
    </nav>
  );
}

function FIRECalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL if parameters exist, otherwise use defaults
  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    if (hasURLParams(searchParams)) {
      return deserializeInputsFromURL(searchParams);
    }
    return DEFAULT_INPUTS;
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Update URL when inputs change
  useEffect(() => {
    const params = serializeInputsToURL(inputs);
    setSearchParams(params, { replace: true });
  }, [inputs, setSearchParams]);

  useEffect(() => {
    const calculationResult = calculateFIRE(inputs);
    setResult(calculationResult);
  }, [inputs]);

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - inputs.yearOfBirth;
  
  const hasValidationErrors = result?.validationErrors && result.validationErrors.length > 0;

  return (
    <div className="app-container">
      <aside className="sidebar" role="complementary" aria-label="Calculator input controls">
        <CalculatorInputsForm inputs={inputs} onChange={setInputs} />
      </aside>

      <main className="main-content" id="main-content">
        {hasValidationErrors && (
          <div className="validation-error-banner" role="alert" aria-live="assertive">
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
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  // Use base path only in production (for GitHub Pages), not in local development
  const basename = import.meta.env.MODE === 'production' ? '/fire-tools' : '/';
  
  return (
    <Router basename={basename}>
      <div className="app">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        
        <header className="app-header">
          <h1>🔥 Fire Tools</h1>
          <p>Financial Independence Retire Early - Plan Your Path to Freedom</p>
        </header>

        <Navigation />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/fire-calculator" element={<FIRECalculatorPage />} />
          <Route path="/monte-carlo" element={<MonteCarloPage />} />
          <Route path="/asset-allocation" element={<AssetAllocationPage />} />
        </Routes>

        <footer className="app-footer" role="contentinfo">
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
