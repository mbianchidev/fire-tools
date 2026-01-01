import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  NetWorthTrackerData,
  AssetHolding,
  CashEntry,
  PensionEntry,
  FinancialOperation,
  createEmptyMonthlySnapshot,
  createEmptyNetWorthYearData,
  generateNetWorthId,
  ASSET_CLASSES,
  ACCOUNT_TYPES,
  PENSION_TYPES,
  OPERATION_TYPES,
  OperationType,
} from '../types/netWorthTracker';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../types/currency';
import {
  calculateMonthlyNetWorth,
  calculateMonthlyVariations,
  calculateNetWorthForecast,
  calculateYTDSummary,
} from '../utils/netWorthCalculator';
import {
  saveNetWorthTrackerData,
  loadNetWorthTrackerData,
} from '../utils/cookieStorage';
import { DataManagement } from './DataManagement';
import { HistoricalNetWorthChart } from './HistoricalNetWorthChart';
import './NetWorthTrackerPage.css';

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Helper to format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to format percentage
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Get default data
function getDefaultData(): NetWorthTrackerData {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return {
    years: [
      {
        year: currentYear,
        months: [createEmptyMonthlySnapshot(currentYear, currentMonth)],
        isArchived: false,
      },
    ],
    currentYear,
    currentMonth,
    defaultCurrency: 'EUR',
    settings: {
      showPensionInNetWorth: true,
      includeUnrealizedGains: true,
    },
  };
}

// Deep clone helper for immutable state updates
function deepCloneData(data: NetWorthTrackerData): NetWorthTrackerData {
  return JSON.parse(JSON.stringify(data));
}

