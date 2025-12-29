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
import { DataManagement } from './components/DataManagement';
import { serializeInputsToURL, deserializeInputsFromURL, hasURLParams } from './utils/urlParams';
import { saveFireCalculatorInputs, loadFireCalculatorInputs, clearAllData } from './utils/localStorage';
import { exportFireCalculatorToCSV, importFireCalculatorFromCSV } from './utils/csvExport';
import './App.css';
import './components/AssetAllocationManager.css';

function Navigation() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);
  
  return (
    <nav className="app-nav">
      <button className="nav-toggle" onClick={toggleMenu} aria-label="Toggle navigation">
        {isOpen ? '✕' : '☰'}
      </button>
      <div className={`nav-links ${isOpen ? 'open' : ''}`}>
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
          to="/monte-carlo" 
          className={`nav-link ${location.pathname === '/monte-carlo' ? 'active' : ''}`}
          onClick={closeMenu}
        >
          🎲 Monte Carlo
        </Link>
        <Link 
          to="/asset-allocation" 
          className={`nav-link ${location.pathname === '/asset-allocation' ? 'active' : ''}`}
          onClick={closeMenu}
        >
          📊 Asset Allocation
        </Link>
      </div>
    </nav>
  );
}

function FIRECalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL if parameters exist, otherwise from localStorage, then defaults
  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    // Priority 1: URL parameters (for sharing)
    if (hasURLParams(searchParams)) {
      return deserializeInputsFromURL(searchParams);
    }
    // Priority 2: localStorage (for persistence)
    const saved = loadFireCalculatorInputs();
    if (saved) {
      return saved;
    }
    // Priority 3: defaults
    return DEFAULT_INPUTS;
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Update URL when inputs change
  useEffect(() => {
    const params = serializeInputsToURL(inputs);
    setSearchParams(params, { replace: true });
  }, [inputs, setSearchParams]);

  // Auto-save to localStorage when inputs change
  useEffect(() => {
    saveFireCalculatorInputs(inputs);
  }, [inputs]);

  useEffect(() => {
    const calculationResult = calculateFIRE(inputs);
    setResult(calculationResult);
  }, [inputs]);

  const currentYear = new Date().getFullYear();
  const currentAge = currentYear - inputs.yearOfBirth;
  
  const hasValidationErrors = result?.validationErrors && result.validationErrors.length > 0;

  const handleExportCSV = () => {
    const csv = exportFireCalculatorToCSV(inputs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fire-calculator-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const importedInputs = importFireCalculatorFromCSV(csv);
        setInputs(importedInputs);
      } catch (error) {
        alert(`Error importing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This will clear all saved data from localStorage and reset to defaults.')) {
      clearAllData();
      setInputs(DEFAULT_INPUTS);
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <DataManagement
          onExport={handleExportCSV}
          onImport={handleImportCSV}
          onReset={handleResetData}
          defaultOpen={true}
        />
        
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
          <Route path="/monte-carlo" element={<MonteCarloPage />} />
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
