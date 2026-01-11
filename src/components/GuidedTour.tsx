import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTourCompleted, saveTourCompleted } from '../utils/tourPreferences';
import { saveFireCalculatorInputs, saveAssetAllocation, saveExpenseTrackerData, saveNetWorthTrackerData, clearAllData, loadFireCalculatorInputs, loadAssetAllocation } from '../utils/cookieStorage';
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

interface InteractiveStep {
  page: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  elementSelector?: string; // CSS selector to highlight specific element
  inputSelector?: string; // CSS selector for input to validate (required when starting fresh)
  inputLabel?: string; // Label for the input field for validation message
  allowZero?: boolean; // Whether zero is a valid value for this field
  clickAction?: string; // CSS selector for button to click to open dialog
  dialogSelector?: string; // CSS selector for dialog to wait for
  isDialogStep?: boolean; // Whether this step is inside a dialog
  closeDialogAfter?: boolean; // Whether to close the dialog after this step
  waitForUserClick?: boolean; // Whether to wait for user to click the button themselves
  requiresAction?: boolean; // Whether the user must perform an action (like clicking "Run") before proceeding
  actionCompletedSelector?: string; // CSS selector to detect action completion (for requiresAction steps)
}

type TourPhase = 'overview' | 'data-choice' | 'interactive-prompt' | 'interactive' | 'end';

interface GuidedTourProps {
  onTourComplete?: () => void;
}

// Constants for tour timing
const DIALOG_WAIT_INTERVAL_MS = 100; // How often to check for dialog appearance
const DIALOG_WAIT_TIMEOUT_MS = 3000; // Maximum time to wait for dialog
const DIALOG_TRANSITION_DELAY_MS = 300; // Delay for dialog opening animation
const UI_UPDATE_DELAY_MS = 200; // Delay to allow UI to update before clicking
const ACTION_CHECK_INTERVAL_MS = 200; // How often to check for action completion

// Helper function to close any open dialog
function closeAnyOpenDialog(): boolean {
  // Try multiple selectors for dialog close buttons
  const selectors = [
    '.dialog.tour-highlight .dialog-close',
    '.net-worth-dialog .dialog-close',
    '.dca-dialog .dialog-close',
    '.dialog-content .dialog-close',
    '.dialog-close'
  ];
  
  for (const selector of selectors) {
    const closeButton = document.querySelector(selector) as HTMLElement;
    if (closeButton) {
      closeButton.click();
      return true;
    }
  }
  return false;
}

