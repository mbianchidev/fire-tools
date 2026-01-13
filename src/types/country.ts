/**
 * Country Types and Constants
 * Includes EU countries and UCITS-compliant ISIN prefixes
 */

export interface CountryInfo {
  code: string;
  name: string;
  isEU: boolean;
  flag: string; // Emoji flag
}

// List of EU countries with their ISO 3166-1 alpha-2 codes
export const EU_COUNTRIES: CountryInfo[] = [
  { code: 'AT', name: 'Austria', isEU: true, flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', isEU: true, flag: '🇧🇪' },
  { code: 'BG', name: 'Bulgaria', isEU: true, flag: '🇧🇬' },
  { code: 'HR', name: 'Croatia', isEU: true, flag: '🇭🇷' },
  { code: 'CY', name: 'Cyprus', isEU: true, flag: '🇨🇾' },
  { code: 'CZ', name: 'Czechia', isEU: true, flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', isEU: true, flag: '🇩🇰' },
  { code: 'EE', name: 'Estonia', isEU: true, flag: '🇪🇪' },
  { code: 'FI', name: 'Finland', isEU: true, flag: '🇫🇮' },
  { code: 'FR', name: 'France', isEU: true, flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', isEU: true, flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', isEU: true, flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary', isEU: true, flag: '🇭🇺' },
  { code: 'IE', name: 'Ireland', isEU: true, flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', isEU: true, flag: '🇮🇹' },
  { code: 'LV', name: 'Latvia', isEU: true, flag: '🇱🇻' },
  { code: 'LT', name: 'Lithuania', isEU: true, flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', isEU: true, flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', isEU: true, flag: '🇲🇹' },
  { code: 'NL', name: 'Netherlands', isEU: true, flag: '🇳🇱' },
  { code: 'PL', name: 'Poland', isEU: true, flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', isEU: true, flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', isEU: true, flag: '🇷🇴' },
  { code: 'SK', name: 'Slovakia', isEU: true, flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', isEU: true, flag: '🇸🇮' },
  { code: 'ES', name: 'Spain', isEU: true, flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', isEU: true, flag: '🇸🇪' },
];

// Non-EU countries commonly used in the app
export const OTHER_COUNTRIES: CountryInfo[] = [
  { code: 'US', name: 'United States', isEU: false, flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', isEU: false, flag: '🇬🇧' },
  { code: 'CH', name: 'Switzerland', isEU: false, flag: '🇨🇭' },
  { code: 'JP', name: 'Japan', isEU: false, flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', isEU: false, flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', isEU: false, flag: '🇨🇦' },
  { code: 'NO', name: 'Norway', isEU: false, flag: '🇳🇴' },
  { code: 'NZ', name: 'New Zealand', isEU: false, flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', isEU: false, flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', isEU: false, flag: '🇭🇰' },
];

// All countries sorted alphabetically
export const ALL_COUNTRIES: CountryInfo[] = [...EU_COUNTRIES, ...OTHER_COUNTRIES].sort((a, b) => 
  a.name.localeCompare(b.name)
);

// UCITS-compliant ISIN prefixes (domiciled in EU/EEA)
// These are the country codes where ETFs are typically domiciled for EU investors
export const UCITS_ISIN_PREFIXES = ['IE', 'LU', 'DE', 'FR', 'NL', 'AT', 'BE', 'FI', 'SE', 'DK', 'IT', 'ES', 'PT'];

/**
 * Check if a country is in the EU
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns true if the country is in the EU
 */
export function isEUCountry(countryCode: string): boolean {
  return EU_COUNTRIES.some(c => c.code === countryCode);
}

/**
 * Check if an ISIN is from a UCITS-compliant domicile
 * @param isin - The ISIN code to check
 * @returns true if the ISIN starts with a UCITS-compliant prefix
 */
export function isUCITSCompliant(isin: string): boolean {
  if (!isin || isin.length < 2) return false;
  const prefix = isin.substring(0, 2).toUpperCase();
  return UCITS_ISIN_PREFIXES.includes(prefix);
}

/**
 * Get a warning message if an EU user enters a non-UCITS ETF
 * @param isin - The ISIN code
 * @param countryCode - The user's country code
 * @returns Warning message or null if no warning needed
 */
export function getUCITSWarning(isin: string, countryCode?: string): string | null {
  if (!countryCode || !isEUCountry(countryCode)) {
    return null;
  }
  
  if (!isin || isin.length < 2) {
    return null;
  }
  
  if (!isUCITSCompliant(isin)) {
    const prefix = isin.substring(0, 2).toUpperCase();
    return `This ETF (${prefix}) may not be UCITS-compliant. EU investors typically cannot purchase non-UCITS ETFs. Consider finding a UCITS equivalent (ISIN starting with IE, LU, DE, FR, etc.).`;
  }
  
  return null;
}

/**
 * Get country info by code
 * @param code - ISO 3166-1 alpha-2 country code
 * @returns CountryInfo or undefined if not found
 */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return ALL_COUNTRIES.find(c => c.code === code);
}
