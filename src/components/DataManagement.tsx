import { useState } from 'react';

interface DataManagementProps {
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  defaultOpen?: boolean;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  onExport,
  onImport,
  onReset,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="data-management-section collapsible-section">
      <button 
        className="collapsible-header" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="data-management-content"
      >
        <h4>
          <span aria-hidden="true">💾</span> Data Management <span className="collapse-icon-small" aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
        </h4>
      </button>
      {isOpen && (
        <div id="data-management-content" className="data-management-content">
          <button 
            onClick={onExport} 
            className="action-btn export-btn" 
            style={{ width: '100%', marginBottom: '8px', justifyContent: 'center' }}
            aria-label="Export calculator data to CSV file"
          >
            <span aria-hidden="true">📥</span> Export CSV
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
            <span aria-hidden="true">📤</span> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={onImport}
              style={{ display: 'none' }}
              aria-label="Import calculator data from CSV file"
            />
          </label>
          <button 
            onClick={onReset} 
            className="action-btn reset-btn" 
            style={{ width: '100%', backgroundColor: '#ef4444', color: 'white', justifyContent: 'center' }}
            aria-label="Reset all calculator data to defaults"
          >
            <span aria-hidden="true">🔄</span> Reset All Data
          </button>
        </div>
      )}
    </div>
  );
};
