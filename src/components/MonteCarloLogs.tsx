import { useState, useMemo, Fragment } from 'react';
import { SimulationLogEntry, MonteCarloFixedParameters } from '../types/calculator';
import { MaterialIcon } from './MaterialIcon';
import { exportMonteCarloLogsToCSV, exportMonteCarloLogsToJSON } from '../utils/csvExport';
import { loadSettings } from '../utils/cookieSettings';
import { formatDisplayCurrency, formatDisplayPercent } from '../utils/numberFormatter';
import { PrivacyBlur } from './PrivacyBlur';

interface MonteCarloLogsProps {
  logs: SimulationLogEntry[];
  fixedParameters: MonteCarloFixedParameters;
  isPrivacyMode?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const MonteCarloLogs: React.FC<MonteCarloLogsProps> = ({ 
  logs, 
  fixedParameters,
  isPrivacyMode = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSimulations, setExpandedSimulations] = useState<Set<number>>(new Set());
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failure'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Load default currency from settings
  const defaultCurrency = useMemo(() => {
    const settings = loadSettings();
    return settings.currencySettings.defaultCurrency;
  }, []);

  // Filter logs based on success/failure filter
  const filteredLogs = useMemo(() => {
    if (filterSuccess === 'all') return logs;
    if (filterSuccess === 'success') return logs.filter(l => l.success);
    return logs.filter(l => !l.success);
  }, [logs, filterSuccess]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  // Get current page of logs
  const displayedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: 'all' | 'success' | 'failure') => {
    setFilterSuccess(newFilter);
    setCurrentPage(1);
  };

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Toggle simulation expansion (inline)
  const toggleSimulation = (simulationId: number) => {
    setExpandedSimulations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(simulationId)) {
        newSet.delete(simulationId);
      } else {
        newSet.add(simulationId);
      }
      return newSet;
    });
  };

  const handleDownloadCSV = () => {
    const csv = exportMonteCarloLogsToCSV(logs, fixedParameters);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monte-carlo-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const json = exportMonteCarloLogsToJSON(logs, fixedParameters);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monte-carlo-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="mc-logs-section" aria-labelledby="mc-logs-heading" data-tour="monte-carlo-logs">
      <button
        type="button"
        className="mc-logs-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="mc-logs-content"
      >
        <span className="mc-logs-title">
          <MaterialIcon name="list_alt" /> Simulation Logs
        </span>
        <span className="mc-logs-subtitle">
          {logs.length} simulations recorded
        </span>
        <span className="collapse-icon" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div id="mc-logs-content" className="mc-logs-content">
          <div className="mc-logs-header">
            <p className="mc-logs-description">
              <MaterialIcon name="info" /> These logs are temporary and will be cleared when you leave this page or refresh.
              Download them to keep a record of your simulations.
            </p>
            
            <div className="mc-logs-actions">
              <button
                type="button"
                className="mc-logs-download-btn"
                onClick={handleDownloadCSV}
                aria-label="Download logs as CSV file"
              >
                <MaterialIcon name="download" /> CSV
              </button>
              <button
                type="button"
                className="mc-logs-download-btn"
                onClick={handleDownloadJSON}
                aria-label="Download logs as JSON file"
              >
                <MaterialIcon name="download" /> JSON
              </button>
            </div>
          </div>

          <div className="mc-logs-controls">
            <div className="mc-logs-filter">
              <label htmlFor="log-filter">Filter:</label>
              <select
                id="log-filter"
                value={filterSuccess}
                onChange={(e) => handleFilterChange(e.target.value as 'all' | 'success' | 'failure')}
              >
                <option value="all">All Simulations ({logs.length})</option>
                <option value="success">Successful ({logs.filter(l => l.success).length})</option>
                <option value="failure">Failed ({logs.filter(l => !l.success).length})</option>
              </select>
            </div>

            <div className="mc-logs-page-size">
              <label htmlFor="page-size">Show:</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size} per page</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mc-logs-table-container">
            <table className="mc-logs-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Status</th>
                  <th scope="col">Years to FIRE</th>
                  <th scope="col">Final Portfolio</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log) => (
                  <Fragment key={log.simulationId}>
                    <tr 
                      className={expandedSimulations.has(log.simulationId) ? 'expanded' : ''}
                    >
                      <td>#{log.simulationId}</td>
                      <td>
                        <span className={`status-badge ${log.success ? 'success' : 'failure'}`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td>{log.yearsToFIRE !== null ? `${log.yearsToFIRE} years` : 'N/A'}</td>
                      <td>
                        <PrivacyBlur isPrivacyMode={isPrivacyMode}>
                          {formatDisplayCurrency(log.finalPortfolio, defaultCurrency)}
                        </PrivacyBlur>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="mc-logs-view-btn"
                          onClick={() => toggleSimulation(log.simulationId)}
                          aria-label={`View details for simulation ${log.simulationId}`}
                          aria-expanded={expandedSimulations.has(log.simulationId)}
                        >
                          <MaterialIcon name={expandedSimulations.has(log.simulationId) ? 'expand_less' : 'expand_more'} />
                        </button>
                      </td>
                    </tr>
                    {expandedSimulations.has(log.simulationId) && (
                      <tr className="mc-logs-inline-detail">
                        <td colSpan={5}>
                          <div className="mc-logs-detail-inline">
                            {/* Initial parameters summary */}
                            <div className="mc-logs-initial-params">
                              <h5>Initial Parameters</h5>
                              <div className="mc-logs-params-grid">
                                <span>Initial Savings: <PrivacyBlur isPrivacyMode={isPrivacyMode}>{formatDisplayCurrency(fixedParameters.initialSavings, defaultCurrency)}</PrivacyBlur></span>
                                <span>Stocks: {fixedParameters.stocksPercent}%</span>
                                <span>Bonds: {fixedParameters.bondsPercent}%</span>
                                <span>Cash: {fixedParameters.cashPercent}%</span>
                                <span>Expected Stock Return: {fixedParameters.expectedStockReturn}%</span>
                                <span>Expected Bond Return: {fixedParameters.expectedBondReturn}%</span>
                                <span>Withdrawal Rate: {fixedParameters.desiredWithdrawalRate}%</span>
                                <span>Stock Volatility: {fixedParameters.stockVolatility}%</span>
                                <span>Bond Volatility: {fixedParameters.bondVolatility}%</span>
                              </div>
                            </div>
                            {/* Yearly breakdown table */}
                            <div className="mc-logs-detail-table-container">
                              <table className="mc-logs-detail-table" role="grid">
                                <thead>
                                  <tr>
                                    <th scope="col">Year</th>
                                    <th scope="col">Age</th>
                                    <th scope="col">Stock Return</th>
                                    <th scope="col">Bond Return</th>
                                    <th scope="col">Portfolio Return</th>
                                    <th scope="col">Black Swan</th>
                                    <th scope="col">Expenses</th>
                                    <th scope="col">Labor Income</th>
                                    <th scope="col">Portfolio Value</th>
                                    <th scope="col">FIRE</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {log.yearlyData.map((yearData) => (
                                    <tr 
                                      key={yearData.year}
                                      className={yearData.isBlackSwan ? 'black-swan-year' : yearData.isFIREAchieved ? 'fire-achieved' : ''}
                                    >
                                      <td>{yearData.year}</td>
                                      <td>{yearData.age}</td>
                                      <td className={yearData.stockReturn < 0 ? 'negative' : 'positive'}>
                                        {formatDisplayPercent(yearData.stockReturn)}
                                      </td>
                                      <td className={yearData.bondReturn < 0 ? 'negative' : 'positive'}>
                                        {formatDisplayPercent(yearData.bondReturn)}
                                      </td>
                                      <td className={yearData.portfolioReturn < 0 ? 'negative' : 'positive'}>
                                        {formatDisplayPercent(yearData.portfolioReturn)}
                                      </td>
                                      <td>
                                        {yearData.isBlackSwan && (
                                          <span className="black-swan-indicator" title="Black Swan Event">
                                            <MaterialIcon name="warning" />
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <PrivacyBlur isPrivacyMode={isPrivacyMode}>
                                          {formatDisplayCurrency(yearData.expenses, defaultCurrency)}
                                        </PrivacyBlur>
                                      </td>
                                      <td>
                                        <PrivacyBlur isPrivacyMode={isPrivacyMode}>
                                          {formatDisplayCurrency(yearData.laborIncome, defaultCurrency)}
                                        </PrivacyBlur>
                                      </td>
                                      <td>
                                        <PrivacyBlur isPrivacyMode={isPrivacyMode}>
                                          {formatDisplayCurrency(yearData.portfolioValue, defaultCurrency)}
                                        </PrivacyBlur>
                                      </td>
                                      <td>
                                        {yearData.isFIREAchieved && (
                                          <span className="fire-indicator" title="FIRE Achieved">
                                            <MaterialIcon name="local_fire_department" />
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mc-logs-pagination">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="Go to first page"
              >
                <MaterialIcon name="first_page" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <MaterialIcon name="chevron_left" />
              </button>
              <span className="mc-logs-page-info">
                Page {currentPage} of {totalPages} ({filteredLogs.length} simulations)
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                <MaterialIcon name="chevron_right" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Go to last page"
              >
                <MaterialIcon name="last_page" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
