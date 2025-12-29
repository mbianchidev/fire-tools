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
      <div className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        <h4>💾 Data Management <span className="collapse-icon-small">{isOpen ? '▼' : '▶'}</span></h4>
      </div>
      {isOpen && (
        <div className="data-management-content">
          <button onClick={onExport} className="action-btn export-btn" style={{ width: '100%', marginBottom: '8px' }}>
            📥 Export CSV
          </button>
          <label className="action-btn import-btn" style={{ width: '100%', display: 'block', textAlign: 'center', cursor: 'pointer', marginBottom: '8px' }}>
            📤 Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={onImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={onReset} className="action-btn reset-btn" style={{ width: '100%', backgroundColor: '#ef4444', color: 'white' }}>
            🔄 Reset All Data
          </button>
        </div>
      )}
    </div>
  );
};