export function NetWorthTrackerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [data, setData] = useState<NetWorthTrackerData>(() => {
    const saved = loadNetWorthTrackerData();
    if (saved) {
      return saved;
    }
    return getDefaultData();
  });
  
  // Get year/month from URL params or use current
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const urlYear = searchParams.get('year');
  const urlMonth = searchParams.get('month');
  
  const [selectedYear, setSelectedYear] = useState(() => {
    if (urlYear) {
      const year = parseInt(urlYear, 10);
      if (!isNaN(year) && year >= 1900 && year <= 2100) return year;
    }
    return currentYear;
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (urlMonth) {
      const month = parseInt(urlMonth, 10);
      if (!isNaN(month) && month >= 1 && month <= 12) return month;
    }
    return currentMonth;
  });
  
  // Dialog state
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showCashDialog, setShowCashDialog] = useState(false);
  const [showPensionDialog, setShowPensionDialog] = useState(false);
  const [showOperationDialog, setShowOperationDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetHolding | CashEntry | PensionEntry | FinancialOperation | null>(null);
  const [editingItemType, setEditingItemType] = useState<'asset' | 'cash' | 'pension' | 'operation' | null>(null);
  
  // How to use collapsed state
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);

  // Sync URL params when year/month changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('year', selectedYear.toString());
    newParams.set('month', selectedMonth.toString());
    setSearchParams(newParams, { replace: true });
  }, [selectedYear, selectedMonth, setSearchParams, searchParams]);

  // Save data whenever it changes
  useEffect(() => {
    saveNetWorthTrackerData(data);
  }, [data]);

  // Check if we're viewing a past period
  const isViewingPastPeriod = selectedYear < currentYear || 
    (selectedYear === currentYear && selectedMonth < currentMonth);

  // Navigate to current period
  const goToCurrentPeriod = useCallback(() => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
  }, [currentYear, currentMonth]);

  // Get current month data
  const currentMonthData = useMemo(() => {
    const yearData = data.years.find(y => y.year === selectedYear);
    if (!yearData) return null;
    return yearData.months.find(m => m.month === selectedMonth);
  }, [data, selectedYear, selectedMonth]);

  // Calculate net worth for current month
  const netWorthResult = useMemo(() => {
    if (!currentMonthData) {
      return { totalAssetValue: 0, totalCash: 0, totalPension: 0, totalTaxesPaid: 0, netWorth: 0 };
    }
    return calculateMonthlyNetWorth(currentMonthData, {
      includePension: data.settings.showPensionInNetWorth,
    });
  }, [currentMonthData, data.settings.showPensionInNetWorth]);

  // Get all months data for the selected year
  const allMonthsData = useMemo(() => {
    const yearData = data.years.find(y => y.year === selectedYear);
    return yearData?.months || [];
  }, [data, selectedYear]);

  // Calculate monthly variations
  const monthlyVariations = useMemo(() => {
    return calculateMonthlyVariations(allMonthsData);
  }, [allMonthsData]);

  // Calculate YTD summary
  const ytdSummary = useMemo(() => {
    return calculateYTDSummary(allMonthsData, selectedMonth);
  }, [allMonthsData, selectedMonth]);

  // Calculate forecast
  const forecast = useMemo(() => {
    return calculateNetWorthForecast(allMonthsData, 3);
  }, [allMonthsData]);

  // Get previous year's December value
  const previousYearEndValue = useMemo(() => {
    const prevYear = data.years.find(y => y.year === selectedYear - 1);
    if (!prevYear) return null;
    const december = prevYear.months.find(m => m.month === 12);
    if (!december) return null;
    return calculateMonthlyNetWorth(december).netWorth;
  }, [data, selectedYear]);

  // Get current month variation
  const currentMonthVariation = useMemo(() => {
    if (monthlyVariations.length === 0) return null;
    return monthlyVariations.find(v => v.month === `${SHORT_MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`);
  }, [monthlyVariations, selectedMonth, selectedYear]);

  // Ensure month exists (for "Log This Month" button)
  const handleAddMonth = useCallback(() => {
    setData(prev => {
      const newData = deepCloneData(prev);
      
      // Ensure year exists
      let yearData = newData.years.find(y => y.year === selectedYear);
      if (!yearData) {
        yearData = createEmptyNetWorthYearData(selectedYear);
        newData.years.push(yearData);
        newData.years.sort((a, b) => a.year - b.year);
      }
      
      // Ensure month exists
      let monthData = yearData.months.find(m => m.month === selectedMonth);
      if (!monthData) {
        monthData = createEmptyMonthlySnapshot(selectedYear, selectedMonth);
        yearData.months.push(monthData);
        yearData.months.sort((a, b) => a.month - b.month);
      }
      
      return newData;
    });
  }, [selectedYear, selectedMonth]);

  // Add asset
  const handleAddAsset = useCallback((asset: Omit<AssetHolding, 'id'>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      
      // Ensure year and month exist
      let yearData = newData.years.find(y => y.year === selectedYear);
      if (!yearData) {
        yearData = createEmptyNetWorthYearData(selectedYear);
        newData.years.push(yearData);
      }
      
      let monthData = yearData.months.find(m => m.month === selectedMonth);
      if (!monthData) {
        monthData = createEmptyMonthlySnapshot(selectedYear, selectedMonth);
        yearData.months.push(monthData);
      }
      
      const newAsset: AssetHolding = {
        ...asset,
        id: generateNetWorthId(),
      };
      monthData.assets.push(newAsset);
      
      return newData;
    });
    setShowAssetDialog(false);
  }, [selectedYear, selectedMonth]);

  // Add cash entry
  const handleAddCash = useCallback((cash: Omit<CashEntry, 'id'>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      
      let yearData = newData.years.find(y => y.year === selectedYear);
      if (!yearData) {
        yearData = createEmptyNetWorthYearData(selectedYear);
        newData.years.push(yearData);
      }
      
      let monthData = yearData.months.find(m => m.month === selectedMonth);
      if (!monthData) {
        monthData = createEmptyMonthlySnapshot(selectedYear, selectedMonth);
        yearData.months.push(monthData);
      }
      
      const newCash: CashEntry = {
        ...cash,
        id: generateNetWorthId(),
      };
      monthData.cashEntries.push(newCash);
      
      return newData;
    });
    setShowCashDialog(false);
  }, [selectedYear, selectedMonth]);

  // Add pension entry
  const handleAddPension = useCallback((pension: Omit<PensionEntry, 'id'>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      
      let yearData = newData.years.find(y => y.year === selectedYear);
      if (!yearData) {
        yearData = createEmptyNetWorthYearData(selectedYear);
        newData.years.push(yearData);
      }
      
      let monthData = yearData.months.find(m => m.month === selectedMonth);
      if (!monthData) {
        monthData = createEmptyMonthlySnapshot(selectedYear, selectedMonth);
        yearData.months.push(monthData);
      }
      
      const newPension: PensionEntry = {
        ...pension,
        id: generateNetWorthId(),
      };
      monthData.pensions.push(newPension);
      
      return newData;
    });
    setShowPensionDialog(false);
  }, [selectedYear, selectedMonth]);

  // Add operation
  const handleAddOperation = useCallback((operation: Omit<FinancialOperation, 'id'>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      
      let yearData = newData.years.find(y => y.year === selectedYear);
      if (!yearData) {
        yearData = createEmptyNetWorthYearData(selectedYear);
        newData.years.push(yearData);
      }
      
      let monthData = yearData.months.find(m => m.month === selectedMonth);
      if (!monthData) {
        monthData = createEmptyMonthlySnapshot(selectedYear, selectedMonth);
        yearData.months.push(monthData);
      }
      
      const newOperation: FinancialOperation = {
        ...operation,
        id: generateNetWorthId(),
      };
      monthData.operations.push(newOperation);
      
      return newData;
    });
    setShowOperationDialog(false);
  }, [selectedYear, selectedMonth]);

  // Update item handlers
  const handleUpdateAsset = useCallback((id: string, updates: Partial<AssetHolding>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.assets.findIndex(a => a.id === id);
          if (index !== -1) {
            monthData.assets[index] = { ...monthData.assets[index], ...updates };
            return newData;
          }
        }
      }
      return newData;
    });
    setEditingItem(null);
    setEditingItemType(null);
  }, []);

  const handleUpdateCash = useCallback((id: string, updates: Partial<CashEntry>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.cashEntries.findIndex(c => c.id === id);
          if (index !== -1) {
            monthData.cashEntries[index] = { ...monthData.cashEntries[index], ...updates };
            return newData;
          }
        }
      }
      return newData;
    });
    setEditingItem(null);
    setEditingItemType(null);
  }, []);

  const handleUpdatePension = useCallback((id: string, updates: Partial<PensionEntry>) => {
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.pensions.findIndex(p => p.id === id);
          if (index !== -1) {
            monthData.pensions[index] = { ...monthData.pensions[index], ...updates };
            return newData;
          }
        }
      }
      return newData;
    });
    setEditingItem(null);
    setEditingItemType(null);
  }, []);

  // Delete item handlers
  const handleDeleteAsset = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;
    
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.assets.findIndex(a => a.id === id);
          if (index !== -1) {
            monthData.assets.splice(index, 1);
            return newData;
          }
        }
      }
      return newData;
    });
  }, []);

  const handleDeleteCash = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this cash entry?')) return;
    
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.cashEntries.findIndex(c => c.id === id);
          if (index !== -1) {
            monthData.cashEntries.splice(index, 1);
            return newData;
          }
        }
      }
      return newData;
    });
  }, []);

  const handleDeletePension = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this pension entry?')) return;
    
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.pensions.findIndex(p => p.id === id);
          if (index !== -1) {
            monthData.pensions.splice(index, 1);
            return newData;
          }
        }
      }
      return newData;
    });
  }, []);

  const handleDeleteOperation = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this operation?')) return;
    
    setData(prev => {
      const newData = deepCloneData(prev);
      for (const yearData of newData.years) {
        for (const monthData of yearData.months) {
          const index = monthData.operations.findIndex(o => o.id === id);
          if (index !== -1) {
            monthData.operations.splice(index, 1);
            return newData;
          }
        }
      }
      return newData;
    });
  }, []);

  // Export data (simple JSON export for now)
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `net-worth-tracker-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const imported = JSON.parse(json) as NetWorthTrackerData;
        setData(imported);
        if (imported.currentYear) setSelectedYear(imported.currentYear);
        if (imported.currentMonth) setSelectedMonth(imported.currentMonth);
      } catch (error) {
        alert(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Reset data
  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all net worth tracker data? This cannot be undone.')) {
      const defaultData = getDefaultData();
      setData(defaultData);
      setSelectedYear(defaultData.currentYear);
      setSelectedMonth(defaultData.currentMonth);
    }
  };

  // Available years for selector
  const availableYears = useMemo(() => {
    const years = new Set(data.years.map(y => y.year));
    years.add(currentYear);
    for (let i = 1; i <= 5; i++) {
      years.add(currentYear - i);
    }
    years.add(currentYear + 1);
    return Array.from(years).sort((a, b) => b - a);
  }, [data, currentYear]);

  // Available months
  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, []);

  return (
    <div className="net-worth-tracker-page">
      <header className="page-header">
        <h1><span aria-hidden="true">📈</span> Net Worth Tracker</h1>
        <p>
          Track your financial operations and net worth on a monthly basis. Monitor assets, cash, pensions, and progress toward FIRE.
        </p>
      </header>

      <main className="net-worth-tracker-main" id="main-content">
        {/* How to Use Section */}
        <section className="allocation-info collapsible-section">
          <button 
            className="collapsible-header" 
            onClick={() => setIsHowToUseOpen(!isHowToUseOpen)}
            aria-expanded={isHowToUseOpen}
            aria-controls="how-to-use-content"
          >
            <h4><span aria-hidden="true">💡</span> How to Use <span className="collapse-icon-small" aria-hidden="true">{isHowToUseOpen ? '▼' : '▶'}</span></h4>
          </button>
          {isHowToUseOpen && (
            <ul id="how-to-use-content" className="how-to-use-content">
              <li><strong>Log Assets:</strong> Track stocks, ETFs, bonds with share count and price</li>
              <li><strong>Log Cash:</strong> Record bank accounts, brokerage cash, credit cards</li>
              <li><strong>Log Pensions:</strong> Track state, private, and employer pensions</li>
              <li><strong>Log Operations:</strong> Record dividends, purchases, sales, taxes, etc.</li>
              <li><strong>Monthly Snapshot:</strong> Update values at month end for historical tracking</li>
              <li><strong>View History:</strong> Navigate between months to see historical data</li>
            </ul>
          )}
        </section>

        {/* Data Management */}
        <DataManagement
          onExport={handleExport}
          onImport={handleImport}
          onReset={handleResetData}
          defaultOpen={false}
        />

        {/* Month/Year Selector */}
        <section className="period-selector" aria-labelledby="period-selector-heading">
          <h3 id="period-selector-heading" className="visually-hidden">Select Period</h3>
          <div className="selector-row">
            <div className="selector-group">
              <label htmlFor="year-select">Year:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="selector-group">
              <label htmlFor="month-select">Month:</label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>{MONTH_NAMES[month - 1]}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-add-month"
              onClick={handleAddMonth}
            >
              <span aria-hidden="true">➕</span> Log This Month
            </button>
            {isViewingPastPeriod && (
              <button
                className="btn-current-period"
                onClick={goToCurrentPeriod}
              >
                <span aria-hidden="true">📅</span> Back to Current Period
              </button>
            )}
          </div>
        </section>

        {/* Net Worth Summary Cards */}
        <section className="net-worth-summary" aria-labelledby="summary-heading">
          <h3 id="summary-heading">Net Worth Summary for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h3>
          <div className="net-worth-cards">
            <div className="net-worth-card assets">
              <span className="card-icon" aria-hidden="true">📊</span>
              <div className="card-content">
                <span className="card-label">Total Assets</span>
                <span className="card-value">{formatCurrency(netWorthResult.totalAssetValue, data.defaultCurrency)}</span>
                {currentMonthVariation && currentMonthVariation.assetValueChange !== 0 && (
                  <span className={`card-change ${currentMonthVariation.assetValueChange >= 0 ? 'positive' : 'negative'}`}>
                    {currentMonthVariation.assetValueChange >= 0 ? '+' : ''}{formatCurrency(currentMonthVariation.assetValueChange, data.defaultCurrency)}
                  </span>
                )}
              </div>
            </div>
            <div className="net-worth-card cash">
              <span className="card-icon" aria-hidden="true">💵</span>
              <div className="card-content">
                <span className="card-label">Total Cash</span>
                <span className="card-value">{formatCurrency(netWorthResult.totalCash, data.defaultCurrency)}</span>
                {currentMonthVariation && currentMonthVariation.cashChange !== 0 && (
                  <span className={`card-change ${currentMonthVariation.cashChange >= 0 ? 'positive' : 'negative'}`}>
                    {currentMonthVariation.cashChange >= 0 ? '+' : ''}{formatCurrency(currentMonthVariation.cashChange, data.defaultCurrency)}
                  </span>
                )}
              </div>
            </div>
            <div className="net-worth-card pension">
              <span className="card-icon" aria-hidden="true">🧓</span>
              <div className="card-content">
                <span className="card-label">Total Pension</span>
                <span className="card-value">{formatCurrency(netWorthResult.totalPension, data.defaultCurrency)}</span>
                {currentMonthVariation && currentMonthVariation.pensionChange !== 0 && (
                  <span className={`card-change ${currentMonthVariation.pensionChange >= 0 ? 'positive' : 'negative'}`}>
                    {currentMonthVariation.pensionChange >= 0 ? '+' : ''}{formatCurrency(currentMonthVariation.pensionChange, data.defaultCurrency)}
                  </span>
                )}
              </div>
            </div>
            <div className="net-worth-card total">
              <span className="card-icon" aria-hidden="true">💰</span>
              <div className="card-content">
                <span className="card-label">Net Worth</span>
                <span className="card-value">{formatCurrency(netWorthResult.netWorth, data.defaultCurrency)}</span>
                {currentMonthVariation && currentMonthVariation.changeFromPrevMonth !== 0 && (
                  <span className={`card-change ${currentMonthVariation.changeFromPrevMonth >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(currentMonthVariation.changePercent)} ({currentMonthVariation.changeFromPrevMonth >= 0 ? '+' : ''}{formatCurrency(currentMonthVariation.changeFromPrevMonth, data.defaultCurrency)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Data Entry Section */}
        <section className="data-entry-section">
          <div className="section-header">
            <h3>Monthly Data Entry</h3>
            <div className="entry-actions">
              <button className="btn-entry asset" onClick={() => setShowAssetDialog(true)}>
                <span aria-hidden="true">📊</span> Log Asset
              </button>
              <button className="btn-entry cash" onClick={() => setShowCashDialog(true)}>
                <span aria-hidden="true">💵</span> Log Cash
              </button>
              <button className="btn-entry pension" onClick={() => setShowPensionDialog(true)}>
                <span aria-hidden="true">🧓</span> Log Pension
              </button>
              <button className="btn-entry operation" onClick={() => setShowOperationDialog(true)}>
                <span aria-hidden="true">📝</span> Log Operation
              </button>
            </div>
          </div>

          {/* Data Tables */}
          <div className="data-tables">
            {/* Assets Table */}
            <div className="data-table-section">
              <h4><span aria-hidden="true">📊</span> Assets</h4>
              {currentMonthData && currentMonthData.assets.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Ticker</th>
                      <th>Class</th>
                      <th>Shares</th>
                      <th className="amount-col">Price</th>
                      <th className="amount-col">Value</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthData.assets.map(asset => (
                      <tr key={asset.id}>
                        <td>{asset.name}</td>
                        <td>{asset.ticker}</td>
                        <td>{ASSET_CLASSES.find(c => c.id === asset.assetClass)?.name || asset.assetClass}</td>
                        <td>{asset.shares.toLocaleString()}</td>
                        <td className="amount-col">{formatCurrency(asset.pricePerShare, asset.currency)}</td>
                        <td className="amount-col">{formatCurrency(asset.shares * asset.pricePerShare, asset.currency)}</td>
                        <td className="actions-col">
                          <button
                            className="btn-icon"
                            onClick={() => { setEditingItem(asset); setEditingItemType('asset'); setShowAssetDialog(true); }}
                            aria-label="Edit asset"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteAsset(asset.id)}
                            aria-label="Delete asset"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No assets recorded for this month. Click "Log Asset" to start tracking.</p>
                </div>
              )}
            </div>

            {/* Cash Table */}
            <div className="data-table-section">
              <h4><span aria-hidden="true">💵</span> Cash & Liquidity</h4>
              {currentMonthData && currentMonthData.cashEntries.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Type</th>
                      <th className="amount-col">Balance</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthData.cashEntries.map(cash => (
                      <tr key={cash.id}>
                        <td>{cash.accountName}</td>
                        <td>{ACCOUNT_TYPES.find(t => t.id === cash.accountType)?.name || cash.accountType}</td>
                        <td className="amount-col">{formatCurrency(cash.balance, cash.currency)}</td>
                        <td className="actions-col">
                          <button
                            className="btn-icon"
                            onClick={() => { setEditingItem(cash); setEditingItemType('cash'); setShowCashDialog(true); }}
                            aria-label="Edit cash entry"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteCash(cash.id)}
                            aria-label="Delete cash entry"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No cash entries recorded for this month. Click "Log Cash" to start tracking.</p>
                </div>
              )}
            </div>

            {/* Pensions Table */}
            <div className="data-table-section">
              <h4><span aria-hidden="true">🧓</span> Pensions</h4>
              {currentMonthData && currentMonthData.pensions.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th className="amount-col">Value</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthData.pensions.map(pension => (
                      <tr key={pension.id}>
                        <td>{pension.name}</td>
                        <td>{PENSION_TYPES.find(t => t.id === pension.pensionType)?.name || pension.pensionType}</td>
                        <td className="amount-col">{formatCurrency(pension.currentValue, pension.currency)}</td>
                        <td className="actions-col">
                          <button
                            className="btn-icon"
                            onClick={() => { setEditingItem(pension); setEditingItemType('pension'); setShowPensionDialog(true); }}
                            aria-label="Edit pension"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeletePension(pension.id)}
                            aria-label="Delete pension"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No pensions recorded for this month. Click "Log Pension" to start tracking.</p>
                </div>
              )}
            </div>

            {/* Operations Table */}
            <div className="data-table-section">
              <h4><span aria-hidden="true">📝</span> Financial Operations</h4>
              {currentMonthData && currentMonthData.operations.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="amount-col">Amount</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthData.operations.map(op => {
                      const opType = OPERATION_TYPES.find(t => t.id === op.type);
                      return (
                        <tr key={op.id}>
                          <td>{op.date}</td>
                          <td>{opType?.icon} {opType?.name || op.type}</td>
                          <td>{op.description}</td>
                          <td className={`amount-col ${opType?.isIncome ? 'positive' : 'negative'}`}>
                            {opType?.isIncome ? '+' : '-'}{formatCurrency(op.amount, op.currency)}
                          </td>
                          <td className="actions-col">
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDeleteOperation(op.id)}
                              aria-label="Delete operation"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No operations recorded for this month. Click "Log Operation" to start tracking.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Historical Net Worth Chart */}
        <section className="chart-section">
          <h3><span aria-hidden="true">📈</span> Historical Net Worth</h3>
          <HistoricalNetWorthChart
            variations={monthlyVariations}
            forecast={forecast}
            currency={data.defaultCurrency}
            previousYearEnd={previousYearEndValue}
          />
        </section>

        {/* YTD Summary */}
        {ytdSummary.averageMonthlyNetWorth > 0 && (
          <section className="fire-progress-section">
            <h3><span aria-hidden="true">🎯</span> Year-to-Date Progress</h3>
            <div className="fire-progress-content">
              <div className="fire-percentage">
                <div className="percentage">{formatPercent(ytdSummary.netWorthChangePercent)}</div>
                <div className="label">YTD Change</div>
              </div>
              <div className="fire-details">
                <div className="fire-detail-item">
                  <div className="value">{formatCurrency(ytdSummary.netWorthChange, data.defaultCurrency)}</div>
                  <div className="label">Net Worth Change</div>
                </div>
                <div className="fire-detail-item">
                  <div className="value">{formatCurrency(ytdSummary.averageMonthlyNetWorth, data.defaultCurrency)}</div>
                  <div className="label">Avg Monthly Net Worth</div>
                </div>
                <div className="fire-detail-item">
                  <div className="value">{previousYearEndValue ? formatCurrency(previousYearEndValue, data.defaultCurrency) : 'N/A'}</div>
                  <div className="label">Dec {selectedYear - 1}</div>
                </div>
              </div>
            </div>
            {ytdSummary.netWorthChangePercent !== 0 && (
              <div className="fire-progress-bar">
                <div 
                  className="fire-progress-fill" 
                  style={{ width: `${Math.min(Math.abs(ytdSummary.netWorthChangePercent), 100)}%` }}
                />
              </div>
            )}
          </section>
        )}

        {/* Asset Dialog */}
        {showAssetDialog && (
          <AssetDialog
            initialData={editingItemType === 'asset' ? editingItem as AssetHolding : undefined}
            onSubmit={editingItemType === 'asset' && editingItem 
              ? (data) => handleUpdateAsset((editingItem as AssetHolding).id, data)
              : handleAddAsset
            }
            onClose={() => { setShowAssetDialog(false); setEditingItem(null); setEditingItemType(null); }}
            defaultCurrency={data.defaultCurrency}
          />
        )}

        {/* Cash Dialog */}
        {showCashDialog && (
          <CashDialog
            initialData={editingItemType === 'cash' ? editingItem as CashEntry : undefined}
            onSubmit={editingItemType === 'cash' && editingItem 
              ? (data) => handleUpdateCash((editingItem as CashEntry).id, data)
              : handleAddCash
            }
            onClose={() => { setShowCashDialog(false); setEditingItem(null); setEditingItemType(null); }}
            defaultCurrency={data.defaultCurrency}
          />
        )}

        {/* Pension Dialog */}
        {showPensionDialog && (
          <PensionDialog
            initialData={editingItemType === 'pension' ? editingItem as PensionEntry : undefined}
            onSubmit={editingItemType === 'pension' && editingItem 
              ? (data) => handleUpdatePension((editingItem as PensionEntry).id, data)
              : handleAddPension
            }
            onClose={() => { setShowPensionDialog(false); setEditingItem(null); setEditingItemType(null); }}
            defaultCurrency={data.defaultCurrency}
          />
        )}

        {/* Operation Dialog */}
        {showOperationDialog && (
          <OperationDialog
            onSubmit={handleAddOperation}
            onClose={() => setShowOperationDialog(false)}
            defaultCurrency={data.defaultCurrency}
            defaultDate={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`}
          />
        )}
      </main>
    </div>
  );
}

// Asset Dialog Component
interface AssetDialogProps {
  initialData?: AssetHolding;
  onSubmit: (data: Omit<AssetHolding, 'id'>) => void;
  onClose: () => void;
  defaultCurrency: SupportedCurrency;
}

function AssetDialog({ initialData, onSubmit, onClose, defaultCurrency }: AssetDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [ticker, setTicker] = useState(initialData?.ticker || '');
  const [assetClass, setAssetClass] = useState<AssetHolding['assetClass']>(initialData?.assetClass || 'ETF');
  const [shares, setShares] = useState(initialData?.shares?.toString() || '');
  const [pricePerShare, setPricePerShare] = useState(initialData?.pricePerShare?.toString() || '');
  const [currency, setCurrency] = useState<SupportedCurrency>(initialData?.currency || defaultCurrency);
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedShares = parseFloat(shares);
    const parsedPrice = parseFloat(pricePerShare);
    
    if (isNaN(parsedShares) || parsedShares < 0) {
      alert('Please enter a valid number of shares');
      return;
    }
    
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price per share');
      return;
    }

    onSubmit({
      name,
      ticker: ticker.toUpperCase(),
      assetClass,
      shares: parsedShares,
      pricePerShare: parsedPrice,
      currency,
      note: note || undefined,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog net-worth-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2>{initialData ? 'Edit' : 'Log'} Asset</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-name">Name</label>
              <input
                id="asset-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Vanguard FTSE All-World"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="asset-ticker">Ticker</label>
              <input
                id="asset-ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="e.g., VWCE"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-class">Asset Class</label>
              <select
                id="asset-class"
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as AssetHolding['assetClass'])}
              >
                {ASSET_CLASSES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="asset-currency">Currency</label>
              <select
                id="asset-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="asset-shares">Number of Shares</label>
              <input
                id="asset-shares"
                type="number"
                min="0"
                step="0.0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="asset-price">Price per Share</label>
              <input
                id="asset-price"
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="asset-note">Note (optional)</label>
            <input
              id="asset-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">{initialData ? 'Update' : 'Log'} Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Cash Dialog Component
interface CashDialogProps {
  initialData?: CashEntry;
  onSubmit: (data: Omit<CashEntry, 'id'>) => void;
  onClose: () => void;
  defaultCurrency: SupportedCurrency;
}

function CashDialog({ initialData, onSubmit, onClose, defaultCurrency }: CashDialogProps) {
  const [accountName, setAccountName] = useState(initialData?.accountName || '');
  const [accountType, setAccountType] = useState<CashEntry['accountType']>(initialData?.accountType || 'SAVINGS');
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '');
  const [currency, setCurrency] = useState<SupportedCurrency>(initialData?.currency || defaultCurrency);
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) {
      alert('Please enter a valid balance');
      return;
    }

    onSubmit({
      accountName,
      accountType,
      balance: parsedBalance,
      currency,
      note: note || undefined,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog net-worth-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2>{initialData ? 'Edit' : 'Log'} Cash Entry</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cash-name">Account Name</label>
              <input
                id="cash-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Main Savings"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cash-type">Account Type</label>
              <select
                id="cash-type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as CashEntry['accountType'])}
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cash-balance">Balance</label>
              <input
                id="cash-balance"
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cash-currency">Currency</label>
              <select
                id="cash-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="cash-note">Note (optional)</label>
            <input
              id="cash-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">{initialData ? 'Update' : 'Log'} Cash Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Pension Dialog Component
interface PensionDialogProps {
  initialData?: PensionEntry;
  onSubmit: (data: Omit<PensionEntry, 'id'>) => void;
  onClose: () => void;
  defaultCurrency: SupportedCurrency;
}

function PensionDialog({ initialData, onSubmit, onClose, defaultCurrency }: PensionDialogProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [pensionType, setPensionType] = useState<PensionEntry['pensionType']>(initialData?.pensionType || 'STATE');
  const [currentValue, setCurrentValue] = useState(initialData?.currentValue?.toString() || '');
  const [currency, setCurrency] = useState<SupportedCurrency>(initialData?.currency || defaultCurrency);
  const [note, setNote] = useState(initialData?.note || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedValue = parseFloat(currentValue);
    if (isNaN(parsedValue) || parsedValue < 0) {
      alert('Please enter a valid pension value');
      return;
    }

    onSubmit({
      name,
      pensionType,
      currentValue: parsedValue,
      currency,
      note: note || undefined,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog net-worth-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2>{initialData ? 'Edit' : 'Log'} Pension</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pension-name">Pension Name</label>
              <input
                id="pension-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., State Pension"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pension-type">Pension Type</label>
              <select
                id="pension-type"
                value={pensionType}
                onChange={(e) => setPensionType(e.target.value as PensionEntry['pensionType'])}
              >
                {PENSION_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pension-value">Current Value</label>
              <input
                id="pension-value"
                type="number"
                min="0"
                step="0.01"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pension-currency">Currency</label>
              <select
                id="pension-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="pension-note">Note (optional)</label>
            <input
              id="pension-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">{initialData ? 'Update' : 'Log'} Pension</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Operation Dialog Component
interface OperationDialogProps {
  onSubmit: (data: Omit<FinancialOperation, 'id'>) => void;
  onClose: () => void;
  defaultCurrency: SupportedCurrency;
  defaultDate: string;
}

function OperationDialog({ onSubmit, onClose, defaultCurrency, defaultDate }: OperationDialogProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(defaultDate || today);
  const [type, setType] = useState<OperationType>('DIVIDEND');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>(defaultCurrency);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    onSubmit({
      date,
      type,
      description,
      amount: parsedAmount,
      currency,
      note: note || undefined,
    });
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog net-worth-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <h2>Log Financial Operation</h2>
          <button className="dialog-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="op-date">Date</label>
              <input
                id="op-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="op-type">Operation Type</label>
              <select
                id="op-type"
                value={type}
                onChange={(e) => setType(e.target.value as OperationType)}
              >
                {OPERATION_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="op-description">Description</label>
            <input
              id="op-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Q4 Dividend from VWCE"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="op-amount">Amount</label>
              <input
                id="op-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="op-currency">Currency</label>
              <select
                id="op-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              >
                {SUPPORTED_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group full-width">
            <label htmlFor="op-note">Note (optional)</label>
            <input
              id="op-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          
          <div className="dialog-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">Log Operation</button>
          </div>
        </form>
      </div>
    </div>
  );
}
