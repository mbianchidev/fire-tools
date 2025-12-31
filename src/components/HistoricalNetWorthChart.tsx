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

interface HistoricalNetWorthChartProps {
  variations: MonthlyVariation[];
  forecast: NetWorthForecast[];
  currency: SupportedCurrency;
  previousYearEnd: number | null;
}

// Helper to format currency for chart
function formatChartCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k`;
  }
  return amount.toFixed(0);
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
    
    // Add the last actual point as first forecast point for continuity
    const lastActual = actualData[actualData.length - 1];
    return [
      ...actualData,
      { ...lastActual, forecast: lastActual.netWorth },
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

  return (
    <div className="chart-container">
      <div className="chart-controls">
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
        <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#666' }}
            tickLine={{ stroke: '#e0e0e0' }}
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
        <div className="forecast-info">
          <span className="forecast-label">
            Forecast confidence: {forecast[0]?.confidenceLevel} 
            (based on {forecast[0]?.basedOnMonths} months of data)
          </span>
        </div>
      )}
    </div>
  );
}
