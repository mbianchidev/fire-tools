import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearProjection } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';

interface NetWorthChartProps {
  projections: YearProjection[];
  fireTarget: number;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ projections, fireTarget }) => {
  const data = projections.map(p => ({
    year: p.year,
    age: p.age,
    'Net Worth': p.portfolioValue,
    'FIRE Target': fireTarget,
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
      <h3>Net Worth Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line type="monotone" dataKey="Net Worth" stroke="#4CAF50" strokeWidth={2} />
          <Line type="monotone" dataKey="FIRE Target" stroke="#ff9800" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
