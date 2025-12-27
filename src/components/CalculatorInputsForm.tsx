import { CalculatorInputs } from '../types/calculator';
import { NumberInput } from './NumberInput';

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

  return (
    <div className="inputs-form">
      <h2>FIRE Calculator Inputs</h2>
      
      <div className="form-section">
        <h3>💰 Initial Values</h3>
        <div className="form-group">
          <label>Initial Savings / Portfolio Value (€)</label>
          <NumberInput
            value={inputs.initialSavings}
            onChange={(value) => handleChange('initialSavings', value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📊 Asset Allocation</h3>
        <div className="form-group">
          <label>Stocks (%)</label>
          <NumberInput
            value={inputs.stocksPercent}
            onChange={(value) => handleChange('stocksPercent', value)}
          />
        </div>
        <div className="form-group">
          <label>Bonds (%)</label>
          <NumberInput
            value={inputs.bondsPercent}
            onChange={(value) => handleChange('bondsPercent', value)}
          />
        </div>
        <div className="form-group">
          <label>Cash (%)</label>
          <NumberInput
            value={inputs.cashPercent}
            onChange={(value) => handleChange('cashPercent', value)}
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
          <label>Annual Labor Income (Net) (€)</label>
          <NumberInput
            value={inputs.annualLaborIncome}
            onChange={(value) => handleChange('annualLaborIncome', value)}
          />
        </div>
        <div className="form-group">
          <label>Labor Income Growth Rate (%)</label>
          <NumberInput
            value={inputs.laborIncomeGrowthRate}
            onChange={(value) => handleChange('laborIncomeGrowthRate', value)}
          />
        </div>
        <div className="form-group">
          <label>State Pension Income (Annual) (€)</label>
          <NumberInput
            value={inputs.statePensionIncome}
            onChange={(value) => handleChange('statePensionIncome', value)}
          />
        </div>
        <div className="form-group">
          <label>Private Pension Income (Annual) (€)</label>
          <NumberInput
            value={inputs.privatePensionIncome}
            onChange={(value) => handleChange('privatePensionIncome', value)}
          />
        </div>
        <div className="form-group">
          <label>Other Income (Annual) (€)</label>
          <NumberInput
            value={inputs.otherIncome}
            onChange={(value) => handleChange('otherIncome', value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>💸 Expenses & Savings</h3>
        <div className="form-group">
          <label>Current Annual Expenses (€)</label>
          <NumberInput
            value={inputs.currentAnnualExpenses}
            onChange={(value) => handleChange('currentAnnualExpenses', value)}
          />
        </div>
        <div className="form-group">
          <label>FIRE Annual Expenses (€)</label>
          <NumberInput
            value={inputs.fireAnnualExpenses}
            onChange={(value) => handleChange('fireAnnualExpenses', value)}
          />
        </div>
        <div className="form-group">
          <label>Savings Rate (%) <span className="calculated-label">- Auto-calculated</span></label>
          <input
            type="number"
            value={(inputs.savingsRate ?? 0).toFixed(2)}
            readOnly
            className="calculated-field"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>🎯 FIRE Target</h3>
        <div className="form-group">
          <label>Desired Withdrawal Rate (%)</label>
          <NumberInput
            value={inputs.desiredWithdrawalRate}
            onChange={(value) => handleChange('desiredWithdrawalRate', value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>📈 Expected Returns</h3>
        <div className="form-group">
          <label>Expected Stock Return (%)</label>
          <NumberInput
            value={inputs.expectedStockReturn}
            onChange={(value) => handleChange('expectedStockReturn', value)}
          />
        </div>
        <div className="form-group">
          <label>Expected Bond Return (%)</label>
          <NumberInput
            value={inputs.expectedBondReturn}
            onChange={(value) => handleChange('expectedBondReturn', value)}
          />
        </div>
        <div className="form-group">
          <label>Cash / Inflation Rate (%)</label>
          <NumberInput
            value={inputs.expectedCashReturn}
            onChange={(value) => handleChange('expectedCashReturn', value)}
          />
        </div>
      </div>

      <div className="form-section">
        <h3>👤 Personal Information</h3>
        <div className="form-group">
          <label>Year of Birth</label>
          <NumberInput
            value={inputs.yearOfBirth}
            onChange={(value) => handleChange('yearOfBirth', value)}
            allowDecimals={false}
          />
        </div>
        <div className="form-group">
          <label>Retirement Age for State Pension</label>
          <NumberInput
            value={inputs.retirementAge}
            onChange={(value) => handleChange('retirementAge', value)}
            allowDecimals={false}
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
