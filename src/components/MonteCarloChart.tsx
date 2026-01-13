import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { MonteCarloResult } from '../types/calculator';
import { loadSettings } from '../utils/cookieSettings';
import { getCurrencySymbol } from '../utils/currencyConverter';

// Privacy placeholder for blurred values
const PRIVACY_PLACEHOLDER = '***';

interface MonteCarloChartProps {
  result: MonteCarloResult;
  isPrivacyMode?: boolean;
}

interface DistributionBin {
  range: string;
  count: number;
  isMedian: boolean;
}

export const MonteCarloChart: React.FC<MonteCarloChartProps> = ({ result, isPrivacyMode = false }) => {
  // Calculate distribution data for histogram
  const distributionData = useMemo(() => {
    const successfulYears = result.simulations
      .filter(s => s.yearsToFIRE !== null)
      .map(s => s.yearsToFIRE as number)
      .sort((a, b) => a - b);

    if (successfulYears.length === 0) {
      return { bins: [], stats: null };
    }

    // Use reduce instead of spread to avoid stack overflow with large arrays
    const minYears = successfulYears.reduce((min, y) => y < min ? y : min, successfulYears[0]);
    const maxYears = successfulYears.reduce((max, y) => y > max ? y : max, successfulYears[0]);
    const range = maxYears - minYears;
    
    // Create bins for histogram (aim for about 10-15 bins)
    const binCount = Math.min(Math.max(Math.ceil(range / 2), 5), 20);
    const binSize = Math.ceil(range / binCount) || 1;
    
    const bins: DistributionBin[] = [];
    for (let i = 0; i < binCount; i++) {
      const binStart = minYears + (i * binSize);
      const binEnd = binStart + binSize - 1;
      const count = successfulYears.filter(y => y >= binStart && y <= binEnd).length;
      
      bins.push({
        range: binSize === 1 ? `${binStart}` : `${binStart}-${binEnd}`,
        count,
        isMedian: result.medianYearsToFIRE >= binStart && result.medianYearsToFIRE <= binEnd,
      });
    }

    // Calculate statistics
    const sortedYears = [...successfulYears].sort((a, b) => a - b);
    const percentile10Index = Math.floor(sortedYears.length * 0.1);
    const percentile25Index = Math.floor(sortedYears.length * 0.25);
    const percentile75Index = Math.floor(sortedYears.length * 0.75);
    const percentile90Index = Math.floor(sortedYears.length * 0.9);

    return {
      bins,
      stats: {
        min: minYears,
        max: maxYears,
        median: result.medianYearsToFIRE,
        percentile10: sortedYears[percentile10Index] || minYears,
        percentile25: sortedYears[percentile25Index] || minYears,
        percentile75: sortedYears[percentile75Index] || maxYears,
        percentile90: sortedYears[percentile90Index] || maxYears,
        mean: successfulYears.reduce((a, b) => a + b, 0) / successfulYears.length,
      },
    };
  }, [result]);

  // Calculate final portfolio distribution
  const portfolioDistribution = useMemo(() => {
    const portfolios = result.simulations
      .map(s => s.finalPortfolio)
      .filter(p => p > 0)
      .sort((a, b) => a - b);

    if (portfolios.length === 0) {
      return null;
    }

    // Use reduce instead of spread to avoid stack overflow with large arrays
    const minPortfolio = portfolios.reduce((min, p) => p < min ? p : min, portfolios[0]);
    const maxPortfolio = portfolios.reduce((max, p) => p > max ? p : max, portfolios[0]);
    const medianIndex = Math.floor(portfolios.length / 2);
    const percentile10Index = Math.floor(portfolios.length * 0.1);
    const percentile90Index = Math.floor(portfolios.length * 0.9);

    return {
      min: minPortfolio,
      max: maxPortfolio,
      median: portfolios[medianIndex],
      percentile10: portfolios[percentile10Index],
      percentile90: portfolios[percentile90Index],
    };
  }, [result]);

  // Get currency symbol from settings - recalculated on each render to pick up changes
  const settings = loadSettings();
  const currencySymbol = getCurrencySymbol(settings.currencySettings.defaultCurrency);

  const formatCurrency = (value: number, forChart: boolean = false) => {
    if (isPrivacyMode && forChart) {
      return PRIVACY_PLACEHOLDER;
    }
    if (value >= 1000000) {
      return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
    }
    return `${currencySymbol}${value.toFixed(0)}`;
  };

  if (!distributionData.stats || distributionData.bins.length === 0) {
    return (
      <div className="monte-carlo-chart-placeholder">
        <p>No successful simulations to display distribution.</p>
      </div>
    );
  }

  return (
    <div className="monte-carlo-charts">
      <section className="chart-section" aria-labelledby="years-distribution-heading">
        <h4 id="years-distribution-heading">Years to FIRE Distribution</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={distributionData.bins} aria-label="Distribution of years to FIRE">
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2D36" />
            <XAxis 
              dataKey="range" 
              label={{ value: 'Years to FIRE', position: 'insideBottom', offset: -5, fill: '#94A3B8' }}
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              stroke="#3A3D46"
            />
            <YAxis 
              label={{ value: 'Simulations', angle: -90, position: 'insideLeft', fill: '#94A3B8' }}
              tick={{ fill: '#94A3B8' }}
              stroke="#3A3D46"
            />
            <Tooltip 
              formatter={(value) => [`${value} simulations`, 'Count']}
              labelFormatter={(label) => `Years: ${label}`}
              contentStyle={{ background: '#1A1D26', border: '1px solid #2DD4BF', borderRadius: '8px', color: '#F8FAFC' }}
              labelStyle={{ color: '#F8FAFC' }}
              itemStyle={{ color: '#F8FAFC' }}
            />
            <Legend wrapperStyle={{ paddingTop: '12px', color: '#F8FAFC' }} />
            <Bar 
              dataKey="count" 
              fill="#2DD4BF" 
              name="Simulations"
            />
            {distributionData.stats && (() => {
              const medianBinIndex = distributionData.bins.findIndex(b => b.isMedian);
              return medianBinIndex >= 0 ? (
                <ReferenceLine 
                  x={distributionData.bins[medianBinIndex].range}
                  stroke="#4B5563" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: 'Median', position: 'top', fill: '#4B5563' }}
                />
              ) : null;
            })()}
          </BarChart>
        </ResponsiveContainer>

        <div className="distribution-stats" role="table" aria-label="Years to FIRE statistics">
          <div className="stat-row" role="row">
            <span className="stat-label" role="cell">Best Case (10th percentile):</span>
            <span className="stat-value best-case" role="cell">{distributionData.stats.percentile10} years</span>
          </div>
          <div className="stat-row" role="row">
            <span className="stat-label" role="cell">25th Percentile:</span>
            <span className="stat-value" role="cell">{distributionData.stats.percentile25} years</span>
          </div>
          <div className="stat-row median" role="row">
            <span className="stat-label" role="cell">Median (50th percentile):</span>
            <span className="stat-value" role="cell">{distributionData.stats.median} years</span>
          </div>
          <div className="stat-row" role="row">
            <span className="stat-label" role="cell">75th Percentile:</span>
            <span className="stat-value" role="cell">{distributionData.stats.percentile75} years</span>
          </div>
          <div className="stat-row" role="row">
            <span className="stat-label" role="cell">Worst Case (90th percentile):</span>
            <span className="stat-value worst-case" role="cell">{distributionData.stats.percentile90} years</span>
          </div>
          <div className="stat-row" role="row">
            <span className="stat-label" role="cell">Mean:</span>
            <span className="stat-value" role="cell">{distributionData.stats.mean.toFixed(1)} years</span>
          </div>
        </div>
      </section>

      {portfolioDistribution && (
        <section className="chart-section" aria-labelledby="portfolio-stats-heading">
          <h4 id="portfolio-stats-heading">Final Portfolio Value Statistics</h4>
          <div className="distribution-stats" role="table" aria-label="Final portfolio value statistics">
            <div className="stat-row" role="row">
              <span className="stat-label" role="cell">Worst Case (10th percentile):</span>
              <span className="stat-value worst-case" role="cell">{isPrivacyMode ? PRIVACY_PLACEHOLDER : formatCurrency(portfolioDistribution.percentile10)}</span>
            </div>
            <div className="stat-row median" role="row">
              <span className="stat-label" role="cell">Median Portfolio:</span>
              <span className="stat-value" role="cell">{isPrivacyMode ? PRIVACY_PLACEHOLDER : formatCurrency(portfolioDistribution.median)}</span>
            </div>
            <div className="stat-row" role="row">
              <span className="stat-label" role="cell">Best Case (90th percentile):</span>
              <span className="stat-value best-case" role="cell">{isPrivacyMode ? PRIVACY_PLACEHOLDER : formatCurrency(portfolioDistribution.percentile90)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