export function GuidedTour({ onTourComplete }: GuidedTourProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoDataLoaded, setDemoDataLoaded] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [tourPhase, setTourPhase] = useState<TourPhase>('overview');
  const [interactiveStep, setInteractiveStep] = useState(0);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [currentPageTour, setCurrentPageTour] = useState<string | null>(null);
  const [keepDemoData, setKeepDemoData] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hadExistingData, setHadExistingData] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [waitingForUserClick, setWaitingForUserClick] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  
  // Dragging state for tooltip
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour should be shown on mount
  useEffect(() => {
    const tourCompleted = loadTourCompleted();
    if (!tourCompleted) {
      setIsVisible(true);
      // Check if user already has data (for first visit, they won't)
      const existingFireData = loadFireCalculatorInputs();
      const existingAssetData = loadAssetAllocation();
      const hasExistingData = !!(existingFireData || existingAssetData?.assets?.length);
      setHadExistingData(hasExistingData);
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

  // Load demo data when entering the "how tools work together" step,
  // but only if user doesn't already have existing data
  useEffect(() => {
    if (currentStep >= 2 && !demoDataLoaded && !hadExistingData) {
      loadDemoData();
    }
  }, [currentStep, demoDataLoaded, loadDemoData, hadExistingData]);

  // Add/remove tour-interactive-mode class on body during interactive tour
  useEffect(() => {
    if (tourPhase === 'interactive' && currentPageTour) {
      document.body.classList.add('tour-interactive-mode');
    } else {
      document.body.classList.remove('tour-interactive-mode');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('tour-interactive-mode');
    };
  }, [tourPhase, currentPageTour]);

  // Detect dialog opening for waitForUserClick steps OR button clicks for tab steps
  useEffect(() => {
    if (!waitingForUserClick || tourPhase !== 'interactive' || !currentPageTour) return;

    const currentTour = pageTours[currentPageTour];
    const currentInteractiveStep = currentTour?.steps[interactiveStep];
    
    // If there's a dialogSelector, poll for dialog to appear
    if (currentInteractiveStep?.dialogSelector) {
      const checkDialog = () => {
        const dialog = document.querySelector(currentInteractiveStep.dialogSelector!);
        if (dialog) {
          setDialogOpen(true);
          setWaitingForUserClick(false);
          // Move to next step (first dialog step)
          setTimeout(() => {
            setInteractiveStep(interactiveStep + 1);
          }, DIALOG_TRANSITION_DELAY_MS);
        }
      };

      const intervalId = setInterval(checkDialog, DIALOG_WAIT_INTERVAL_MS);
      checkDialog(); // Check immediately
      
      return () => clearInterval(intervalId);
    }
    
    // For button clicks without dialog (like tab buttons), listen for click events
    if (currentInteractiveStep?.elementSelector && !currentInteractiveStep?.dialogSelector) {
      const handleTabClick = () => {
        setWaitingForUserClick(false);
        // Move to next step after a short delay for tab content to render
        setTimeout(() => {
          setInteractiveStep(interactiveStep + 1);
        }, DIALOG_TRANSITION_DELAY_MS);
      };
      
      // Find the highlighted element (should be a button/tab)
      const element = document.querySelector(currentInteractiveStep.elementSelector);
      if (element) {
        element.addEventListener('click', handleTabClick);
        return () => element.removeEventListener('click', handleTabClick);
      }
    }
    
    return undefined;
  }, [waitingForUserClick, tourPhase, currentPageTour, interactiveStep]);

  // Detect action completion for requiresAction steps (e.g., Monte Carlo results appearing)
  useEffect(() => {
    if (tourPhase !== 'interactive' || !currentPageTour) return;

    const currentTour = pageTours[currentPageTour];
    const currentInteractiveStep = currentTour?.steps[interactiveStep];
    
    if (!currentInteractiveStep?.requiresAction || !currentInteractiveStep?.actionCompletedSelector) return;

    // Check if the action result element appears
    const checkResults = () => {
      const results = document.querySelector(currentInteractiveStep.actionCompletedSelector!);
      if (results) {
        setActionCompleted(true);
      }
    };

    const intervalId = setInterval(checkResults, ACTION_CHECK_INTERVAL_MS);
    checkResults(); // Check immediately
    
    return () => clearInterval(intervalId);
  }, [tourPhase, currentPageTour, interactiveStep]);

  // Highlight elements during interactive tour
  useEffect(() => {
    // Helper function to clean up highlights
    const cleanupHighlights = () => {
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };

    if (tourPhase !== 'interactive' || !currentPageTour) {
      // Clean up highlight when not in interactive mode
      cleanupHighlights();
      return;
    }

    // When showing the continue prompt, remove all highlights so the dialog is visible
    if (showContinuePrompt) {
      cleanupHighlights();
      return;
    }

    const currentTour = pageTours[currentPageTour];
    const currentInteractiveStep = currentTour?.steps[interactiveStep];
    
    // Remove highlight from previous elements first
    cleanupHighlights();

    // Add highlight to new element(s)
    if (currentInteractiveStep?.elementSelector) {
      // Small delay to ensure DOM is ready after navigation
      const timeoutId = setTimeout(() => {
        // Support multiple selectors separated by comma
        const selectors = currentInteractiveStep.elementSelector!.split(',').map(s => s.trim());
        
        selectors.forEach(selector => {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            element.classList.add('tour-highlight');
            // Scroll first element into view
            if (selectors.indexOf(selector) === 0) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tourPhase, currentPageTour, interactiveStep, showContinuePrompt]);

  // Validate input when trying to proceed (only when starting fresh)
  const validateCurrentStep = useCallback((): boolean => {
    // If user kept demo data, no validation needed
    if (keepDemoData) {
      setValidationError(null);
      return true;
    }

    if (tourPhase !== 'interactive' || !currentPageTour) {
      return true;
    }

    const currentTour = pageTours[currentPageTour];
    const currentInteractiveStep = currentTour?.steps[interactiveStep];

    // If no input selector, no validation needed
    if (!currentInteractiveStep?.inputSelector) {
      setValidationError(null);
      return true;
    }

    // Find the input and check if it has a value
    const input = document.querySelector(currentInteractiveStep.inputSelector) as HTMLInputElement;
    if (input) {
      const value = input.value?.trim();
      const isZero = value === '0' || parseFloat(value) === 0;
      const isEmpty = !value || value === '';
      
      // Allow zero if the step specifies allowZero: true
      if (isEmpty || (isZero && !currentInteractiveStep.allowZero)) {
        setValidationError(`Please enter a value for ${currentInteractiveStep.inputLabel || 'this field'} to continue`);
        input.focus();
        return false;
      }
    }

    setValidationError(null);
    return true;
  }, [keepDemoData, tourPhase, currentPageTour, interactiveStep]);

  // Drag handlers for tooltip
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the header
    if (!(e.target as HTMLElement).closest('.tour-tooltip-header')) return;
    if ((e.target as HTMLElement).tagName === 'BUTTON') return; // Don't drag when clicking buttons
    
    e.preventDefault();
    setIsDragging(true);
    
    const tooltipEl = tooltipRef.current;
    if (tooltipEl) {
      const rect = tooltipEl.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !tooltipRef.current) return;
    
    const tooltipEl = tooltipRef.current;
    const rect = tooltipEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate new position
    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;
    
    // Constrain to viewport boundaries with padding
    const padding = 10;
    newX = Math.max(padding, Math.min(viewportWidth - rect.width - padding, newX));
    newY = Math.max(padding, Math.min(viewportHeight - rect.height - padding, newY));
    
    setTooltipPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

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
            out of the application. We'll also load some demo data so you can see 
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
      title: 'Asset Allocation Manager',
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
      title: 'Cashflow Tracker',
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
      title: 'Net Worth Tracker',
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
      title: 'FIRE Calculator',
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
      title: 'Monte Carlo Simulations',
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
      title: 'Tools Work Together',
      icon: '🤝',
      content: (
        <div className="tour-step-content">
          <p>
            <strong>The real power comes from using FIRE tools together, but each tool can also work independently!</strong>
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
        </div>
      ),
    },
  ];

  // Interactive tour steps for each page
  const fireCalculatorSteps: InteractiveStep[] = [
    {
      page: '/fire-calculator',
      title: '💰 Initial Savings',
      description: 'Enter your current savings or portfolio value. This is your starting point for FIRE calculations.',
      position: 'center',
      elementSelector: '[data-tour="initial-savings"]',
      inputSelector: '#initial-savings',
      inputLabel: 'Initial Savings',
      allowZero: true, // Zero is valid for someone just starting
    },
    {
      page: '/fire-calculator',
      title: '💵 Annual Income',
      description: 'Enter your annual net labor income. This determines how much you can save each year toward FIRE.',
      position: 'center',
      elementSelector: '[data-tour="income-section"]',
      inputSelector: '#labor-income',
      inputLabel: 'Annual Income',
    },
    {
      page: '/fire-calculator',
      title: '🏠 Annual Expenses',
      description: 'Set your current annual expenses. Lower expenses mean a faster path to FIRE!',
      position: 'center',
      elementSelector: '[data-tour="expenses-section"]',
      inputSelector: '#current-expenses',
      inputLabel: 'Annual Expenses',
    },
    {
      page: '/fire-calculator',
      title: '📊 Withdrawal Rate',
      description: 'The withdrawal rate (typically 3-4%) determines your FIRE target. A 4% rate means you need 25x your annual expenses.',
      position: 'center',
      elementSelector: '[data-tour="fire-params"]',
      inputSelector: '#withdrawal-rate',
      inputLabel: 'Withdrawal Rate',
    },
    {
      page: '/fire-calculator',
      title: '⚙️ Integration Options',
      description: 'These options connect tools together: sync portfolio values from Asset Allocation, or use actual income/expenses from Cashflow Tracker for more accurate calculations.',
      position: 'center',
      elementSelector: '[data-tour="options-section"]',
    },
    {
      page: '/fire-calculator',
      title: '🎯 FIRE Metrics',
      description: 'See your FIRE target, years to FIRE, and projected portfolio value. These are your key milestones!',
      position: 'center',
      elementSelector: '[data-tour="results-section"]',
    },
    {
      page: '/fire-calculator',
      title: '📈 Growth Charts',
      description: 'Visualize your journey! The Net Worth Growth chart shows your portfolio over time, and Income vs Expenses shows your cash flow.',
      position: 'center',
      elementSelector: '[data-tour="charts-section"]',
    },
  ];

  const assetAllocationSteps: InteractiveStep[] = [
    {
      page: '/asset-allocation',
      title: '📊 Your Assets',
      description: 'This table shows your portfolio holdings. You can see each asset\'s current value, target allocation, and recommended action (BUY/SELL/HOLD).',
      position: 'center',
      elementSelector: '[data-tour="asset-list"]',
    },
    {
      page: '/asset-allocation',
      title: '➕ Add New Assets',
      description: 'Click the "Add Asset" button to add a new holding to your portfolio. Go ahead, click it now!',
      position: 'center',
      elementSelector: '[data-tour="add-asset-button"]',
      waitForUserClick: true,
      dialogSelector: '.dialog-content',
    },
    // Add Asset Dialog steps
    {
      page: '/asset-allocation',
      title: '📝 Asset Class Selection',
      description: 'First, choose the asset class (Stocks, Bonds, Cash, Crypto, or Real Estate). This determines how the asset is categorized in your portfolio.',
      position: 'center',
      elementSelector: '.dialog-content',
      isDialogStep: true,
    },
    {
      page: '/asset-allocation',
      title: '🏷️ Asset Details',
      description: 'Enter the asset name, ticker symbol (e.g., AAPL, VTI), number of shares you own, and the price per share. The total value is calculated automatically.',
      position: 'center',
      elementSelector: '.dialog-content',
      isDialogStep: true,
    },
    {
      page: '/asset-allocation',
      title: '🎯 Target Allocation',
      description: 'Set your target allocation mode: "%" for percentage of the asset class, "SET" for a fixed amount, or "OFF" to exclude from rebalancing.',
      position: 'center',
      elementSelector: '.dialog-content',
      isDialogStep: true,
      closeDialogAfter: true,
    },
    {
      page: '/asset-allocation',
      title: '⚖️ Target Allocations',
      description: 'Set your target percentages for each asset class. The tool calculates what to buy or sell to reach your targets.',
      position: 'center',
      elementSelector: '[data-tour="target-allocations"]',
    },
    {
      page: '/asset-allocation',
      title: '💹 DCA Helper',
      description: 'The DCA (Dollar Cost Averaging) Helper calculates how to split a lump sum investment. Click the "DCA Helper" button to see how it works!',
      position: 'center',
      elementSelector: '[data-tour="dca-helper"]',
      waitForUserClick: true,
      dialogSelector: '.dca-dialog',
    },
    // DCA Helper Dialog steps
    {
      page: '/asset-allocation',
      title: '💰 Enter Investment Amount',
      description: 'Enter the amount you want to invest. The DCA Helper will calculate how to split it across your assets according to your target allocations.',
      position: 'center',
      elementSelector: '.dca-dialog',
      isDialogStep: true,
    },
    {
      page: '/asset-allocation',
      title: '📊 Investment Breakdown',
      description: 'After calculating, you\'ll see exactly how much to invest in each asset and how many shares to buy. Current prices are fetched from Yahoo Finance.',
      position: 'center',
      elementSelector: '.dca-dialog',
      isDialogStep: true,
    },
    {
      page: '/asset-allocation',
      title: '✅ Confirm Investments',
      description: 'After making your investments, you can confirm the actual shares purchased to track deviations from the suggested amounts.',
      position: 'center',
      elementSelector: '.dca-dialog',
      isDialogStep: true,
      closeDialogAfter: true,
    },
  ];

  const expenseTrackerSteps: InteractiveStep[] = [
    {
      page: '/expense-tracker',
      title: '📝 Add Income',
      description: 'Track your income and expenses here. Click "Add Income" to see how to add income!',
      position: 'center',
      elementSelector: '[data-tour="transaction-actions"]',
      waitForUserClick: true,
      dialogSelector: '.dialog',
    },
    // Add Income Dialog steps
    {
      page: '/expense-tracker',
      title: '📅 Date & Amount',
      description: 'Select the date when you received the income and enter the amount. This helps track your income over time.',
      position: 'center',
      elementSelector: '.dialog',
      isDialogStep: true,
    },
    {
      page: '/expense-tracker',
      title: '💼 Income Source',
      description: 'Choose the income source: Salary, Bonus, Dividend, Freelance, Investment, Rental, or Other. This categorizes your income for better analytics.',
      position: 'center',
      elementSelector: '.dialog',
      isDialogStep: true,
      closeDialogAfter: true,
    },
    {
      page: '/expense-tracker',
      title: '💸 Add Expense',
      description: 'Now click "Add Expense" to see how to record your spending.',
      position: 'center',
      elementSelector: '[data-tour="transaction-actions"]',
      waitForUserClick: true,
      dialogSelector: '.dialog',
    },
    // Add Expense Dialog steps
    {
      page: '/expense-tracker',
      title: '📅 Expense Details',
      description: 'Enter the date, amount, and a description of the expense. Be specific to help you track spending patterns.',
      position: 'center',
      elementSelector: '.dialog',
      isDialogStep: true,
    },
    {
      page: '/expense-tracker',
      title: '🏷️ Category & Type',
      description: 'Select a category (Housing, Food, Transport, etc.) and classify as Need or Want. This powers the 50/30/20 budget analysis.',
      position: 'center',
      elementSelector: '.dialog',
      isDialogStep: true,
      closeDialogAfter: true,
    },
    {
      page: '/expense-tracker',
      title: '📊 50/30/20 Budget Rule',
      description: 'See how your spending compares to the 50/30/20 rule: 50% for needs (housing, food), 30% for wants (entertainment), and 20% for savings.',
      position: 'center',
      elementSelector: '[data-tour="budget-analysis"]',
    },
    {
      page: '/expense-tracker',
      title: '💵 Set Budgets',
      description: 'Click the Budgets tab to set monthly spending limits for each category. Track your progress with visual indicators.',
      position: 'center',
      elementSelector: '[data-tour="budgets-tab"]',
      waitForUserClick: true,
    },
    {
      page: '/expense-tracker',
      title: '💵 Budget Categories',
      description: 'Here you can set monthly budget limits for each expense category. The progress bars show how much you\'ve spent vs. your budget. Edit the amounts to customize your spending goals.',
      position: 'center',
      elementSelector: '[data-tour="expense-tabs"], [data-tour="budgets-content"]',
    },
    {
      page: '/expense-tracker',
      title: '📈 Analytics',
      description: 'Click the Analytics tab to see spending trends, category breakdowns, and monthly comparisons to help you understand your financial habits.',
      position: 'center',
      elementSelector: '[data-tour="analytics-tab"]',
      waitForUserClick: true,
    },
    {
      page: '/expense-tracker',
      title: '📊 Spending Insights',
      description: 'View detailed charts and analytics: spending trends over time, category breakdowns, and monthly comparisons. Use the view selector to switch between monthly, quarterly, and yearly perspectives.',
      position: 'center',
      elementSelector: '[data-tour="expense-tabs"], [data-tour="analytics-content"]',
    },
  ];

  const netWorthSteps: InteractiveStep[] = [
    {
      page: '/net-worth-tracker',
      title: '💰 Log Assets',
      description: 'Just like in Asset Allocation, you can add assets here to track your historical net worth. Click "Log Asset" to add stocks, bonds, crypto, real estate, and other holdings with their current values.',
      position: 'center',
      elementSelector: '[data-tour="assets-section"]',
    },
    {
      page: '/net-worth-tracker',
      title: '📝 Log Operations',
      description: 'Click "Log Operation" to track financial operations like dividends, purchases, and sales.',
      position: 'center',
      elementSelector: '[data-tour="assets-section"]',
      waitForUserClick: true,
      dialogSelector: '.net-worth-dialog',
    },
    // Log Operation Dialog steps
    {
      page: '/net-worth-tracker',
      title: '📅 Operation Details',
      description: 'Select the date and operation type: Dividend, Purchase, Sale, Deposit, Withdrawal, Interest, or Tax.',
      position: 'center',
      elementSelector: '.net-worth-dialog',
      isDialogStep: true,
    },
    {
      page: '/net-worth-tracker',
      title: '💰 Amount & Description',
      description: 'Enter the amount and a description. Income operations (dividends, interest) increase your net worth; expenses (taxes) decrease it.',
      position: 'center',
      elementSelector: '.net-worth-dialog',
      isDialogStep: true,
      closeDialogAfter: true,
    },
    {
      page: '/net-worth-tracker',
      title: '📈 Historical Chart',
      description: 'Watch your wealth grow over time! The chart shows your net worth progression with monthly variations and forecasted growth.',
      position: 'center',
      elementSelector: '[data-tour="historical-chart"]',
    },
    {
      page: '/net-worth-tracker',
      title: '🔄 Asset Allocation Sync',
      description: 'Enable sync to automatically keep your asset data consistent between Net Worth Tracker and Asset Allocation Manager.',
      position: 'center',
      elementSelector: '[data-tour="sync-options"]',
    },
  ];

  // Monte Carlo Simulation steps
  const monteCarloSteps: InteractiveStep[] = [
    {
      page: '/monte-carlo',
      title: '📊 Simulation Base Data',
      description: 'This section shows the FIRE Calculator data used for simulations: your portfolio value, FIRE target, income, savings rate, and expected returns. These values come from your FIRE Calculator inputs.',
      position: 'center',
      elementSelector: '[data-tour="monte-carlo-base-data"]',
    },
    {
      page: '/monte-carlo',
      title: '⚙️ Simulation Parameters',
      description: 'Adjust the simulation settings: number of simulations (1000-100000), stock/bond volatility (higher = more uncertain), and black swan event probability. These affect how conservative or optimistic your projections are.',
      position: 'center',
      elementSelector: '[data-tour="monte-carlo-params"]',
    },
    {
      page: '/monte-carlo',
      title: '▶️ Run Simulation',
      description: 'Click the "Run Simulations" button to run the Monte Carlo analysis. This will generate thousands of scenarios based on your parameters.',
      position: 'center',
      elementSelector: '[data-tour="monte-carlo-run-btn"]',
      requiresAction: true,
      actionCompletedSelector: '[data-tour="monte-carlo-results"]',
    },
    {
      page: '/monte-carlo',
      title: '📊 Results & Success Rate',
      description: 'See your success probability, median outcome, and the range of possible results. Green means high probability of success!',
      position: 'center',
      elementSelector: '[data-tour="monte-carlo-results"]',
    },
  ];

  const pageTours: Record<string, { steps: InteractiveStep[]; nextPage: string | null; previousPage: string | null; pageName: string }> = {
    '/fire-calculator': { steps: fireCalculatorSteps, nextPage: '/asset-allocation', previousPage: null, pageName: 'Asset Allocation' },
    '/asset-allocation': { steps: assetAllocationSteps, nextPage: '/expense-tracker', previousPage: '/fire-calculator', pageName: 'Cashflow Tracker' },
    '/expense-tracker': { steps: expenseTrackerSteps, nextPage: '/net-worth-tracker', previousPage: '/asset-allocation', pageName: 'Net Worth Tracker' },
    '/net-worth-tracker': { steps: netWorthSteps, nextPage: '/monte-carlo', previousPage: '/expense-tracker', pageName: 'Monte Carlo' },
    '/monte-carlo': { steps: monteCarloSteps, nextPage: null, previousPage: '/net-worth-tracker', pageName: '' },
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // After overview tour, first ask about demo data
      setTourPhase('data-choice');
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
      setTourPhase('data-choice');
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
    setTourPhase('overview');
    onTourComplete?.();
    
    // Reload the page to reflect data changes
    if (!keepData) {
      window.location.reload();
    }
  };

  // Handle keeping demo data and proceed to interactive tour prompt
  const handleKeepDataAndContinue = () => {
    setKeepDemoData(true);
    setTourPhase('interactive-prompt');
  };

  // Handle clearing data and proceed to interactive tour prompt
  const handleClearDataAndContinue = () => {
    setKeepDemoData(false);
    clearAllData();
    saveSettings(DEFAULT_SETTINGS);
    setTourPhase('interactive-prompt');
  };

  // Handle keeping current user data (when restarting tour)
  const handleKeepCurrentDataAndContinue = () => {
    setKeepDemoData(true);
    // Don't load demo data or clear anything - just proceed
    setTourPhase('interactive-prompt');
  };

  // Finish tour without interactive walkthrough
  const finishWithoutInteractive = () => {
    saveTourCompleted(true);
    setIsVisible(false);
    setShowEndDialog(false);
    onTourComplete?.();
    navigate('/');
    // Reload if data was cleared
    if (!keepDemoData) {
      window.location.reload();
    }
  };

  // Start the interactive tour
  const startInteractiveTour = () => {
    setShowEndDialog(false);
    setTourPhase('interactive');
    setCurrentPageTour('/fire-calculator');
    setInteractiveStep(0);
    setValidationError(null);
    setWaitingForUserClick(false);
    setActionCompleted(false);
    navigate('/fire-calculator');
  };

  // Handle next step in interactive tour
  const handleInteractiveNext = () => {
    if (!currentPageTour) return;
    
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return;
    }
    
    const currentTour = pageTours[currentPageTour];
    if (!currentTour) return;

    const currentInteractiveStep = currentTour.steps[interactiveStep];
    const nextStepIndex = interactiveStep + 1;
    const nextStep = nextStepIndex < currentTour.steps.length ? currentTour.steps[nextStepIndex] : null;

    // Reset action states
    setActionCompleted(false);
    setWaitingForUserClick(false);

    // Close dialog if current step requires it or if moving from a dialog step to a non-dialog step
    const shouldCloseDialog = dialogOpen && (
      currentInteractiveStep?.closeDialogAfter ||
      (currentInteractiveStep?.isDialogStep && nextStep && !nextStep.isDialogStep)
    );
    if (shouldCloseDialog) {
      closeAnyOpenDialog();
      setDialogOpen(false);
    }

    // If current step requires waiting for user to click a button to open dialog
    // and the dialog isn't open yet, set waiting state and return
    if (currentInteractiveStep?.waitForUserClick && !dialogOpen && currentInteractiveStep?.dialogSelector) {
      // User hasn't clicked yet, set waiting state
      setWaitingForUserClick(true);
      return;
    }

    // If current step is a waitForUserClick step without dialog (like tab clicks),
    // just proceed since the step description tells user what to do
    // The actual click will be detected in the useEffect

    // If current step requires an action (like clicking Run), check if action was completed
    if (currentInteractiveStep?.requiresAction && !actionCompleted) {
      setValidationError('Please complete the action (click the button) before continuing');
      return;
    }

    // If next step has clickAction (needs to auto-click to open a dialog), handle it
    if (nextStep?.clickAction) {
      // Move to next step first
      setInteractiveStep(nextStepIndex);
      setValidationError(null);
      
      // Delay to allow UI to update, then click the button
      setTimeout(() => {
        const button = document.querySelector(nextStep.clickAction!) as HTMLElement;
        if (button) {
          button.click();
          setDialogOpen(true);
          
          // Wait for dialog to appear with timeout to prevent infinite loop
          let waitTime = 0;
          const waitForDialog = () => {
            const dialog = document.querySelector(nextStep.dialogSelector || '.dialog');
            if (dialog) {
              // Move to the first dialog step after dialog opening animation
              setTimeout(() => {
                setInteractiveStep(nextStepIndex + 1);
              }, DIALOG_TRANSITION_DELAY_MS);
            } else if (waitTime < DIALOG_WAIT_TIMEOUT_MS) {
              // Keep waiting until timeout
              waitTime += DIALOG_WAIT_INTERVAL_MS;
              setTimeout(waitForDialog, DIALOG_WAIT_INTERVAL_MS);
            } else {
              // Timeout reached, proceed anyway
              setInteractiveStep(nextStepIndex + 1);
            }
          };
          setTimeout(waitForDialog, UI_UPDATE_DELAY_MS);
        }
      }, UI_UPDATE_DELAY_MS);
      return;
    }

    // If next step requires waiting for user click, set the waiting state
    if (nextStep?.waitForUserClick) {
      setInteractiveStep(nextStepIndex);
      setValidationError(null);
      setWaitingForUserClick(true);
      return;
    }

    if (nextStepIndex < currentTour.steps.length) {
      setInteractiveStep(nextStepIndex);
      setValidationError(null);
    } else {
      // Show prompt to continue to next page or finish
      // First close any open dialog
      if (dialogOpen) {
        closeAnyOpenDialog();
        setDialogOpen(false);
      }
      setShowContinuePrompt(true);
    }
  };

  // Handle previous step in interactive tour
  const handleInteractivePrev = () => {
    const currentTour = currentPageTour ? pageTours[currentPageTour] : null;
    const currentInteractiveStep = currentTour?.steps[interactiveStep];
    
    // Reset waiting states
    setWaitingForUserClick(false);
    setActionCompleted(false);
    setValidationError(null);
    
    // If we're in a dialog, going back should stay in dialog or close it
    if (currentInteractiveStep?.isDialogStep) {
      // Check if previous step is also a dialog step
      const prevStep = interactiveStep > 0 ? currentTour?.steps[interactiveStep - 1] : null;
      if (prevStep?.isDialogStep) {
        // Stay in dialog, go to previous step
        setInteractiveStep(interactiveStep - 1);
        return;
      } else if (prevStep?.waitForUserClick || prevStep?.clickAction) {
        // Previous step is the one that opened the dialog, close dialog and go back
        closeAnyOpenDialog();
        setDialogOpen(false);
        setInteractiveStep(interactiveStep - 1);
        return;
      }
    }
    
    // If previous step was a dialog step (from current non-dialog step), we need to reopen the dialog
    const prevStep = interactiveStep > 0 ? currentTour?.steps[interactiveStep - 1] : null;
    if (prevStep?.closeDialogAfter) {
      // Find the step that opened the dialog
      let dialogOpenerIndex = interactiveStep - 1;
      while (dialogOpenerIndex > 0) {
        const step = currentTour?.steps[dialogOpenerIndex - 1];
        if (step?.waitForUserClick || step?.clickAction) {
          break;
        }
        dialogOpenerIndex--;
      }
      
      // Go back to the last dialog step and reopen dialog
      const openerStep = currentTour?.steps[dialogOpenerIndex - 1];
      if (openerStep?.clickAction) {
        // Auto-click to open dialog
        setInteractiveStep(interactiveStep - 1);
        setTimeout(() => {
          const button = document.querySelector(openerStep.clickAction!) as HTMLElement;
          if (button) {
            button.click();
            setDialogOpen(true);
          }
        }, UI_UPDATE_DELAY_MS);
        return;
      } else if (openerStep?.waitForUserClick && openerStep?.dialogSelector) {
        // For waitForUserClick steps, we need to tell user to click again
        setInteractiveStep(dialogOpenerIndex - 1);
        setWaitingForUserClick(true);
        return;
      }
    }
    
    if (interactiveStep > 0) {
      setInteractiveStep(interactiveStep - 1);
    } else if (currentPageTour) {
      // At start of page - go to previous page's last step
      if (currentTour?.previousPage) {
        const prevPageTour = pageTours[currentTour.previousPage];
        if (prevPageTour) {
          // Close any open dialog first
          if (dialogOpen) {
            closeAnyOpenDialog();
            setDialogOpen(false);
          }
          setCurrentPageTour(currentTour.previousPage);
          setInteractiveStep(prevPageTour.steps.length - 1);
          navigate(currentTour.previousPage);
        }
      }
    }
  };

  // Continue to next page in interactive tour
  const continueToNextPage = () => {
    if (!currentPageTour) return;
    
    // Close any open dialog first
    if (dialogOpen) {
      closeAnyOpenDialog();
      setDialogOpen(false);
    }
    
    const currentTour = pageTours[currentPageTour];
    if (currentTour?.nextPage) {
      setCurrentPageTour(currentTour.nextPage);
      setInteractiveStep(0);
      setShowContinuePrompt(false);
      setValidationError(null);
      navigate(currentTour.nextPage);
    } else {
      finishInteractiveTour();
    }
  };

  // Finish the interactive tour
  const finishInteractiveTour = () => {
    // Close any open dialog first
    if (dialogOpen) {
      closeAnyOpenDialog();
      setDialogOpen(false);
    }
    
    // Clean up tour state
    setShowContinuePrompt(false);
    saveTourCompleted(true);
    setIsVisible(false);
    setShowEndDialog(false);
    setTourPhase('overview');
    setCurrentPageTour(null);
    
    // Remove tour-interactive-mode class to restore all inputs
    document.body.classList.remove('tour-interactive-mode');
    
    // Remove any highlight from elements
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    
    onTourComplete?.();
    navigate('/');
  };

  // Skip interactive tour and go to end
  const skipInteractiveTour = () => {
    // Close any open dialog first
    if (dialogOpen) {
      closeAnyOpenDialog();
      setDialogOpen(false);
    }
    
    // Clean up tour state
    setShowContinuePrompt(false);
    saveTourCompleted(true);
    setIsVisible(false);
    setShowEndDialog(false);
    setTourPhase('overview');
    setCurrentPageTour(null);
    
    // Remove tour-interactive-mode class to restore all inputs
    document.body.classList.remove('tour-interactive-mode');
    
    // Remove any highlight from elements
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    
    onTourComplete?.();
    
    // Force page refresh to ensure all inputs are clickable again
    window.location.href = '/';
  };

  // Skip just the current step (not the entire tour)
  const skipCurrentPage = () => {
    if (!currentPageTour) return;
    
    const currentTour = pageTours[currentPageTour];
    if (!currentTour) return;

    const currentInteractiveStep = currentTour.steps[interactiveStep];

    // Reset validation and waiting states
    setValidationError(null);
    setWaitingForUserClick(false);
    setActionCompleted(false);

    // If current step has closeDialogAfter or is a dialog step, close any dialog
    if ((currentInteractiveStep?.closeDialogAfter || currentInteractiveStep?.isDialogStep) && dialogOpen) {
      closeAnyOpenDialog();
      setDialogOpen(false);
    }

    // Skip to the end of the current page's tour
    setShowContinuePrompt(true);
  };

  if (!isVisible) return null;

  // Interactive tour - show continue prompt
  if (showContinuePrompt && currentPageTour) {
    const currentTour = pageTours[currentPageTour];
    const hasNextPage = currentTour?.nextPage;
    
    return (
      <div className="tour-overlay tour-overlay-transparent" role="dialog" aria-modal="true">
        <div className="tour-modal tour-continue-modal">
          <div className="tour-continue-header">
            <span className="tour-continue-icon">✨</span>
            <h2>Page Tour Complete!</h2>
          </div>
          <div className="tour-continue-content">
            {hasNextPage ? (
              <>
                <p>
                  You've explored this page. Would you like to continue with the <strong>{currentTour.pageName}</strong> tour?
                </p>
                <div className="tour-continue-actions">
                  <button 
                    className="tour-btn tour-btn-secondary"
                    onClick={finishInteractiveTour}
                  >
                    Finish Tour
                  </button>
                  <button 
                    className="tour-btn tour-btn-primary"
                    onClick={continueToNextPage}
                  >
                    Continue to {currentTour.pageName} →
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>
                  You've completed the interactive tour of all pages!
                </p>
                <div className="tour-continue-actions">
                  <button 
                    className="tour-btn tour-btn-primary"
                    onClick={finishInteractiveTour}
                  >
                    Finish Tour
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interactive tour - show step tooltip with dimmed background
  if (tourPhase === 'interactive' && currentPageTour) {
    const currentTour = pageTours[currentPageTour];
    const currentInteractiveStep = currentTour?.steps[interactiveStep];
    const hasInputValidation = !keepDemoData && currentInteractiveStep?.inputSelector;
    
    if (currentInteractiveStep) {
      return (
        <>
          {/* Dimmed background overlay */}
          <div className="tour-interactive-overlay" />
          
          {/* Tooltip */}
          <div 
            ref={tooltipRef}
            className={`tour-tooltip-container ${isDragging ? 'tour-dragging' : ''}`}
            style={tooltipPosition ? {
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              bottom: 'auto',
              transform: 'none'
            } : undefined}
          >
            <div className="tour-tooltip">
              <div 
                className="tour-tooltip-header tour-draggable"
                onMouseDown={handleDragStart}
                title="Drag to move"
              >
                <h3>{currentInteractiveStep.title}</h3>
                <div className="tour-tooltip-skip-options">
                  <button 
                    className="tour-tooltip-skip tour-tooltip-skip-step"
                    onClick={skipCurrentPage}
                    aria-label="Skip this page"
                    title="Skip this page"
                  >
                    Skip Page
                  </button>
                  <button 
                    className="tour-tooltip-skip"
                    onClick={skipInteractiveTour}
                    aria-label="Skip entire tour"
                    title="Skip entire tour"
                  >
                    Skip Tour
                  </button>
                </div>
              </div>
              <p>{currentInteractiveStep.description}</p>
              {hasInputValidation && (
                <p className="tour-tooltip-hint">
                  <span className="tour-hint-icon">✏️</span>
                  Enter a value in the highlighted field to continue
                </p>
              )}
              {waitingForUserClick && (
                <p className="tour-tooltip-hint">
                  <span className="tour-hint-icon">👆</span>
                  Click the highlighted button to continue
                </p>
              )}
              {currentInteractiveStep?.requiresAction && !actionCompleted && (
                <p className="tour-tooltip-hint">
                  <span className="tour-hint-icon">▶️</span>
                  Click the button to run the action, then click Next
                </p>
              )}
              {validationError && (
                <p className="tour-tooltip-error">
                  <span className="tour-error-icon">⚠️</span>
                  {validationError}
                </p>
              )}
              <div className="tour-tooltip-footer">
                <button
                  className="tour-btn tour-btn-secondary tour-btn-small"
                  onClick={handleInteractivePrev}
                  disabled={interactiveStep === 0 && !currentTour.previousPage}
                >
                  ← Back
                </button>
                <span className="tour-tooltip-count">
                  {interactiveStep + 1} / {currentTour.steps.length}
                </span>
                <button
                  className="tour-btn tour-btn-primary tour-btn-small"
                  onClick={handleInteractiveNext}
                >
                  {interactiveStep === currentTour.steps.length - 1 ? 'Done' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
  }

  if (showEndDialog) {
    // Data choice phase - ask about keeping/clearing demo data first
    if (tourPhase === 'data-choice') {
      return (
        <div className="tour-overlay" role="dialog" aria-modal="true" aria-labelledby="tour-end-title">
          <div className="tour-modal tour-end-modal">
            <div className="tour-end-header">
              <span className="tour-end-icon">🎉</span>
              <h2 id="tour-end-title">Overview Complete!</h2>
            </div>
            <div className="tour-end-content">
              <p>
                Great! You've seen an overview of Fire Tools. {hadExistingData ? 'You have existing data in the app.' : 'We\'ve loaded demo data so you can explore.'}
              </p>
              <p className="tour-end-question">
                <strong>What would you like to do?</strong>
              </p>
            </div>
            <div className="tour-end-actions">
              <button 
                className="tour-btn tour-btn-secondary"
                onClick={handleClearDataAndContinue}
              >
                <span className="tour-btn-icon">🗑️</span>
                Start Fresh
                <span className="tour-btn-hint">Clear all data</span>
              </button>
              {hadExistingData ? (
                <button 
                  className="tour-btn tour-btn-primary"
                  onClick={handleKeepCurrentDataAndContinue}
                >
                  <span className="tour-btn-icon">📁</span>
                  Keep My Data
                  <span className="tour-btn-hint">Keep your current data</span>
                </button>
              ) : (
                <button 
                  className="tour-btn tour-btn-primary"
                  onClick={handleKeepDataAndContinue}
                >
                  <span className="tour-btn-icon">✨</span>
                  Keep Demo Data
                  <span className="tour-btn-hint">Explore with sample data</span>
                </button>
              )}
            </div>
            <p className="tour-end-note">
              <span className="tour-note-icon">💡</span>
              You can restart this tour anytime from Settings → Restart Tour
            </p>
          </div>
        </div>
      );
    }
    
    // Interactive tour prompt - ask if user wants guided walkthrough
    if (tourPhase === 'interactive-prompt') {
      return (
        <div className="tour-overlay" role="dialog" aria-modal="true" aria-labelledby="tour-prompt-title">
          <div className="tour-modal tour-end-modal">
            <div className="tour-end-header">
              <span className="tour-end-icon">🎯</span>
              <h2 id="tour-prompt-title">Interactive Walkthrough</h2>
            </div>
            <div className="tour-end-content">
              <p>
                Would you like a hands-on walkthrough of each page? We'll guide you through the key features and show you how everything works.
              </p>
              <p className="tour-end-question">
                <strong>Learn by doing!</strong> We'll walk you through each tool step by step.
              </p>
            </div>
            <div className="tour-end-actions">
              <button 
                className="tour-btn tour-btn-secondary"
                onClick={finishWithoutInteractive}
              >
                <span className="tour-btn-icon">✨</span>
                Explore on My Own
                <span className="tour-btn-hint">Skip walkthrough</span>
              </button>
              <button 
                className="tour-btn tour-btn-primary"
                onClick={startInteractiveTour}
              >
                <span className="tour-btn-icon">🎯</span>
                Yes, Guide Me!
                <span className="tour-btn-hint">Interactive walkthrough</span>
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
