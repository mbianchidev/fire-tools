import { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';

interface DataManagementProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onLoadDemo?: () => void; // Optional for expense tracker
  defaultOpen?: boolean;
  /** File format for import/export - 'csv' or 'json'. Default is 'csv' */
  fileFormat?: 'csv' | 'json';
}

export const DataManagement: React.FC<DataManagementProps> = ({
  onExport,
  onImport,
  onReset,
  onLoadDemo,
  defaultOpen = false,
  fileFormat = 'csv',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const formatLabel = fileFormat.toUpperCase();
  const acceptType = fileFormat === 'json' ? '.json' : '.csv';

  return (
    <div id="section-data-management" className="data-management-section collapsible-section">
      <button 
        className="collapsible-header" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="data-management-content"
      >
        <h4>
          <MaterialIcon name="save" /> Data Management <span className="collapse-icon-small" aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
        </h4>
      </button>
      {isOpen && (
        <div id="data-management-content" className="data-management-content">
          {onLoadDemo && (
            <button 
              onClick={onLoadDemo} 
              className="action-btn" 
              style={{ 
                width: '100%', 
                marginBottom: '8px', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white'
              }}
              aria-label="Load demo expense data for the current year"
            >
              <MaterialIcon name="casino" /> Load Demo Data
            </button>
          )}
          <button 
            onClick={onExport} 
            className="action-btn export-btn" 
            style={{ width: '100%', marginBottom: '8px', justifyContent: 'center' }}
            aria-label={`Export calculator data to ${formatLabel} file`}
          >
            <MaterialIcon name="download" /> Export {formatLabel}
          </button>
          <label 
            className="action-btn import-btn" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget.querySelector('input') as HTMLInputElement)?.click();
              }
            }}
          >
            <MaterialIcon name="upload" /> Import {formatLabel}
            <input
              type="file"
              accept={acceptType}
              onChange={onImport}
              style={{ display: 'none' }}
              aria-label={`Import calculator data from ${formatLabel} file`}
            />
          </label>
          <button 
            onClick={onReset} 
            className="action-btn reset-btn" 
            style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', justifyContent: 'center' }}
            aria-label="Reset all calculator data to defaults"
          >
            <MaterialIcon name="refresh" /> Reset All Data
          </button>
        </div>
      )}
    </div>
  );
};
