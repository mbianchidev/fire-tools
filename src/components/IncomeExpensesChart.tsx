import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearProjection } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';
import { calculateXAxisInterval, calculateBarSize } from '../utils/chartHelper';

interface IncomeExpensesChartProps {
  projections: YearProjection[];
  currentAge: number;
  zoomYears: number | 'all';
  onZoomChange: (years: number | 'all') => void;
  customZoomInput: string;
  onCustomZoomInputChange: (value: string) => void;
}

export const IncomeExpensesChart: React.FC<IncomeExpensesChartProps> = ({ 
  projections, 
  currentAge,
  zoomYears,
  onZoomChange,
  customZoomInput,
  onCustomZoomInputChange
}) => {
  // Filter data based on zoom level
  const getFilteredData = () => {
    let filtered = projections;
    
    if (zoomYears !== 'all') {
      filtered = projections.filter(p => p.age <= currentAge + zoomYears);
    }
    
    return filtered.map(p => ({
      year: p.year,
      age: p.age,
      'Labor Income': p.laborIncome,
      'Investment Yield': p.investmentYield,
      'State Pension': p.statePensionIncome,
      'Private Pension': p.privatePensionIncome,
      'Other Income': p.otherIncome,
      'Expenses': p.expenses,
    }));
  };

  const data = getFilteredData();

  // Format large numbers for Y axis (e.g., 1M, 5M, 10M)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const handleCustomZoomSubmit = () => {
    const years = parseInt(customZoomInput);
    if (!isNaN(years) && years > 0) {
      onZoomChange(years);
    }
  };

  const handleCustomZoomKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCustomZoomSubmit();
    }
  };

  const buttonStyle = (isActive: boolean) => ({
    padding: '5px 10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: isActive ? '#4CAF50' : 'white',
    color: isActive ? 'white' : 'black',
    cursor: 'pointer',
    fontSize: '12px',
  });

  return (
    <section className="chart-container" aria-labelledby="income-expenses-chart-heading">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 id="income-expenses-chart-heading">Income vs Expenses</h3>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }} role="group" aria-label="Chart zoom controls">
          <button
            onClick={() => onZoomChange(20)}
            className={`zoom-button ${zoomYears === 20 ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 20)}
            aria-pressed={zoomYears === 20}
            aria-label="Zoom to 20 years"
          >
            20 Years
          </button>
          <button
            onClick={() => onZoomChange(30)}
            className={`zoom-button ${zoomYears === 30 ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 30)}
            aria-pressed={zoomYears === 30}
            aria-label="Zoom to 30 years"
          >
            30 Years
          </button>
          <button
            onClick={() => onZoomChange(40)}
            className={`zoom-button ${zoomYears === 40 ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 40)}
            aria-pressed={zoomYears === 40}
            aria-label="Zoom to 40 years"
          >
            40 Years
          </button>
          <button
            onClick={() => onZoomChange('all')}
            className={`zoom-button ${zoomYears === 'all' ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 'all')}
            aria-pressed={zoomYears === 'all'}
            aria-label="Show all years"
          >
            All Years
          </button>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Custom"
            value={customZoomInput}
            onChange={(e) => onCustomZoomInputChange(e.target.value)}
            onKeyPress={handleCustomZoomKeyPress}
            onBlur={handleCustomZoomSubmit}
            style={{
              width: '70px',
              padding: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
            }}
            min="1"
            step="1"
            aria-label="Custom zoom in years"
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} aria-label="Income and expenses comparison chart over time" barSize={calculateBarSize(data.length)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="age" 
            label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
            interval={calculateXAxisInterval(data.length)}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            domain={[0, 'auto']}
            allowDataOverflow={false}
          />
          <Tooltip 
            formatter={(value) => formatCurrency(Number(value))} 
            labelFormatter={(label) => `Age ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: '12px' }} />
          <Bar dataKey="Labor Income" fill="#4CAF50" />
          <Bar dataKey="Investment Yield" fill="#2196F3" />
          <Bar dataKey="State Pension" fill="#9C27B0" />
          <Bar dataKey="Private Pension" fill="#FF9800" />
          <Bar dataKey="Other Income" fill="#00BCD4" />
          <Bar dataKey="Expenses" fill="#f44336" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
};
