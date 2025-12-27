import { CalculatorInputs } from '../types/calculator';

interface CalculatorInputsProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
}

export const CalculatorInputsForm: React.FC<CalculatorInputsProps> = ({ inputs, onChange }) => {
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

  // Safe number parsing that preserves zero and handles NaN gracefully
  const safeParseFloat = (value: string): number => {
    if (value === '' || value === '-' || value === '.') {
      return 0;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseInt = (value: string): number => {
    if (value === '' || value === '-') {
      return 0;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="inputs-form">
      <h2>FIRE Calculator Inputs</h2>
      
      <div className="form-section">
        <h3>💰 Initial Values</h3>
        <div className="form-group">
          <label htmlFor="initial-savings">Initial Savings / Portfolio Value (€)</label>
          <input
            id="initial-savings"
            type="number"
            value={inputs.initialSavings}
            onChange={(e) => handleChange('initialSavings', safeParseFloat(e.target.value))}
            aria-describedby="initial-savings-desc"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📊 Asset Allocation</h3>
        <div className="form-group">
          <label htmlFor="stocks-percent">Stocks (%)</label>
          <input
            id="stocks-percent"
            type="number"
            min="0"
            max="100"
            value={inputs.stocksPercent}
            onChange={(e) => handleChange('stocksPercent', safeParseFloat(e.target.value))}
            aria-describedby="allocation-sum"
          />
        </div>
        <div className="form-group">
          <label htmlFor="bonds-percent">Bonds (%)</label>
          <input
            id="bonds-percent"
            type="number"
            min="0"
            max="100"
            value={inputs.bondsPercent}
            onChange={(e) => handleChange('bondsPercent', safeParseFloat(e.target.value))}
            aria-describedby="allocation-sum"
          />
        </div>
        <div className="form-group">
          <label htmlFor="cash-percent">Cash (%)</label>
          <input
            id="cash-percent"
            type="number"
            min="0"
            max="100"
            value={inputs.cashPercent}
            onChange={(e) => handleChange('cashPercent', safeParseFloat(e.target.value))}
            aria-describedby="allocation-sum"
          />
        </div>
        <div className="allocation-sum" id="allocation-sum" role="status" aria-live="polite">
          Total: {inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent}%
          {Math.abs((inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent) - 100) > 0.01 && 
            <span className="warning"> ⚠️ Should equal 100%</span>
          }
        </div>
      </div>

      <div className="form-section">
        <h3>💵 Income</h3>
        <div className="form-group">
          <label htmlFor="annual-labor-income">Annual Labor Income (Net) (€)</label>
          <input
            id="annual-labor-income"
            type="number"
            value={inputs.annualLaborIncome}
            onChange={(e) => handleChange('annualLaborIncome', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="labor-income-growth-rate">Labor Income Growth Rate (%)</label>
          <input
            id="labor-income-growth-rate"
            type="number"
            step="0.1"
            value={inputs.laborIncomeGrowthRate}
            onChange={(e) => handleChange('laborIncomeGrowthRate', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="state-pension-income">State Pension Income (Annual) (€)</label>
          <input
            id="state-pension-income"
            type="number"
            value={inputs.statePensionIncome}
            onChange={(e) => handleChange('statePensionIncome', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="private-pension-income">Private Pension Income (Annual) (€)</label>
          <input
            id="private-pension-income"
            type="number"
            value={inputs.privatePensionIncome}
            onChange={(e) => handleChange('privatePensionIncome', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="other-income">Other Income (Annual) (€)</label>
          <input
            id="other-income"
            type="number"
            value={inputs.otherIncome}
            onChange={(e) => handleChange('otherIncome', safeParseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>💸 Expenses & Savings</h3>
        <div className="form-group">
          <label htmlFor="current-annual-expenses">Current Annual Expenses (€)</label>
          <input
            id="current-annual-expenses"
            type="number"
            value={inputs.currentAnnualExpenses}
            onChange={(e) => handleChange('currentAnnualExpenses', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="fire-annual-expenses">FIRE Annual Expenses (€)</label>
          <input
            id="fire-annual-expenses"
            type="number"
            value={inputs.fireAnnualExpenses}
            onChange={(e) => handleChange('fireAnnualExpenses', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="savings-rate">Savings Rate (%) <span className="calculated-label">- Auto-calculated</span></label>
          <input
            id="savings-rate"
            type="number"
            value={(inputs.savingsRate ?? 0).toFixed(1)}
            readOnly
            className="calculated-field"
            aria-readonly="true"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>🎯 FIRE Target</h3>
        <div className="form-group">
          <label htmlFor="desired-withdrawal-rate">Desired Withdrawal Rate (%)</label>
          <input
            id="desired-withdrawal-rate"
            type="number"
            step="0.1"
            value={inputs.desiredWithdrawalRate}
            onChange={(e) => handleChange('desiredWithdrawalRate', safeParseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📈 Expected Returns</h3>
        <div className="form-group">
          <label htmlFor="expected-stock-return">Expected Stock Return (%)</label>
          <input
            id="expected-stock-return"
            type="number"
            step="0.1"
            value={inputs.expectedStockReturn}
            onChange={(e) => handleChange('expectedStockReturn', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="expected-bond-return">Expected Bond Return (%)</label>
          <input
            id="expected-bond-return"
            type="number"
            step="0.1"
            value={inputs.expectedBondReturn}
            onChange={(e) => handleChange('expectedBondReturn', safeParseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="expected-cash-return">Cash / Inflation Rate (%)</label>
          <input
            id="expected-cash-return"
            type="number"
            step="0.1"
            value={inputs.expectedCashReturn}
            onChange={(e) => handleChange('expectedCashReturn', safeParseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>👤 Personal Information</h3>
        <div className="form-group">
          <label htmlFor="year-of-birth">Year of Birth</label>
          <input
            id="year-of-birth"
            type="number"
            value={inputs.yearOfBirth}
            onChange={(e) => handleChange('yearOfBirth', safeParseInt(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="retirement-age">Retirement Age for State Pension</label>
          <input
            id="retirement-age"
            type="number"
            value={inputs.retirementAge}
            onChange={(e) => handleChange('retirementAge', safeParseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>⚙️ Options</h3>
        <div className="form-group checkbox-group">
          <label htmlFor="stop-working-at-fire">
            <input
              id="stop-working-at-fire"
              type="checkbox"
              checked={inputs.stopWorkingAtFIRE}
              onChange={(e) => handleChange('stopWorkingAtFIRE', e.target.checked)}
            />
            Stop working when reaching FIRE number
          </label>
        </div>
      </div>
    </div>
  );
};
