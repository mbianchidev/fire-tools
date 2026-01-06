import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTourCompleted, saveTourCompleted } from '../utils/tourPreferences';
import { saveFireCalculatorInputs, saveAssetAllocation, saveExpenseTrackerData, saveNetWorthTrackerData, clearAllData } from '../utils/cookieStorage';
import { saveSettings, loadSettings, DEFAULT_SETTINGS } from '../utils/cookieSettings';
import { DEFAULT_INPUTS, getDemoNetWorthData, getDemoAssetAllocationData } from '../utils/defaults';
import { generateDemoExpenseData } from '../utils/demoExpenseData';
import { DEFAULT_FALLBACK_RATES, type SupportedCurrency } from '../types/currency';
import './GuidedTour.css';

interface TourStep {
  title: string;
  content: React.ReactNode;
  icon: string;
}

interface GuidedTourProps {
  onTourComplete?: () => void;
}

export function GuidedTour({ onTourComplete }: GuidedTourProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  // Check if tour should be shown on mount
  useEffect(() => {
    const tourCompleted = loadTourCompleted();
    if (!tourCompleted) {
      setIsVisible(true);
    }
  }, []);

  const loadDemoData = useCallback(() => {
    if (demoDataLoaded) return;

    // Reset settings to EUR as default currency
    const settings = loadSettings();
    const newSettings = {
      ...settings,
      currencySettings: {
        ...settings.currencySettings,
        defaultCurrency: 'EUR' as SupportedCurrency,
        fallbackRates: { ...DEFAULT_FALLBACK_RATES },
      },
    };
    saveSettings(newSettings);

    // Load demo FIRE Calculator data
    saveFireCalculatorInputs(DEFAULT_INPUTS);

    // Load demo Asset Allocation data
    const { assets, assetClassTargets } = getDemoAssetAllocationData();
    saveAssetAllocation(assets, assetClassTargets);

    // Load demo Cashflow Tracker data
    const cashflowData = generateDemoExpenseData();
    saveExpenseTrackerData(cashflowData);

    // Load demo Net Worth Tracker data
    const netWorthData = getDemoNetWorthData();
    saveNetWorthTrackerData(netWorthData);

    setDemoDataLoaded(true);
  }, [demoDataLoaded]);

  // Load demo data when entering the "how tools work together" step
  useEffect(() => {
    if (currentStep >= 2 && !demoDataLoaded) {
      loadDemoData();
    }
  }, [currentStep, demoDataLoaded, loadDemoData]);

  const tourSteps: TourStep[] = [
    {
      title: 'Welcome to Fire Tools! 🚀',
      icon: '👋',
      content: (
        <div className="tour-step-content">
          <p>
            Welcome! Fire Tools is a comprehensive suite of financial planning tools 
            designed to help you achieve <strong>Financial Independence and Retire Early (FIRE)</strong>.
          </p>
          <p>
            This quick tour will show you the main features and how to get the most 
            out of the application. We&apos;ll also load some demo data so you can see 
            everything in action.
          </p>
          <p className="tour-privacy-note">
            <span className="tour-note-icon">🔒</span>
            <span>All your data stays on your device - we never send it anywhere.</span>
          </p>
        </div>
      ),
    },
    {
      title: 'Asset Allocation Manager 📊',
      icon: '📊',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>Track and manage your investment portfolio</strong> with intelligent 
            asset allocation tools.
          </p>
          <ul className="tour-feature-list">
            <li><span className="tour-feature-icon">💼</span> Add stocks, bonds, ETFs, and other assets</li>
            <li><span className="tour-feature-icon">⚖️</span> Set target allocations and see rebalancing recommendations</li>
            <li><span className="tour-feature-icon">📉</span> Use the DCA (Dollar Cost Averaging) helper for regular investments</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Cashflow Tracker 💰',
      icon: '💰',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>Monitor your income and expenses</strong> to understand your spending 
            patterns and savings rate.
          </p>
          <ul className="tour-feature-list">
            <li><span className="tour-feature-icon">📝</span> Log income and expenses by category</li>
            <li><span className="tour-feature-icon">💵</span> Set budgets using the 50/30/20 rule</li>
            <li><span className="tour-feature-icon">📊</span> View charts and analytics of your spending</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Net Worth Tracker 📈',
      icon: '📈',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>Track your financial progress over time</strong> with monthly snapshots 
            of your net worth.
          </p>
          <ul className="tour-feature-list">
            <li><span className="tour-feature-icon">💼</span> Monitor assets, cash, and pension accounts</li>
            <li><span className="tour-feature-icon">📈</span> See historical charts of your wealth growth</li>
            <li><span className="tour-feature-icon">🔄</span> Sync with Asset Allocation for consistency</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'FIRE Calculator 🔥',
      icon: '🔥',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>Calculate your path to Financial Independence</strong> with detailed 
            projections and timeline analysis.
          </p>
          <ul className="tour-feature-list">
            <li><span className="tour-feature-icon">📊</span> Visual projections of your net worth over time</li>
            <li><span className="tour-feature-icon">🎯</span> See exactly when you can reach FIRE</li>
            <li><span className="tour-feature-icon">⚙️</span> Adjust parameters to see different scenarios</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Monte Carlo Simulations 🎲',
      icon: '🎲',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>Assess the probability of reaching your FIRE goals</strong> by running 
            thousands of simulations with randomized market returns.
          </p>
          <ul className="tour-feature-list">
            <li><span className="tour-feature-icon">🎯</span> See your success probability percentage</li>
            <li><span className="tour-feature-icon">📉</span> Account for market volatility and black swan events</li>
            <li><span className="tour-feature-icon">⚡</span> Understand the range of possible outcomes</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Tools Work Together 🔗',
      icon: '🔗',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>The real power comes from using tools together!</strong> Here&apos;s how 
            they connect:
          </p>
          <div className="tour-integration-diagram">
            <div className="tour-integration-item">
              <span className="tour-integration-icon">📊</span>
              <span className="tour-integration-arrow">→</span>
              <span className="tour-integration-icon">🔥</span>
              <span className="tour-integration-text">Asset values flow into FIRE Calculator</span>
            </div>
            <div className="tour-integration-item">
              <span className="tour-integration-icon">💰</span>
              <span className="tour-integration-arrow">→</span>
              <span className="tour-integration-icon">🔥</span>
              <span className="tour-integration-text">Income/expenses update savings calculations</span>
            </div>
            <div className="tour-integration-item">
              <span className="tour-integration-icon">📈</span>
              <span className="tour-integration-arrow">↔</span>
              <span className="tour-integration-icon">📊</span>
              <span className="tour-integration-text">Net Worth syncs with Asset Allocation</span>
            </div>
          </div>
          <p className="tour-tip">
            <strong>💡 Tip:</strong> Each tool can also work independently if you prefer!
          </p>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show end dialog instead of completing immediately
      setShowEndDialog(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Show end dialog to ask about demo data
    if (demoDataLoaded) {
      setShowEndDialog(true);
    } else {
      // If demo data wasn't loaded, just close the tour
      completeTour();
    }
  };

  const completeTour = (keepData = true) => {
    if (!keepData) {
      clearAllData();
      // Reset settings to defaults
      saveSettings(DEFAULT_SETTINGS);
    }
    saveTourCompleted(true);
    setIsVisible(false);
    setShowEndDialog(false);
    onTourComplete?.();
    
    // Reload the page to reflect data changes
    if (!keepData) {
      window.location.reload();
    }
  };

  const handleKeepData = () => {
    completeTour(true);
    navigate('/');
  };

  const handleClearData = () => {
    completeTour(false);
  };

  if (!isVisible) return null;

  if (showEndDialog) {
    return (
      <div className="tour-overlay" role="dialog" aria-modal="true" aria-labelledby="tour-end-title">
        <div className="tour-modal tour-end-modal">
          <div className="tour-end-header">
            <span className="tour-end-icon">🎉</span>
            <h2 id="tour-end-title">Tour Complete!</h2>
          </div>
          <div className="tour-end-content">
            <p>
              Great! You&apos;ve seen all the main features of Fire Tools. We&apos;ve loaded 
              some demo data so you can explore the tools right away.
            </p>
            <p className="tour-end-question">
              <strong>What would you like to do with the demo data?</strong>
            </p>
          </div>
          <div className="tour-end-actions">
            <button 
              className="tour-btn tour-btn-secondary"
              onClick={handleClearData}
            >
              <span className="tour-btn-icon">🗑️</span>
              Start Fresh
              <span className="tour-btn-hint">Clear all demo data</span>
            </button>
            <button 
              className="tour-btn tour-btn-primary"
              onClick={handleKeepData}
            >
              <span className="tour-btn-icon">✨</span>
              Keep Demo Data
              <span className="tour-btn-hint">Explore with sample data</span>
            </button>
          </div>
          <p className="tour-end-note">
            <span className="tour-note-icon">💡</span>
            You can restart this tour anytime from Settings → Restart Tour
          </p>
        </div>
      </div>
    );
  }

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-modal">
        <div className="tour-header">
          <div className="tour-step-indicator">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`tour-step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                aria-label={`Step ${index + 1} of ${tourSteps.length}`}
              />
            ))}
          </div>
          <button
            className="tour-skip-btn"
            onClick={handleSkip}
            aria-label="Skip tour"
          >
            Skip tour
          </button>
        </div>

        <div className="tour-body">
          <div className="tour-icon-large">{step.icon}</div>
          <h2 id="tour-title" className="tour-title">{step.title}</h2>
          {step.content}
        </div>

        <div className="tour-footer">
          <button
            className="tour-btn tour-btn-secondary"
            onClick={handlePrev}
            disabled={isFirstStep}
            aria-label="Previous step"
          >
            ← Back
          </button>
          <span className="tour-step-count">
            {currentStep + 1} / {tourSteps.length}
          </span>
          <button
            className="tour-btn tour-btn-primary"
            onClick={handleNext}
            aria-label={isLastStep ? 'Finish tour' : 'Next step'}
          >
            {isLastStep ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
