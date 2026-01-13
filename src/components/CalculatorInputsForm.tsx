import { useState, useEffect } from 'react';
import { CalculatorInputs } from '../types/calculator';
import { NumberInput } from './NumberInput';
import { SliderInput } from './SliderInput';
import { MaterialIcon } from './MaterialIcon';
import { calculateYearsOfExpenses } from '../utils/fireCalculator';
import { 
  calculateAnnualExpensesFromTracker, 
  calculateAnnualIncomeFromTracker 
} from '../utils/expenseTrackerIntegration';
import { loadSettings } from '../utils/cookieSettings';
import { getCurrencySymbol } from '../utils/currencyConverter';

interface AssetAllocationData {
  totalValue: number;
  stocksPercent: number;
  bondsPercent: number;
  cashPercent: number;
}

interface CalculatorInputsProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
  assetAllocationData?: AssetAllocationData; // Data from asset allocation page
}

export const CalculatorInputsForm: React.FC<CalculatorInputsProps> = ({ inputs, onChange, assetAllocationData }) => {
  // Get currency symbol from settings - recalculated on each render to pick up changes
  const settings = loadSettings();
  const currencySymbol = getCurrencySymbol(settings.currencySettings.defaultCurrency);

  const [openSections, setOpenSections] = useState({
    initialValues: !inputs.useAssetAllocationValue,
    assetAllocation: !inputs.useAssetAllocationValue,
    income: true,
    expenses: true,
    fireParams: true,
    expectedReturns: true,
    pension: true,
    options: true,
  });

  // Collapse Initial Values and Asset Allocation when "from asset allocation" is enabled
  useEffect(() => {
    if (inputs.useAssetAllocationValue) {
      setOpenSections(prev => ({
        ...prev,
        initialValues: false,
        assetAllocation: false,
      }));
    }
  }, [inputs.useAssetAllocationValue]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (field: keyof CalculatorInputs, value: number | boolean) => {
    const newInputs = { ...inputs, [field]: value };
    
    // Auto-calculate savings rate when income or expenses change
    if (field === 'annualLaborIncome' || field === 'currentAnnualExpenses') {
      const income = field === 'annualLaborIncome' ? value as number : inputs.annualLaborIncome;
      const expenses = field === 'currentAnnualExpenses' ? value as number : inputs.currentAnnualExpenses;
      
      if (income > 0) {
        const calculatedSavingsRate = ((income - expenses) / income) * 100;
        // Allow negative savings rate to represent deficit, but cap at 100% max
        newInputs.savingsRate = Math.min(100, calculatedSavingsRate);
      } else {
        // If income is 0, set savings rate to 0
        newInputs.savingsRate = 0;
      }
    }
    
    // Auto-calculate yearsOfExpenses when withdrawal rate changes
    if (field === 'desiredWithdrawalRate') {
      newInputs.yearsOfExpenses = calculateYearsOfExpenses(value as number);
    }
    
    onChange(newInputs);
  };

  // Calculate yearsOfExpenses from withdrawal rate (always derived, not user-editable)
  const calculatedYearsOfExpenses = calculateYearsOfExpenses(inputs.desiredWithdrawalRate);

  // Current year for age calculations
  const currentYear = new Date().getFullYear();

  // When using asset allocation data, show values from asset allocation page
  const effectivePortfolioValue = inputs.useAssetAllocationValue && assetAllocationData 
    ? assetAllocationData.totalValue 
    : inputs.initialSavings;
  const effectiveStocksPercent = inputs.useAssetAllocationValue && assetAllocationData 
    ? assetAllocationData.stocksPercent 
    : inputs.stocksPercent;
  const effectiveBondsPercent = inputs.useAssetAllocationValue && assetAllocationData 
    ? assetAllocationData.bondsPercent 
    : inputs.bondsPercent;
  const effectiveCashPercent = inputs.useAssetAllocationValue && assetAllocationData 
    ? assetAllocationData.cashPercent 
    : inputs.cashPercent;

  // When using expense tracker data, calculate from last 12 months
  const effectiveCurrentExpenses = inputs.useExpenseTrackerExpenses
    ? calculateAnnualExpensesFromTracker(undefined, Math.abs(inputs.expectedCashReturn))
    : inputs.currentAnnualExpenses;
  
  const effectiveLaborIncome = inputs.useExpenseTrackerIncome
    ? calculateAnnualIncomeFromTracker(undefined, inputs.laborIncomeGrowthRate)
    : inputs.annualLaborIncome;

  // Calculate effective savings rate based on whether expense tracker flags are enabled
  const effectiveSavingsRate = (() => {
    const income = effectiveLaborIncome;
    const expenses = effectiveCurrentExpenses;
    if (income > 0) {
      const rate = ((income - expenses) / income) * 100;
      return Math.min(100, rate);
    }
    return 0;
  })();

  return (
    <div className="inputs-form">
      <h2>FIRE Calculator Inputs</h2>
      
      <div className="form-section collapsible-section" data-tour="initial-savings">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('initialValues')}
          aria-expanded={openSections.initialValues}
          aria-controls="initial-values-content"
        >
          <h3>
            <MaterialIcon name="savings" /> Initial Values 
            {inputs.useAssetAllocationValue && <span className="calculated-label"> - From Asset Allocation</span>}
            <span className="collapse-icon-small" aria-hidden="true">{openSections.initialValues ? '▼' : '▶'}</span>
          </h3>
        </button>
        {openSections.initialValues && (<div id="initial-values-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="initial-savings">
            Initial Savings / Portfolio Value ({currencySymbol})
            {inputs.useAssetAllocationValue && <span className="calculated-label"> - From Asset Allocation</span>}
          </label>
          {inputs.useAssetAllocationValue ? (
            <input
              id="initial-savings"
              type="number"
              inputMode="decimal"
              value={effectivePortfolioValue.toFixed(2)}
              readOnly
              className="calculated-field"
              aria-readonly="true"
            />
          ) : (
            <NumberInput
              id="initial-savings"
              value={inputs.initialSavings}
              onChange={(value) => handleChange('initialSavings', value)}
            />
          )}
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('assetAllocation')}
          aria-expanded={openSections.assetAllocation}
          aria-controls="asset-allocation-content"
        >
          <h3>
            <MaterialIcon name="pie_chart" /> Asset Allocation 
            {inputs.useAssetAllocationValue && <span className="calculated-label"> - From Asset Allocation</span>}
            <span className="collapse-icon-small" aria-hidden="true">{openSections.assetAllocation ? '▼' : '▶'}</span>
          </h3>
        </button>
        {openSections.assetAllocation && (<div id="asset-allocation-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="stocks-percent">Stocks (%)</label>
          {inputs.useAssetAllocationValue ? (
            <input
              id="stocks-percent"
              type="number"
              inputMode="decimal"
              value={effectiveStocksPercent.toFixed(2)}
              readOnly
              className="calculated-field"
              aria-readonly="true"
            />
          ) : (
            <NumberInput
              id="stocks-percent"
              value={inputs.stocksPercent}
              onChange={(value) => handleChange('stocksPercent', value)}
            />
          )}
        </div>
        <div className="form-group">
          <label htmlFor="bonds-percent">Bonds (%)</label>
          {inputs.useAssetAllocationValue ? (
            <input
              id="bonds-percent"
              type="number"
              inputMode="decimal"
              value={effectiveBondsPercent.toFixed(2)}
              readOnly
              className="calculated-field"
              aria-readonly="true"
            />
          ) : (
            <NumberInput
              id="bonds-percent"
              value={inputs.bondsPercent}
              onChange={(value) => handleChange('bondsPercent', value)}
            />
          )}
        </div>
        <div className="form-group">
          <label htmlFor="cash-percent">Cash (%)</label>
          {inputs.useAssetAllocationValue ? (
            <input
              id="cash-percent"
              type="number"
              inputMode="decimal"
              value={effectiveCashPercent.toFixed(2)}
              readOnly
              className="calculated-field"
              aria-readonly="true"
            />
          ) : (
            <NumberInput
              id="cash-percent"
              value={inputs.cashPercent}
              onChange={(value) => handleChange('cashPercent', value)}
            />
          )}
        </div>
        <div className="allocation-sum" role="status" aria-live="polite">
          Total: {(effectiveStocksPercent + effectiveBondsPercent + effectiveCashPercent).toFixed(2)}%
          {Math.abs((effectiveStocksPercent + effectiveBondsPercent + effectiveCashPercent) - 100) > 0.01 && 
            <span className="warning"> <MaterialIcon name="warning" size="small" /> Should equal 100%</span>
          }
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section" data-tour="income-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('income')}
          aria-expanded={openSections.income}
          aria-controls="income-content"
        >
          <h3><MaterialIcon name="payments" /> Income <span className="collapse-icon-small" aria-hidden="true">{openSections.income ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.income && (<div id="income-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="labor-income">Current Annual Labor Income (Net) ({currencySymbol})</label>
          {inputs.useExpenseTrackerIncome ? (
            <input
              id="labor-income"
              type="number"
              inputMode="decimal"
              value={effectiveLaborIncome.toFixed(2)}
              readOnly
              className="calculated-field"
              aria-readonly="true"
            />
          ) : (
            <NumberInput
              id="labor-income"
              value={inputs.annualLaborIncome}
              onChange={(value) => handleChange('annualLaborIncome', value)}
            />
          )}
        </div>
        <div className="form-group">
          <label htmlFor="labor-income-growth">Labor Income Growth Rate (%)</label>
          <NumberInput
            id="labor-income-growth"
            value={inputs.laborIncomeGrowthRate}
            onChange={(value) => handleChange('laborIncomeGrowthRate', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="other-income">Side Income / Working After FIRE (Annual) ({currencySymbol})</label>
          <NumberInput
            id="other-income"
            value={inputs.otherIncome}
            onChange={(value) => handleChange('otherIncome', value)}
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('pension')}
          aria-expanded={openSections.pension}
          aria-controls="pension-content"
        >
          <h3><MaterialIcon name="account_balance" /> Pension <span className="collapse-icon-small" aria-hidden="true">{openSections.pension ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.pension && (<div id="pension-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="retirement-age">Retirement Age for State Pension</label>
          <NumberInput
            id="retirement-age"
            value={inputs.retirementAge}
            onChange={(value) => handleChange('retirementAge', value)}
            allowDecimals={false}
          />
        </div>
        <div className="form-group">
          <label htmlFor="state-pension">State Pension Income (Annual) ({currencySymbol})</label>
          <NumberInput
            id="state-pension"
            value={inputs.statePensionIncome}
            onChange={(value) => handleChange('statePensionIncome', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="private-pension">Private Pension Income (Annual) ({currencySymbol})</label>
          <NumberInput
            id="private-pension"
            value={inputs.privatePensionIncome}
            onChange={(value) => handleChange('privatePensionIncome', value)}
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section" data-tour="expenses-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('expenses')}
          aria-expanded={openSections.expenses}
          aria-controls="expenses-content"
        >
          <h3><MaterialIcon name="shopping_cart" /> Expenses & Savings <span className="collapse-icon-small" aria-hidden="true">{openSections.expenses ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.expenses && (<div id="expenses-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="current-expenses">Current Annual Expenses ({currencySymbol})</label>
          {inputs.useExpenseTrackerExpenses ? (
            <input
              id="current-expenses"
              type="number"
              inputMode="decimal"
              value={effectiveCurrentExpenses.toFixed(2)}
              readOnly
              className="calculated-field"
              aria-readonly="true"
            />
          ) : (
            <NumberInput
              id="current-expenses"
              value={inputs.currentAnnualExpenses}
              onChange={(value) => handleChange('currentAnnualExpenses', value)}
            />
          )}
        </div>
        <div className="form-group">
          <label htmlFor="fire-expenses">FIRE Annual Expenses ({currencySymbol})</label>
          <NumberInput
            id="fire-expenses"
            value={inputs.fireAnnualExpenses}
            onChange={(value) => handleChange('fireAnnualExpenses', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="savings-rate">Savings Rate (%) <span className="calculated-label">- Auto-calculated</span></label>
          <input
            id="savings-rate"
            type="number"
            inputMode="decimal"
            value={effectiveSavingsRate.toFixed(2)}
            readOnly
            className="calculated-field"
            aria-readonly="true"
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section" data-tour="fire-params">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('fireParams')}
          aria-expanded={openSections.fireParams}
          aria-controls="fire-params-content"
        >
          <h3><MaterialIcon name="gps_fixed" /> FIRE Parameters <span className="collapse-icon-small" aria-hidden="true">{openSections.fireParams ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.fireParams && (<div id="fire-params-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="current-age">Current Age</label>
          <NumberInput
            id="current-age"
            value={currentYear - inputs.yearOfBirth}
            onChange={(value) => handleChange('yearOfBirth', currentYear - value)}
            allowDecimals={false}
          />
        </div>
        <div className="form-group">
          <label htmlFor="withdrawal-rate">Desired Withdrawal Rate (%)</label>
          <NumberInput
            id="withdrawal-rate"
            value={inputs.desiredWithdrawalRate}
            onChange={(value) => handleChange('desiredWithdrawalRate', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="years-of-expenses">Years of Expenses Needed for FIRE <span className="calculated-label">- Auto-calculated</span></label>
          <input
            id="years-of-expenses"
            type="number"
            inputMode="decimal"
            value={calculatedYearsOfExpenses.toFixed(2)}
            readOnly
            className="calculated-field"
            aria-readonly="true"
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('expectedReturns')}
          aria-expanded={openSections.expectedReturns}
          aria-controls="expected-returns-content"
        >
          <h3><MaterialIcon name="trending_up" /> Expected Returns <span className="collapse-icon-small" aria-hidden="true">{openSections.expectedReturns ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.expectedReturns && (<div id="expected-returns-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="stock-return">Expected Stock Return (%)</label>
          <SliderInput
            id="stock-return"
            value={inputs.expectedStockReturn}
            onChange={(value) => handleChange('expectedStockReturn', value)}
            min={-10}
            max={20}
            step={0.1}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bond-return">Expected Bond Return (%)</label>
          <SliderInput
            id="bond-return"
            value={inputs.expectedBondReturn}
            onChange={(value) => handleChange('expectedBondReturn', value)}
            min={-5}
            max={15}
            step={0.1}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cash-return">Cash / Inflation Rate (%)</label>
          <SliderInput
            id="cash-return"
            value={inputs.expectedCashReturn}
            onChange={(value) => handleChange('expectedCashReturn', value)}
            min={-10}
            max={5}
            step={0.1}
          />
          {inputs.expectedCashReturn > 0 && (
            <div className="deflation-warning" role="alert">
              <MaterialIcon name="warning" /> A positive value indicates deflation. Long periods of deflation are historically rare - consider this carefully in your projections.
            </div>
          )}
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section" data-tour="options-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('options')}
          aria-expanded={openSections.options}
          aria-controls="options-content"
        >
          <h3><MaterialIcon name="settings" /> Options <span className="collapse-icon-small" aria-hidden="true">{openSections.options ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.options && (<div id="options-content" className="form-section-content">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={inputs.stopWorkingAtFIRE}
              onChange={(e) => handleChange('stopWorkingAtFIRE', e.target.checked)}
            />
            <span className="toggle-switch"></span>
            Stop working when reaching FIRE number
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={inputs.useAssetAllocationValue}
              onChange={(e) => handleChange('useAssetAllocationValue', e.target.checked)}
            />
            <span className="toggle-switch"></span>
            Use Asset Allocation portfolio value and allocation
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={inputs.useExpenseTrackerExpenses}
              onChange={(e) => handleChange('useExpenseTrackerExpenses', e.target.checked)}
            />
            <span className="toggle-switch"></span>
            Calculate current expenses from last 12 months of Expense Tracker
          </label>
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={inputs.useExpenseTrackerIncome}
              onChange={(e) => handleChange('useExpenseTrackerIncome', e.target.checked)}
            />
            <span className="toggle-switch"></span>
            Calculate labor income from last 12 months of Expense Tracker
          </label>
        </div>
        </div>)}
      </div>
    </div>
  );
};
