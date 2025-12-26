import { CalculatorInputs } from '../types/calculator';

interface CalculatorInputsProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
}

export const CalculatorInputsForm: React.FC<CalculatorInputsProps> = ({ inputs, onChange }) => {
  const handleChange = (field: keyof CalculatorInputs, value: number | boolean) => {
    onChange({ ...inputs, [field]: value });
  };

  return (
    <div className="inputs-form">
      <h2>FIRE Calculator Inputs</h2>
      
      <div className="form-section">
        <h3>💰 Initial Values</h3>
        <div className="form-group">
          <label>Initial Savings / Portfolio Value ($)</label>
          <input
            type="number"
            value={inputs.initialSavings}
            onChange={(e) => handleChange('initialSavings', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📊 Asset Allocation</h3>
        <div className="form-group">
          <label>Stocks (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.stocksPercent}
            onChange={(e) => handleChange('stocksPercent', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Bonds (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.bondsPercent}
            onChange={(e) => handleChange('bondsPercent', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Cash (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.cashPercent}
            onChange={(e) => handleChange('cashPercent', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="allocation-sum">
          Total: {inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent}%
          {Math.abs((inputs.stocksPercent + inputs.bondsPercent + inputs.cashPercent) - 100) > 0.01 && 
            <span className="warning"> ⚠️ Should equal 100%</span>
          }
        </div>
      </div>

      <div className="form-section">
        <h3>💵 Income</h3>
        <div className="form-group">
          <label>Annual Labor Income (Net) ($)</label>
          <input
            type="number"
            value={inputs.annualLaborIncome}
            onChange={(e) => handleChange('annualLaborIncome', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Labor Income Growth Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={inputs.laborIncomeGrowthRate}
            onChange={(e) => handleChange('laborIncomeGrowthRate', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>State Pension Income (Annual) ($)</label>
          <input
            type="number"
            value={inputs.statePensionIncome}
            onChange={(e) => handleChange('statePensionIncome', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Private Pension Income (Annual) ($)</label>
          <input
            type="number"
            value={inputs.privatePensionIncome}
            onChange={(e) => handleChange('privatePensionIncome', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Other Income (Annual) ($)</label>
          <input
            type="number"
            value={inputs.otherIncome}
            onChange={(e) => handleChange('otherIncome', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>💸 Expenses & Savings</h3>
        <div className="form-group">
          <label>Current Annual Expenses ($)</label>
          <input
            type="number"
            value={inputs.currentAnnualExpenses}
            onChange={(e) => handleChange('currentAnnualExpenses', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>FIRE Annual Expenses ($)</label>
          <input
            type="number"
            value={inputs.fireAnnualExpenses}
            onChange={(e) => handleChange('fireAnnualExpenses', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Savings Rate (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={inputs.savingsRate}
            onChange={(e) => handleChange('savingsRate', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>🎯 FIRE Target</h3>
        <div className="form-group">
          <label>Desired Withdrawal Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={inputs.desiredWithdrawalRate}
            onChange={(e) => handleChange('desiredWithdrawalRate', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📈 Expected Returns</h3>
        <div className="form-group">
          <label>Expected Stock Return (%)</label>
          <input
            type="number"
            step="0.1"
            value={inputs.expectedStockReturn}
            onChange={(e) => handleChange('expectedStockReturn', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Expected Bond Return (%)</label>
          <input
            type="number"
            step="0.1"
            value={inputs.expectedBondReturn}
            onChange={(e) => handleChange('expectedBondReturn', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Cash / Inflation Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={inputs.expectedCashReturn}
            onChange={(e) => handleChange('expectedCashReturn', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>👤 Personal Information</h3>
        <div className="form-group">
          <label>Year of Birth</label>
          <input
            type="number"
            value={inputs.yearOfBirth}
            onChange={(e) => handleChange('yearOfBirth', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="form-group">
          <label>Retirement Age for State Pension</label>
          <input
            type="number"
            value={inputs.retirementAge}
            onChange={(e) => handleChange('retirementAge', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>⚙️ Options</h3>
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
      </div>
    </div>
  );
};
