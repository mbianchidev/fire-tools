import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChartData } from '../types/assetAllocation';
import { formatCurrency, formatPercent } from '../utils/allocationCalculator';

interface AllocationChartProps {
  data: ChartData[];
  title: string;
  currency: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartData;
  }>;
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ data, title, currency }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <div className="empty-chart">No data to display</div>
      </div>
    );
  }

  const renderCustomLabel = (props: { name?: string; percentage?: number }) => {
    if (!props.name || props.percentage === undefined) return '';
    return `${props.name}: ${formatPercent(props.percentage)}`;
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="label"><strong>{data.name}</strong></p>
          <p className="value">{formatCurrency(data.value, currency)}</p>
          <p className="percentage">{formatPercent(data.percentage)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#667eea'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
