import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearProjection } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';

interface IncomeExpensesChartProps {
  projections: YearProjection[];
}

export const IncomeExpensesChart: React.FC<IncomeExpensesChartProps> = ({ projections }) => {
  // Show data from birth to age 100, but highlight the working years
  const data = projections.map(p => ({
    year: p.year,
    age: p.age,
    'Labor Income': p.laborIncome,
    'Investment Yield': p.investmentYield,
    'Expenses': p.expenses,
  }));

  // Format large numbers for Y axis (e.g., 1M, 5M, 10M)
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className="chart-container">
      <h3>Income vs Expenses</h3>
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
          <Legend />
          <Bar dataKey="Labor Income" fill="#4CAF50" />
          <Bar dataKey="Investment Yield" fill="#2196F3" />
          <Bar dataKey="Expenses" fill="#f44336" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
