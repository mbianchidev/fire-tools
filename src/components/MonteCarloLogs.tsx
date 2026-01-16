import { useState, useMemo } from 'react';
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

export const MonteCarloLogs: React.FC<MonteCarloLogsProps> = ({ 
  logs, 
  fixedParameters,
  isPrivacyMode = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<number | null>(null);
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failure'>('all');

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

  // Get selected simulation log
  const selectedLog = useMemo(() => {
    if (selectedSimulation === null) return null;
    return logs.find(l => l.simulationId === selectedSimulation) || null;
  }, [logs, selectedSimulation]);

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
    <section className="mc-logs-section" aria-labelledby="mc-logs-heading">
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

          <div className="mc-logs-filter">
            <label htmlFor="log-filter">Filter:</label>
            <select
              id="log-filter"
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value as 'all' | 'success' | 'failure')}
            >
              <option value="all">All Simulations ({logs.length})</option>
              <option value="success">Successful ({logs.filter(l => l.success).length})</option>
              <option value="failure">Failed ({logs.filter(l => !l.success).length})</option>
            </select>
          </div>

          <div className="mc-logs-table-container">
            <table className="mc-logs-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Status</th>
                  <th scope="col">Years to FIRE</th>
                  <th scope="col">Final Portfolio</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 100).map((log) => (
                  <tr 
                    key={log.simulationId}
                    className={selectedSimulation === log.simulationId ? 'selected' : ''}
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
                        onClick={() => setSelectedSimulation(
                          selectedSimulation === log.simulationId ? null : log.simulationId
                        )}
                        aria-label={`View details for simulation ${log.simulationId}`}
                        aria-expanded={selectedSimulation === log.simulationId}
                      >
                        <MaterialIcon name={selectedSimulation === log.simulationId ? 'expand_less' : 'expand_more'} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length > 100 && (
              <p className="mc-logs-truncation-note">
                Showing first 100 of {filteredLogs.length} simulations. Download the full logs for complete data.
              </p>
            )}
          </div>

          {selectedLog && (
            <div className="mc-logs-detail" role="region" aria-label={`Details for simulation ${selectedLog.simulationId}`}>
              <h4>Simulation #{selectedLog.simulationId} - Yearly Breakdown</h4>
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
                    {selectedLog.yearlyData.map((yearData) => (
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
          )}
        </div>
      )}
    </section>
  );
};
