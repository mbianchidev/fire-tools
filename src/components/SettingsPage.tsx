import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type UserSettings } from '../utils/cookieSettings';
import { SUPPORTED_CURRENCIES, DEFAULT_FALLBACK_RATES, type SupportedCurrency } from '../types/currency';
import { ALL_COUNTRIES, isEUCountry } from '../types/country';
import { recalculateFallbackRates, convertAssetsToNewCurrency, convertNetWorthDataToNewCurrency, convertExpenseDataToNewCurrency, convertFireCalculatorInputsToNewCurrency } from '../utils/currencyConverter';
import { exportFireCalculatorToCSV, exportAssetAllocationToCSV, importFireCalculatorFromCSV, importAssetAllocationFromCSV, exportExpenseTrackerToCSV, importExpenseTrackerFromCSV, exportNetWorthTrackerToJSON, importNetWorthTrackerFromJSON } from '../utils/csvExport';
import { loadFireCalculatorInputs, loadAssetAllocation, saveFireCalculatorInputs, saveAssetAllocation, clearAllData, loadExpenseTrackerData, saveExpenseTrackerData, loadNetWorthTrackerData, saveNetWorthTrackerData } from '../utils/cookieStorage';
import { DEFAULT_INPUTS, getDemoNetWorthData, getDemoAssetAllocationData } from '../utils/defaults';
import { generateDemoExpenseData } from '../utils/demoExpenseData';
import { formatWithSeparator, validateNumberInput } from '../utils/inputValidation';
import { clearTourPreference } from '../utils/tourPreferences';
import { exportAllDataAsJSON, importAllDataFromJSON, serializeAllDataExport } from '../utils/dataExportImport';
import { loadNotificationState, updateNotificationPreferences, clearNotifications, addNotification } from '../utils/notificationStorage';
import { type NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification';
import { generateDemoTourNotifications } from '../utils/notificationGenerator';
import { Tooltip } from './Tooltip';
import { MaterialIcon } from './MaterialIcon';
import './SettingsPage.css';

interface SettingsPageProps {
  onSettingsChange?: (settings: UserSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onSettingsChange }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rateTextValues, setRateTextValues] = useState<Record<string, string>>({});
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);

  // Initialize rate text values when settings load, default currency, or decimal separator changes
  useEffect(() => {
    const textValues: Record<string, string> = {};
    SUPPORTED_CURRENCIES.filter(c => c.code !== settings.currencySettings.defaultCurrency).forEach((currency) => {
      const rate = settings.currencySettings.fallbackRates[currency.code] ?? DEFAULT_FALLBACK_RATES[currency.code];
      textValues[currency.code] = formatWithSeparator(rate, settings.decimalSeparator);
    });
    setRateTextValues(textValues);
  }, [settings.currencySettings.fallbackRates, settings.currencySettings.defaultCurrency, settings.decimalSeparator]);

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    
    // Load notification preferences
    const notifState = loadNotificationState();
    setNotificationPrefs(notifState.preferences);
    
    setIsLoading(false);
  }, []);

  // Show temporary message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Handle settings change
  const handleSettingChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    onSettingsChange?.(newSettings);
    showMessage('success', 'Settings saved!');
  };

  // Handle fallback rate change
  const handleFallbackRateChange = (currency: SupportedCurrency, rate: number) => {
    if (rate <= 0) {
      showMessage('error', 'Rate must be a positive number');
      return;
    }
    
    const newSettings = {
      ...settings,
      currencySettings: {
        ...settings.currencySettings,
        fallbackRates: {
          ...settings.currencySettings.fallbackRates,
          [currency]: rate,
        },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    onSettingsChange?.(newSettings);
    showMessage('success', `${currency} rate updated!`);
  };

  // Handle rate text input change (while typing)
  const handleRateTextChange = (currency: SupportedCurrency, textValue: string) => {
    setRateTextValues(prev => ({ ...prev, [currency]: textValue }));
  };

  // Handle rate text input blur (commit change)
  const handleRateTextBlur = (currency: SupportedCurrency) => {
    const textValue = rateTextValues[currency] || '';
    
    // Use shared validation function with decimal separator support
    const result = validateNumberInput(textValue, {
      min: 0.0001,
      allowNegative: false,
      allowDecimals: true,
      required: true,
      decimalSeparator: settings.decimalSeparator,
    });
    
    if (!result.isValid || result.parsedValue === undefined || result.parsedValue <= 0) {
      // Reset to current value on invalid input
      const currentRate = settings.currencySettings.fallbackRates[currency] ?? DEFAULT_FALLBACK_RATES[currency];
      setRateTextValues(prev => ({ 
        ...prev, 
        [currency]: formatWithSeparator(currentRate, settings.decimalSeparator) 
      }));
      showMessage('error', result.errorMessage || 'Rate must be a positive number');
      return;
    }
    
    handleFallbackRateChange(currency, result.parsedValue);
  };

  // Reset fallback rates to defaults
  const handleResetFallbackRates = () => {
    const newSettings = {
      ...settings,
      currencySettings: {
        ...settings.currencySettings,
        fallbackRates: { ...DEFAULT_FALLBACK_RATES },
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
    onSettingsChange?.(newSettings);
    showMessage('success', 'Fallback rates reset to defaults!');
  };

  // Export all data as a single JSON file
  const handleExportAllJSON = () => {
    try {
      const fireInputs = loadFireCalculatorInputs();
      const { assets, assetClassTargets } = loadAssetAllocation();
      const expenseData = loadExpenseTrackerData();
      const netWorthData = loadNetWorthTrackerData();
      
      const exportData = exportAllDataAsJSON(
        fireInputs,
        assets,
        assetClassTargets,
        expenseData,
        netWorthData,
        settings.currencySettings.defaultCurrency
      );
      
      const jsonString = serializeAllDataExport(exportData);
      downloadFile(jsonString, `fire-tools-all-data-${getDateString()}.json`, 'application/json');
      
      showMessage('success', 'All data exported as JSON successfully!');
    } catch (error) {
      showMessage('error', `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Export all data as separate CSV/JSON files (legacy behavior)
  const handleExportAll = () => {
    try {
      // Export FIRE Calculator data
      const fireInputs = loadFireCalculatorInputs() || DEFAULT_INPUTS;
      const fireCSV = exportFireCalculatorToCSV(fireInputs);
      downloadFile(fireCSV, `fire-calculator-data-${getDateString()}.csv`, 'text/csv');

      // Export Asset Allocation data
      const { assets, assetClassTargets } = loadAssetAllocation();
      if (assets && assetClassTargets) {
        const assetCSV = exportAssetAllocationToCSV(assets, assetClassTargets);
        downloadFile(assetCSV, `asset-allocation-data-${getDateString()}.csv`, 'text/csv');
      }

      // Export Cashflow Tracker data
      const expenseData = loadExpenseTrackerData();
      if (expenseData) {
        const expenseCSV = exportExpenseTrackerToCSV(expenseData);
        downloadFile(expenseCSV, `cashflow-tracker-data-${getDateString()}.csv`, 'text/csv');
      }

      // Export Net Worth Tracker data
      const netWorthData = loadNetWorthTrackerData();
      if (netWorthData) {
        const netWorthJSON = exportNetWorthTrackerToJSON(netWorthData);
        downloadFile(netWorthJSON, `net-worth-tracker-data-${getDateString()}.json`, 'application/json');
      }

      showMessage('success', 'Data exported as separate files successfully!');
    } catch (error) {
      showMessage('error', `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Import all data from a JSON file
  const handleImportAllJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const imported = importAllDataFromJSON(
          json,
          settings.currencySettings.defaultCurrency,
          settings.currencySettings.fallbackRates
        );
        
        // Save all imported data
        if (imported.fireCalculator) {
          saveFireCalculatorInputs(imported.fireCalculator);
        }
        if (imported.assetAllocation.assets && imported.assetAllocation.assetClassTargets) {
          saveAssetAllocation(imported.assetAllocation.assets, imported.assetAllocation.assetClassTargets);
        }
        if (imported.expenseTracker) {
          saveExpenseTrackerData(imported.expenseTracker);
        }
        if (imported.netWorthTracker) {
          saveNetWorthTrackerData(imported.netWorthTracker);
        }
        
        showMessage('success', 'All data imported successfully! Refresh pages to see changes.');
      } catch (error) {
        showMessage('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Helper to download file
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to get date string for filenames
  const getDateString = () => new Date().toISOString().split('T')[0];

  // Import FIRE Calculator data
  const handleImportFire = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const imported = importFireCalculatorFromCSV(csv);
        saveFireCalculatorInputs(imported);
        showMessage('success', 'FIRE Calculator data imported successfully!');
      } catch (error) {
        showMessage('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Import Asset Allocation data
  const handleImportAssets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const imported = importAssetAllocationFromCSV(csv);
        saveAssetAllocation(imported.assets, imported.assetClassTargets);
        showMessage('success', 'Asset Allocation data imported successfully!');
      } catch (error) {
        showMessage('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Import Cashflow Tracker data
  const handleImportCashflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const imported = importExpenseTrackerFromCSV(csv);
        saveExpenseTrackerData(imported);
        showMessage('success', 'Cashflow Tracker data imported successfully!');
      } catch (error) {
        showMessage('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Import Net Worth Tracker data
  const handleImportNetWorth = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const imported = importNetWorthTrackerFromJSON(json);
        saveNetWorthTrackerData(imported);
        showMessage('success', 'Net Worth Tracker data imported successfully!');
      } catch (error) {
        showMessage('error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Reset all data
  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset ALL data? This will clear all saved data from cookies and cannot be undone.')) {
      clearAllData();
      showMessage('success', 'All data has been reset!');
    }
  };

  // Load demo data
  const handleLoadDemoData = () => {
    if (confirm('This will overwrite your current data with demo data. Are you sure you want to continue?')) {
      try {
        // First, reset default currency to EUR and fallback rates BEFORE loading demo data
        // This ensures all demo data is loaded with EUR as the default currency
        const newSettings = {
          ...settings,
          currencySettings: {
            ...settings.currencySettings,
            defaultCurrency: 'EUR' as SupportedCurrency,
            fallbackRates: { ...DEFAULT_FALLBACK_RATES },
          },
        };
        setSettings(newSettings);
        saveSettings(newSettings);
        onSettingsChange?.(newSettings);
        
        // Load demo FIRE Calculator data
        saveFireCalculatorInputs(DEFAULT_INPUTS);
        
        // Load demo Asset Allocation data
        const { assets, assetClassTargets } = getDemoAssetAllocationData();
        saveAssetAllocation(assets, assetClassTargets);
        
        // Load demo Cashflow Tracker data with full year of randomized data
        const cashflowData = generateDemoExpenseData();
        saveExpenseTrackerData(cashflowData);
        
        // Load demo Net Worth Tracker data
        const netWorthData = getDemoNetWorthData();
        saveNetWorthTrackerData(netWorthData);
        
        showMessage('success', 'Demo data loaded successfully! Refresh the page to see the changes.');
      } catch (error) {
        showMessage('error', `Failed to load demo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Handle notification preference change
  const handleNotificationPrefChange = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    updateNotificationPreferences({ [key]: value });
    showMessage('success', 'Notification preferences saved!');
  };

  // Clear all notifications
  const handleClearNotifications = () => {
    if (confirm('Are you sure you want to clear all notifications? This cannot be undone.')) {
      clearNotifications();
      showMessage('success', 'All notifications cleared!');
    }
  };

  // Trigger test notifications
  const handleTriggerTestNotifications = () => {
    const testNotifications = generateDemoTourNotifications();
    testNotifications.forEach(notification => {
      addNotification(notification);
    });
    showMessage('success', `${testNotifications.length} test notifications created! Check the notification bell.`);
  };

  if (isLoading) {
    return <div className="settings-page loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1><MaterialIcon name="settings" /> Settings</h1>
        </div>

        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Account Settings */}
        <section className="settings-section">
          <h2><MaterialIcon name="person" /> Account</h2>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label htmlFor="accountName">Account Name</label>
              <Tooltip content="Choose a name for your portfolio that will appear in the app header and throughout the interface. This helps you identify your account, especially if you manage multiple portfolios.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <input
              id="accountName"
              type="text"
              value={settings.accountName}
              onChange={(e) => handleSettingChange('accountName', e.target.value)}
              maxLength={100}
              placeholder="My Portfolio"
            />
            <span className="setting-help">This name will be displayed throughout the app</span>
          </div>
        </section>

        {/* Display Settings */}
        <section className="settings-section">
          <h2><MaterialIcon name="palette" /> Display</h2>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label htmlFor="defaultCurrency">Default Currency</label>
              <Tooltip content="Select your preferred currency for all financial data. When you change currencies, all existing values (assets, expenses, net worth, and FIRE calculator inputs) will be automatically converted using current exchange rates.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <select
              id="defaultCurrency"
              value={settings.currencySettings.defaultCurrency}
              onChange={(e) => {
                const newCurrency = e.target.value as SupportedCurrency;
                const oldCurrency = settings.currencySettings.defaultCurrency;
                
                if (newCurrency === oldCurrency) {
                  return;
                }
                
                // Get current fallback rates before recalculation
                const currentRates = settings.currencySettings.fallbackRates;
                
                // Convert all asset values to the new currency BEFORE recalculating rates
                const { assets, assetClassTargets } = loadAssetAllocation();
                if (assets && assetClassTargets) {
                  const convertedAssets = convertAssetsToNewCurrency(assets, oldCurrency, newCurrency, currentRates);
                  saveAssetAllocation(convertedAssets, assetClassTargets);
                }
                
                // Convert Net Worth Tracker data
                const netWorthData = loadNetWorthTrackerData();
                if (netWorthData) {
                  const convertedNetWorth = convertNetWorthDataToNewCurrency(netWorthData, oldCurrency, newCurrency, currentRates);
                  saveNetWorthTrackerData(convertedNetWorth);
                }
                
                // Convert Expense Tracker data
                const expenseData = loadExpenseTrackerData();
                if (expenseData) {
                  const convertedExpense = convertExpenseDataToNewCurrency(expenseData, oldCurrency, newCurrency, currentRates);
                  saveExpenseTrackerData(convertedExpense);
                }
                
                // Convert FIRE Calculator inputs
                const fireInputs = loadFireCalculatorInputs();
                if (fireInputs) {
                  const convertedFireInputs = convertFireCalculatorInputsToNewCurrency(fireInputs, oldCurrency, newCurrency, currentRates);
                  saveFireCalculatorInputs(convertedFireInputs);
                }
                
                // Recalculate fallback rates relative to the new default currency
                const newFallbackRates = recalculateFallbackRates(
                  currentRates,
                  oldCurrency,
                  newCurrency
                );
                
                const newSettings = {
                  ...settings,
                  currencySettings: {
                    ...settings.currencySettings,
                    defaultCurrency: newCurrency,
                    fallbackRates: newFallbackRates,
                  },
                };
                setSettings(newSettings);
                saveSettings(newSettings);
                onSettingsChange?.(newSettings);
                showMessage('success', `Default currency changed to ${newCurrency}! All values converted.`);
              }}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            <span className="setting-help">This currency will be used as default across all pages</span>
          </div>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label>Decimal Separator</label>
              <Tooltip content="Choose how decimal numbers are formatted. Point format (1,000.00) is common in the US and UK. Comma format (1.000,00) is used in many European countries. This affects how you input and view numbers throughout the app.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${settings.decimalSeparator === '.' ? 'active' : ''}`}
                onClick={() => handleSettingChange('decimalSeparator', '.')}
              >
                Point (1,000.00)
              </button>
              <button
                className={`toggle-btn ${settings.decimalSeparator === ',' ? 'active' : ''}`}
                onClick={() => handleSettingChange('decimalSeparator', ',')}
              >
                Comma (1.000,00)
              </button>
            </div>
          </div>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label htmlFor="decimalPlaces">Decimal Places</label>
              <Tooltip content="Control the precision of small numbers. This setting only affects values below 1,000 to keep small amounts precise while keeping large amounts readable. For example, with 2 decimal places: 123.45 displays as '123.45' but 1,234.56 displays as '1,235'.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <select
              id="decimalPlaces"
              value={settings.decimalPlaces ?? 2}
              onChange={(e) => handleSettingChange('decimalPlaces', parseInt(e.target.value, 10))}
            >
              <option value={0}>0 (e.g., 123)</option>
              <option value={1}>1 (e.g., 123.4)</option>
              <option value={2}>2 (e.g., 123.45)</option>
              <option value={3}>3 (e.g., 123.456)</option>
              <option value={4}>4 (e.g., 123.4567)</option>
            </select>
            <span className="setting-help">Number of decimal places shown for values below 1,000. Values at or above 1,000 show no decimals.</span>
          </div>
        </section>

        {/* Privacy & Region Settings */}
        <section className="settings-section">
          <h2><MaterialIcon name="privacy_tip" /> Privacy & Region</h2>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label htmlFor="privacyMode">Privacy Mode</label>
              <Tooltip content="When enabled, sensitive financial data like net worth, income, and asset values will be blurred on screen. This is useful when sharing your screen or working in public. Expenses are not blurred.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${!settings.privacyMode ? 'active' : ''}`}
                onClick={() => handleSettingChange('privacyMode', false)}
              >
                <MaterialIcon name="visibility" size="small" /> Show Values
              </button>
              <button
                className={`toggle-btn ${settings.privacyMode ? 'active' : ''}`}
                onClick={() => handleSettingChange('privacyMode', true)}
              >
                <MaterialIcon name="visibility_off" size="small" /> Hide Values
              </button>
            </div>
            <span className="setting-help">Blur sensitive financial data on screen for privacy</span>
          </div>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label htmlFor="country">Country</label>
              <Tooltip content="Select your country of residence. EU countries will receive UCITS compliance warnings when adding non-EU domiciled ETFs, as these may not be available to EU investors.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <select
              id="country"
              value={settings.country || ''}
              onChange={(e) => handleSettingChange('country', e.target.value || undefined)}
            >
              <option value="">Select country (optional)</option>
              <optgroup label="EU Countries">
                {ALL_COUNTRIES.filter(c => c.isEU).map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other Countries">
                {ALL_COUNTRIES.filter(c => !c.isEU).map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </optgroup>
            </select>
            {(() => {
              const isEU = settings.country && isEUCountry(settings.country);
              if (isEU) {
                return (
                  <span className="setting-help eu-notice">
                    <MaterialIcon name="info" size="small" /> EU resident: You'll receive UCITS compliance warnings for non-EU ETFs
                  </span>
                );
              } else if (settings.country) {
                return (
                  <span className="setting-help">Country set to {ALL_COUNTRIES.find(c => c.code === settings.country)?.name}</span>
                );
              }
              return null;
            })()}
          </div>
        </section>

        {/* Notification Settings */}
        <section className="settings-section">
          <h2><MaterialIcon name="notifications" /> Notifications</h2>
          
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label>Enable In-App Notifications</label>
              <Tooltip content="Control whether you receive in-app notifications for reminders like new months, tax deadlines, and financial milestones.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${notificationPrefs.enableInAppNotifications ? 'active' : ''}`}
                onClick={() => handleNotificationPrefChange('enableInAppNotifications', true)}
              >
                Enabled
              </button>
              <button
                className={`toggle-btn ${!notificationPrefs.enableInAppNotifications ? 'active' : ''}`}
                onClick={() => handleNotificationPrefChange('enableInAppNotifications', false)}
              >
                Disabled
              </button>
            </div>
          </div>

          {notificationPrefs.enableInAppNotifications && (
            <>
              <div className="setting-item">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.newMonthReminders}
                    onChange={(e) => handleNotificationPrefChange('newMonthReminders', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span>New Month Reminders</span>
                </label>
                <span className="setting-help">Remind to update financial data at the start of each month</span>
              </div>

              <div className="setting-item">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.newQuarterReminders}
                    onChange={(e) => handleNotificationPrefChange('newQuarterReminders', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span>New Quarter Reminders</span>
                </label>
                <span className="setting-help">Remind to review quarterly performance</span>
              </div>

              <div className="setting-item">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.taxReminders}
                    onChange={(e) => handleNotificationPrefChange('taxReminders', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span>Tax Payment Reminders</span>
                </label>
                <span className="setting-help">Remind about upcoming tax deadlines</span>
              </div>

              <div className="setting-item">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.dcaReminders}
                    onChange={(e) => handleNotificationPrefChange('dcaReminders', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span>DCA Investment Reminders</span>
                </label>
                <span className="setting-help">Remind about regular investment contributions</span>
              </div>

              <div className="setting-item">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.fireMilestones}
                    onChange={(e) => handleNotificationPrefChange('fireMilestones', e.target.checked)}
                  />
                  <span className="toggle-switch"></span>
                  <span>FIRE Milestone Alerts</span>
                </label>
                <span className="setting-help">Get notified when you reach FIRE milestones (25%, 50%, 75%, 100%)</span>
              </div>
            </>
          )}}

          <div className="setting-item">
            <div className="subsection-header-with-tooltip">
              <h3><MaterialIcon name="science" /> Test Mode</h3>
              <Tooltip content="Trigger sample notifications to test the notification system. This will add demo notifications to your notification bell so you can see how they look and work.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <p className="setting-help">Create sample notifications to test the notification UI</p>
            <button className="secondary-btn" onClick={handleTriggerTestNotifications}>
              <MaterialIcon name="notifications_active" /> Trigger Test Notifications
            </button>
          </div>

          <div className="setting-item">
            <button className="secondary-btn" onClick={handleClearNotifications}>
              <MaterialIcon name="delete" /> Clear All Notifications
            </button>
          </div>
        </section>

        {/* Email Preferences */}
        <section className="settings-section">
          <h2><MaterialIcon name="email" /> Email Preferences</h2>
          <div className="setting-item">
            <div className="label-with-tooltip">
              <label>Email Notifications</label>
              <Tooltip content="Email notifications require a server to send emails. Since Fire Tools is a client-side only application, email functionality is currently a placeholder for future development.">
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${notificationPrefs.enableEmailNotifications ? 'active' : ''}`}
                onClick={() => handleNotificationPrefChange('enableEmailNotifications', true)}
                disabled
              >
                Enabled
              </button>
              <button
                className={`toggle-btn ${!notificationPrefs.enableEmailNotifications ? 'active' : ''}`}
                onClick={() => handleNotificationPrefChange('enableEmailNotifications', false)}
              >
                Disabled
              </button>
            </div>
            <span className="setting-help">🚧 Email notifications are not yet available (requires server integration)</span>
          </div>

          {notificationPrefs.enableEmailNotifications && (
            <>
              <div className="setting-item">
                <label htmlFor="emailAddress">Email Address</label>
                <input
                  id="emailAddress"
                  type="email"
                  value={notificationPrefs.emailAddress}
                  onChange={(e) => handleNotificationPrefChange('emailAddress', e.target.value)}
                  placeholder="your@email.com"
                  disabled
                />
              </div>

              <div className="setting-item">
                <label htmlFor="emailFrequency">Email Frequency</label>
                <select
                  id="emailFrequency"
                  value={notificationPrefs.emailFrequency}
                  onChange={(e) => handleNotificationPrefChange('emailFrequency', e.target.value as NotificationPreferences['emailFrequency'])}
                  disabled
                >
                  <option value="NEVER">Never</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </>
          )}
        </section>

        {/* Currency Disclaimer - Moved before currency settings */}
        <section className="settings-section disclaimer">
          <h2><MaterialIcon name="warning" /> Disclaimer</h2>
          <p>
            Exchange rates are fetched from publicly available APIs and may not reflect real-time rates.
            Fallback rates are used when the API is unavailable. For accurate financial decisions,
            please verify rates with your financial institution.
          </p>
        </section>

        {/* Currency Settings */}
        <section className="settings-section">
          <div className="section-header-with-tooltip">
            <h2><MaterialIcon name="currency_exchange" /> Currency Conversion Fallback Rates</h2>
            <Tooltip content="These are backup exchange rates used when the live API is unavailable or slow. The app attempts to fetch real-time rates first. You can customize these rates based on your preferences or recent market rates." position="right" maxWidth={350}>
              <span className="info-icon section-info-icon" aria-label="More information">i</span>
            </Tooltip>
          </div>
          <p className="section-description">
            These rates are used when the live exchange rate API is unavailable.
            All values convert to {settings.currencySettings.defaultCurrency} (the default currency).
          </p>
          <div className="fallback-rates-grid">
            {SUPPORTED_CURRENCIES.filter(c => c.code !== settings.currencySettings.defaultCurrency).map((currency) => (
              <div key={currency.code} className="rate-item">
                <label htmlFor={`rate-${currency.code}`}>
                  {currency.code} ({currency.name})
                </label>
                <div className="rate-input-wrapper">
                  <span className="rate-prefix">1 {currency.code} =</span>
                  <input
                    id={`rate-${currency.code}`}
                    type="text"
                    value={rateTextValues[currency.code] ?? formatWithSeparator(
                      settings.currencySettings.fallbackRates[currency.code] ?? DEFAULT_FALLBACK_RATES[currency.code],
                      settings.decimalSeparator
                    )}
                    onChange={(e) => handleRateTextChange(currency.code, e.target.value)}
                    onBlur={() => handleRateTextBlur(currency.code)}
                  />
                  <span className="rate-suffix">{settings.currencySettings.defaultCurrency}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="secondary-btn" onClick={handleResetFallbackRates}>
            Reset to Default Rates
          </button>
        </section>

        {/* Data Management */}
        <section className="settings-section">
          <h2><MaterialIcon name="save" /> Data Management</h2>
          
          <div className="data-management-group">
            <div className="subsection-header-with-tooltip">
              <h3>Export All Data</h3>
              <Tooltip content="Back up all your financial data. JSON format exports everything in one file that's easy to re-import. Separate files give you CSV/JSON files for each tool, useful for spreadsheet analysis." position="right" maxWidth={350}>
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <p className="setting-help">Export all your data in a single file or as separate files</p>
            <div className="export-buttons">
              <button className="primary-btn" onClick={handleExportAllJSON}>
                <MaterialIcon name="download" /> Export as JSON (Single File)
              </button>
              <button className="secondary-btn" onClick={handleExportAll}>
                <MaterialIcon name="download" /> Export as Separate Files
              </button>
            </div>
          </div>

          <div className="data-management-group">
            <div className="subsection-header-with-tooltip">
              <h3>Import All Data</h3>
              <Tooltip content="Restore your data from a previously exported JSON file. All imported values will be automatically converted to your current default currency. This overwrites existing data." position="right" maxWidth={350}>
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <p className="setting-help">Import all data from a single JSON file. Data will be converted to your current currency.</p>
            <label className="primary-btn import-label">
              <MaterialIcon name="upload" /> Import All Data (JSON)
              <input type="file" accept=".json" onChange={handleImportAllJSON} hidden />
            </label>
          </div>

          <div className="data-management-group">
            <div className="subsection-header-with-tooltip">
              <h3>Import Individual Files</h3>
              <Tooltip content="Import data for specific tools from CSV or JSON files. Useful if you want to update only one tool's data or migrate from other applications." position="right" maxWidth={350}>
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <p className="setting-help">Import data from individual CSV/JSON files for each tool.</p>
            <div className="import-buttons">
              <label className="secondary-btn import-label">
                <MaterialIcon name="upload" /> Import FIRE Calculator
                <input type="file" accept=".csv" onChange={handleImportFire} hidden />
              </label>
              <label className="secondary-btn import-label">
                <MaterialIcon name="upload" /> Import Asset Allocation
                <input type="file" accept=".csv" onChange={handleImportAssets} hidden />
              </label>
              <label className="secondary-btn import-label">
                <MaterialIcon name="upload" /> Import Cashflow Tracker
                <input type="file" accept=".csv" onChange={handleImportCashflow} hidden />
              </label>
              <label className="secondary-btn import-label">
                <MaterialIcon name="upload" /> Import Net Worth Tracker
                <input type="file" accept=".json" onChange={handleImportNetWorth} hidden />
              </label>
            </div>
          </div>

          <div className="data-management-group">
            <div className="subsection-header-with-tooltip">
              <h3><MaterialIcon name="school" /> Guided Tour</h3>
              <Tooltip content="Take a step-by-step walkthrough of all Fire Tools features. The tour will show you how to use each tool and how they work together to help you achieve financial independence." position="right" maxWidth={350}>
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <p className="setting-help">Restart the guided tour to learn about Fire Tools features</p>
            <button className="secondary-btn" onClick={() => {
              clearTourPreference();
              window.location.href = '/';
            }}>
              <MaterialIcon name="refresh" /> Restart Tour
            </button>
          </div>

          <div className="data-management-group">
            <div className="subsection-header-with-tooltip">
              <h3><MaterialIcon name="inventory_2" /> Demo Data</h3>
              <Tooltip content="Load realistic sample data to explore all features of Fire Tools. Great for testing the app or learning how to use it. This will overwrite your current data, so export first if needed!" position="right" maxWidth={350}>
                <span className="info-icon" aria-label="More information">i</span>
              </Tooltip>
            </div>
            <p className="setting-help">Load sample data to explore the application</p>
            <button className="secondary-btn" onClick={handleLoadDemoData}>
              <MaterialIcon name="sports_esports" /> Load Demo Data
            </button>
          </div>

          <div className="data-management-group danger-zone">
            <h3><MaterialIcon name="warning" /> Danger Zone</h3>
            <p className="setting-help">This action cannot be undone</p>
            <button className="danger-btn" onClick={handleResetAll}>
              <MaterialIcon name="delete" /> Reset All Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
