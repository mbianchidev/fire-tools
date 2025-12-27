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
    'Net Worth': p.portfolioValue,
    'FIRE Target': fireTarget,
  }));

  return (
    <div className="chart-container">
      <h3>Net Worth Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
          <Line type="monotone" dataKey="Net Worth" stroke="#4CAF50" strokeWidth={2} />
          <Line type="monotone" dataKey="FIRE Target" stroke="#ff9800" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
