import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearProjection } from '../types/calculator';
import { formatCurrency } from '../utils/allocationCalculator';

interface IncomeExpensesChartProps {
  projections: YearProjection[];
}

export const IncomeExpensesChart: React.FC<IncomeExpensesChartProps> = ({ projections }) => {
  const data = projections.slice(0, 30).map(p => ({
    year: p.year,
    'Labor Income': p.laborIncome,
    'Investment Yield': p.investmentYield,
    'Expenses': p.expenses,
  }));

  return (
    <div className="chart-container">
      <h3>Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
          <Bar dataKey="Labor Income" fill="#4CAF50" />
          <Bar dataKey="Investment Yield" fill="#2196F3" />
          <Bar dataKey="Expenses" fill="#f44336" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
