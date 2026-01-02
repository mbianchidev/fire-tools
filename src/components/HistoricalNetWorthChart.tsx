import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MonthlyVariation, NetWorthForecast } from '../types/netWorthTracker';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../types/currency';

export type ChartViewMode = 'ytd' | 'all';

interface HistoricalNetWorthChartProps {
  variations: MonthlyVariation[];
  forecast: NetWorthForecast[];
  currency: SupportedCurrency;
  previousYearEnd: number | null;
  viewMode: ChartViewMode;
  onViewModeChange: (mode: ChartViewMode) => void;
}

// Helper to format currency for chart
function formatChartCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  
  if (absAmount >= 1000000) {
    return `${sign}${(absAmount / 1000000).toFixed(1)}M`;
  }
  if (absAmount >= 1000) {
    return `${sign}${(absAmount / 1000).toFixed(0)}k`;
  }
  return `${sign}${absAmount.toFixed(0)}`;
}

// Get currency symbol
function getCurrencySymbol(currency: SupportedCurrency): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  return currencyInfo?.symbol || currency;
}

export function HistoricalNetWorthChart({
  variations,
  forecast,
  currency,
  previousYearEnd,
  viewMode,
  onViewModeChange,
}: HistoricalNetWorthChartProps) {
  const [showForecast, setShowForecast] = useState(true);

  // Combine actual and forecast data
  const chartData = useMemo(() => {
    const actual = variations.map(v => ({
      month: v.month,
      netWorth: v.netWorth,
      type: 'actual' as const,
    }));

    const forecastData = showForecast
      ? forecast.map(f => ({
          month: f.month,
          netWorth: f.projectedNetWorth,
          type: 'forecast' as const,
        }))
      : [];

    return [...actual, ...forecastData];
  }, [variations, forecast, showForecast]);

  // Separate lines for actual and forecast
  const actualData = useMemo(() => 
    chartData.filter(d => d.type === 'actual'), 
    [chartData]
  );

  const forecastData = useMemo(() => 
    chartData.filter(d => d.type === 'forecast'), 
    [chartData]
  );

  // Combined data for continuous line effect
  const combinedData = useMemo(() => {
    if (forecastData.length === 0 || actualData.length === 0) {
      return actualData;
    }
    
    // Add the last actual point with forecast value for continuity
    // But don't duplicate if the forecast starts at the same month
    const lastActual = actualData[actualData.length - 1];
    const firstForecast = forecastData[0];
    
    // If forecast starts at the same month as last actual, skip adding duplicate
    if (firstForecast && firstForecast.month === lastActual.month) {
      return [
        ...actualData,
        ...forecastData.map(f => ({ 
          month: f.month, 
          netWorth: f.month === lastActual.month ? lastActual.netWorth : undefined, 
          forecast: f.netWorth,
          type: 'forecast' as const 
        })),
      ];
    }
    
    // Modify the last actual point to also have forecast value for continuity
    // instead of adding a duplicate data point
    const actualWithBridge = actualData.map((d, i) => 
      i === actualData.length - 1 
        ? { ...d, forecast: d.netWorth }
        : d
    );
    
    return [
      ...actualWithBridge,
      ...forecastData.map(f => ({ 
        month: f.month, 
        netWorth: undefined, 
        forecast: f.netWorth,
        type: 'forecast' as const 
      })),
    ];
  }, [actualData, forecastData]);

  if (variations.length === 0) {
    return (
      <div className="chart-container">
        <div className="empty-state">
          <div className="empty-state-icon">📈</div>
          <h4>No Historical Data</h4>
          <p>Start tracking your net worth to see the historical chart.</p>
        </div>
      </div>
    );
  }

  const symbol = getCurrencySymbol(currency);

  // Custom tick formatter to split "Jan 2024" into two lines
  const renderCustomAxisTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
    const parts = payload.value.split(' ');
    const month = parts[0] || '';
    const year = parts[1] || '';
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill="#666" fontSize={11}>
          {month}
        </text>
        <text x={0} y={0} dy={26} textAnchor="middle" fill="#666" fontSize={10}>
          {year}
        </text>
      </g>
    );
  };

  // Get minimum months needed for high confidence
  const minMonthsForHighConfidence = 12;

  // For "All" view mode - get only the indices where year changes
  const yearChangeIndices = useMemo(() => {
    if (viewMode !== 'all') return new Set<number>();
    
    const indices = new Set<number>();
    let lastYear = '';
    
    combinedData.forEach((d, i) => {
      const parts = d.month.split(' ');
      const year = parts[1] || '';
      if (year !== lastYear) {
        indices.add(i);
        lastYear = year;
      }
    });
    
    return indices;
  }, [combinedData, viewMode]);

  // Custom tick formatter for "All" view mode - show only years at year changes
  const renderYearTick = ({ x, y, payload, index }: { x: number; y: number; payload: { value: string }; index: number }) => {
    // Only render if this is a year change point
    if (!yearChangeIndices.has(index)) {
      return null;
    }
    
    const parts = payload.value.split(' ');
    const year = parts[1] || '';
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={11}>
          {year}
        </text>
      </g>
    );
  };

  // Determine which tick formatter to use based on view mode
  const tickFormatter = viewMode === 'all' ? renderYearTick : renderCustomAxisTick;

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <div className="chart-view-mode">
          <label htmlFor="chart-view-mode">View:</label>
          <select
            id="chart-view-mode"
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as ChartViewMode)}
            className="view-mode-select"
          >
            <option value="ytd">Year-to-Date</option>
            <option value="all">All Historical Data</option>
          </select>
        </div>
        <label className="chart-toggle">
          <input
            type="checkbox"
            checked={showForecast}
            onChange={(e) => setShowForecast(e.target.checked)}
          />
          Show Forecast
        </label>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="month"
            tick={tickFormatter}
            tickLine={{ stroke: '#e0e0e0' }}
            height={50}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={{ stroke: '#e0e0e0' }}
            tickFormatter={(value) => `${symbol}${formatChartCurrency(value)}`}
            width={80}
          />
          <Tooltip
            formatter={(value, name) => {
              if (value === undefined || value === null) return ['-', name];
              return [
                `${symbol}${Number(value).toLocaleString()}`,
                name === 'netWorth' ? 'Net Worth' : 'Forecast',
              ];
            }}
            labelStyle={{ color: '#333', fontWeight: 'bold' }}
            contentStyle={{
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: '#666', fontSize: '12px' }}>
                {value === 'netWorth' ? 'Actual Net Worth' : 'Forecast'}
              </span>
            )}
          />
          
          {/* Previous year end reference line */}
          {previousYearEnd !== null && (
            <ReferenceLine
              y={previousYearEnd}
              stroke="#9c27b0"
              strokeDasharray="5 5"
              label={{
                value: `Prev Year: ${symbol}${formatChartCurrency(previousYearEnd)}`,
                position: 'right',
                fill: '#9c27b0',
                fontSize: 11,
              }}
            />
          )}

          {/* Actual net worth line */}
          <Line
            type="monotone"
            dataKey="netWorth"
            stroke="#667eea"
            strokeWidth={3}
            dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#667eea' }}
            name="netWorth"
            connectNulls={false}
          />

          {/* Forecast line */}
          {showForecast && forecastData.length > 0 && (
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#ff9800"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ff9800', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: '#ff9800' }}
              name="forecast"
              connectNulls={true}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Forecast confidence indicator */}
      {showForecast && forecast.length > 0 && (
        <div className={`forecast-confidence-box ${forecast[0]?.confidenceLevel?.toLowerCase() || 'low'}`}>
          <span className="forecast-confidence-icon">ℹ️</span>
          <span className="forecast-confidence-text">
            <strong>Forecast confidence: {forecast[0]?.confidenceLevel}</strong>
            {' '}(based on {forecast[0]?.basedOnMonths} months of data
            {forecast[0]?.basedOnMonths && forecast[0].basedOnMonths < minMonthsForHighConfidence && 
              `, ${minMonthsForHighConfidence - forecast[0].basedOnMonths} more needed for high confidence`})
          </span>
        </div>
      )}
    </div>
  );
}
