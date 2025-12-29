import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearProjection } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';

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
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3>Income vs Expenses</h3>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button
            onClick={() => onZoomChange(20)}
            className={`zoom-button ${zoomYears === 20 ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 20)}
          >
            20 Years
          </button>
          <button
            onClick={() => onZoomChange(30)}
            className={`zoom-button ${zoomYears === 30 ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 30)}
          >
            30 Years
          </button>
          <button
            onClick={() => onZoomChange(40)}
            className={`zoom-button ${zoomYears === 40 ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 40)}
          >
            40 Years
          </button>
          <button
            onClick={() => onZoomChange('all')}
            className={`zoom-button ${zoomYears === 'all' ? 'active' : ''}`}
            style={buttonStyle(zoomYears === 'all')}
          >
            All Years
          </button>
          <input
            type="number"
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
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -5 }} />
          <YAxis 
            tickFormatter={formatYAxis}
            domain={[0, 'auto']}
            allowDataOverflow={false}
          />
          <Tooltip 
            formatter={(value) => formatCurrency(Number(value))} 
            labelFormatter={(label) => `Age ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey="Labor Income" fill="#4CAF50" />
          <Bar dataKey="Investment Yield" fill="#2196F3" />
          <Bar dataKey="Expenses" fill="#f44336" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
