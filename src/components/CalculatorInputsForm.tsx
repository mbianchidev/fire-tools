import { useState } from 'react';
import { CalculatorInputs } from '../types/calculator';
import { NumberInput } from './NumberInput';

interface CalculatorInputsProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
}

export const CalculatorInputsForm: React.FC<CalculatorInputsProps> = ({ inputs, onChange }) => {
  const [openSections, setOpenSections] = useState({
    initialValues: true,
    assetAllocation: true,
    income: true,
    expenses: true,
    fireTarget: true,
    expectedReturns: true,
    personalInfo: true,
    options: true,
  });

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
    
    onChange(newInputs);
  };

  return (
    <div className="inputs-form">
      <h2>FIRE Calculator Inputs</h2>
      
      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('initialValues')}
          aria-expanded={openSections.initialValues}
          aria-controls="initial-values-content"
        >
          <h3><span aria-hidden="true">💰</span> Initial Values <span className="collapse-icon-small" aria-hidden="true">{openSections.initialValues ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.initialValues && (<div id="initial-values-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="initial-savings">Initial Savings / Portfolio Value (€)</label>
          <NumberInput
            value={inputs.initialSavings}
            onChange={(value) => handleChange('initialSavings', value)}
          />
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
          <h3><span aria-hidden="true">📊</span> Asset Allocation <span className="collapse-icon-small" aria-hidden="true">{openSections.assetAllocation ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.assetAllocation && (<div id="asset-allocation-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="stocks-percent">Stocks (%)</label>
          <NumberInput
            value={inputs.stocksPercent}
            onChange={(value) => handleChange('stocksPercent', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bonds-percent">Bonds (%)</label>
          <NumberInput
            value={inputs.bondsPercent}
            onChange={(value) => handleChange('bondsPercent', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cash-percent">Cash (%)</label>
          <NumberInput
            value={inputs.cashPercent}
            onChange={(value) => handleChange('cashPercent', value)}
          />
        </div>
        <div className="allocation-sum" role="status" aria-live="polite">
          Total: {inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent}%
          {Math.abs((inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent) - 100) > 0.01 && 
            <span className="warning"> <span aria-hidden="true">⚠️</span> Should equal 100%</span>
          }
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('income')}
          aria-expanded={openSections.income}
          aria-controls="income-content"
        >
          <h3><span aria-hidden="true">💵</span> Income <span className="collapse-icon-small" aria-hidden="true">{openSections.income ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.income && (<div id="income-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="labor-income">Annual Labor Income (Net) (€)</label>
          <NumberInput
            value={inputs.annualLaborIncome}
            onChange={(value) => handleChange('annualLaborIncome', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="labor-income-growth">Labor Income Growth Rate (%)</label>
          <NumberInput
            value={inputs.laborIncomeGrowthRate}
            onChange={(value) => handleChange('laborIncomeGrowthRate', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="state-pension">State Pension Income (Annual) (€)</label>
          <NumberInput
            value={inputs.statePensionIncome}
            onChange={(value) => handleChange('statePensionIncome', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="private-pension">Private Pension Income (Annual) (€)</label>
          <NumberInput
            value={inputs.privatePensionIncome}
            onChange={(value) => handleChange('privatePensionIncome', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="other-income">Other Income (Annual) (€)</label>
          <NumberInput
            value={inputs.otherIncome}
            onChange={(value) => handleChange('otherIncome', value)}
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('expenses')}
          aria-expanded={openSections.expenses}
          aria-controls="expenses-content"
        >
          <h3><span aria-hidden="true">💸</span> Expenses & Savings <span className="collapse-icon-small" aria-hidden="true">{openSections.expenses ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.expenses && (<div id="expenses-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="current-expenses">Current Annual Expenses (€)</label>
          <NumberInput
            value={inputs.currentAnnualExpenses}
            onChange={(value) => handleChange('currentAnnualExpenses', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="fire-expenses">FIRE Annual Expenses (€)</label>
          <NumberInput
            value={inputs.fireAnnualExpenses}
            onChange={(value) => handleChange('fireAnnualExpenses', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="savings-rate">Savings Rate (%) <span className="calculated-label">- Auto-calculated</span></label>
          <input
            id="savings-rate"
            type="text"
            inputMode="decimal"
            value={(inputs.savingsRate ?? 0).toFixed(2)}
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
          onClick={() => toggleSection('fireTarget')}
          aria-expanded={openSections.fireTarget}
          aria-controls="fire-target-content"
        >
          <h3><span aria-hidden="true">🎯</span> FIRE Target <span className="collapse-icon-small" aria-hidden="true">{openSections.fireTarget ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.fireTarget && (<div id="fire-target-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="withdrawal-rate">Desired Withdrawal Rate (%)</label>
          <NumberInput
            value={inputs.desiredWithdrawalRate}
            onChange={(value) => handleChange('desiredWithdrawalRate', value)}
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
          <h3><span aria-hidden="true">📈</span> Expected Returns <span className="collapse-icon-small" aria-hidden="true">{openSections.expectedReturns ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.expectedReturns && (<div id="expected-returns-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="stock-return">Expected Stock Return (%)</label>
          <NumberInput
            value={inputs.expectedStockReturn}
            onChange={(value) => handleChange('expectedStockReturn', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bond-return">Expected Bond Return (%)</label>
          <NumberInput
            value={inputs.expectedBondReturn}
            onChange={(value) => handleChange('expectedBondReturn', value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cash-return">Cash / Inflation Rate (%)</label>
          <NumberInput
            value={inputs.expectedCashReturn}
            onChange={(value) => handleChange('expectedCashReturn', value)}
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('personalInfo')}
          aria-expanded={openSections.personalInfo}
          aria-controls="personal-info-content"
        >
          <h3><span aria-hidden="true">👤</span> Personal Information <span className="collapse-icon-small" aria-hidden="true">{openSections.personalInfo ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.personalInfo && (<div id="personal-info-content" className="form-section-content">
        <div className="form-group">
          <label htmlFor="year-of-birth">Year of Birth</label>
          <NumberInput
            value={inputs.yearOfBirth}
            onChange={(value) => handleChange('yearOfBirth', value)}
            allowDecimals={false}
          />
        </div>
        <div className="form-group">
          <label htmlFor="retirement-age">Retirement Age for State Pension</label>
          <NumberInput
            value={inputs.retirementAge}
            onChange={(value) => handleChange('retirementAge', value)}
            allowDecimals={false}
          />
        </div>
        </div>)}
      </div>

      <div className="form-section collapsible-section">
        <button 
          className="collapsible-header" 
          onClick={() => toggleSection('options')}
          aria-expanded={openSections.options}
          aria-controls="options-content"
        >
          <h3><span aria-hidden="true">⚙️</span> Options <span className="collapse-icon-small" aria-hidden="true">{openSections.options ? '▼' : '▶'}</span></h3>
        </button>
        {openSections.options && (<div id="options-content" className="form-section-content">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={inputs.stopWorkingAtFIRE}
              onChange={(e) => handleChange('stopWorkingAtFIRE', e.target.checked)}
            />
            Stop working when reaching FIRE number
          </label>
        </div>
        </div>)}
      </div>
    </div>
  );
};
