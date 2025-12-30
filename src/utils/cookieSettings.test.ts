import { describe, expect, it, beforeEach } from 'vitest';
import {
  saveSettings,
  loadSettings,
  clearSettings,
  DEFAULT_SETTINGS,
  type UserSettings,
} from './cookieSettings';

// Mock document.cookie
const cookieMock = (() => {
  let cookies: Record<string, string> = {};

  return {
    get: () => {
      return Object.entries(cookies)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    },
    set: (value: string) => {
      // Parse cookie string like "key=value; path=/; max-age=..."
      const [cookiePair] = value.split(';');
      const [key, val] = cookiePair.split('=');
      if (key && val !== undefined) {
        if (val === '' || value.includes('max-age=0') || value.includes('expires=Thu, 01 Jan 1970')) {
          // Cookie deletion
          delete cookies[key.trim()];
        } else {
          cookies[key.trim()] = val.trim();
        }
      }
    },
    clear: () => {
      cookies = {};
    },
  };
})();

// Mock document.cookie getter/setter
Object.defineProperty(document, 'cookie', {
  get: () => cookieMock.get(),
  set: (value: string) => cookieMock.set(value),
  configurable: true,
});

describe('Cookie Settings utilities', () => {
  beforeEach(() => {
    cookieMock.clear();
  });

  describe('saveSettings', () => {
    it('should save settings to cookies', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        accountName: 'Test Account',
      };
      
      saveSettings(settings);
      
      const cookieValue = document.cookie;
      expect(cookieValue).toContain('fire-calculator-settings');
    });

    it('should save decimal separator preference', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        decimalSeparator: ',',
      };
      
      saveSettings(settings);
      const loaded = loadSettings();
      
      expect(loaded.decimalSeparator).toBe(',');
    });

    it('should save currency settings', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        currencySettings: {
          defaultCurrency: 'EUR',
          fallbackRates: { EUR: 1, USD: 0.90 },
          useApiRates: false,
          lastApiUpdate: null,
        },
      };
      
      saveSettings(settings);
      const loaded = loadSettings();
      
      expect(loaded.currencySettings.fallbackRates.USD).toBe(0.90);
    });

    it('should encrypt data in cookies', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        accountName: 'My Secret Portfolio',
      };
      
      saveSettings(settings);
      const cookieValue = document.cookie;
      
      // Cookie should not contain plaintext sensitive data
      expect(cookieValue).not.toContain('My Secret Portfolio');
    });
  });

  describe('loadSettings', () => {
    it('should return DEFAULT_SETTINGS when no settings saved', () => {
      const loaded = loadSettings();
      
      expect(loaded).toEqual(DEFAULT_SETTINGS);
    });

    it('should load saved settings', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        accountName: 'My Portfolio',
        decimalSeparator: ',',
      };
      
      saveSettings(settings);
      const loaded = loadSettings();
      
      expect(loaded.accountName).toBe('My Portfolio');
      expect(loaded.decimalSeparator).toBe(',');
    });

    it('should handle corrupted data gracefully', () => {
      document.cookie = 'fire-calculator-settings=invalid-encrypted-data';
      
      const loaded = loadSettings();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge with defaults to ensure all fields exist', () => {
      // Create settings with all required fields
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        accountName: 'Partial Account',
      };
      saveSettings(settings);
      
      const loaded = loadSettings();
      expect(loaded.accountName).toBe('Partial Account');
      expect(loaded.decimalSeparator).toBe(DEFAULT_SETTINGS.decimalSeparator);
      expect(loaded.currencySettings).toEqual(DEFAULT_SETTINGS.currencySettings);
    });
  });

  describe('clearSettings', () => {
    it('should clear settings from cookies', () => {
      const settings: UserSettings = {
        ...DEFAULT_SETTINGS,
        accountName: 'Test',
      };
      
      saveSettings(settings);
      const cookieBefore = document.cookie;
      expect(cookieBefore).toContain('fire-calculator-settings');
      
      clearSettings();
      
      const loaded = loadSettings();
      expect(loaded).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_SETTINGS.accountName).toBe('My Portfolio');
      expect(DEFAULT_SETTINGS.decimalSeparator).toBe('.');
      expect(DEFAULT_SETTINGS.currencySettings.defaultCurrency).toBe('EUR');
      expect(DEFAULT_SETTINGS.currencySettings.useApiRates).toBe(true);
    });

    it('should have all fallback rates defined', () => {
      const { fallbackRates } = DEFAULT_SETTINGS.currencySettings;
      
      expect(fallbackRates.EUR).toBe(1);
      expect(fallbackRates.USD).toBe(0.85);
      expect(fallbackRates.GBP).toBe(1.15);
      expect(fallbackRates.CHF).toBe(1.08);
      expect(fallbackRates.JPY).toBe(0.0054);
      expect(fallbackRates.AUD).toBe(0.57);
      expect(fallbackRates.CAD).toBe(0.62);
    });
  });
});
