/**
 * Bank and Financial Institution Types
 * Includes OpenBanking PSD2 API compatibility information
 */

/**
 * Institution types for categorizing financial institutions
 */
export const INSTITUTION_TYPES = ['BANK', 'BROKER', 'NEOBANK', 'CREDIT_UNION', 'BUILDING_SOCIETY'] as const;
export type InstitutionType = typeof INSTITUTION_TYPES[number];

/**
 * Bank/Financial Institution information
 */
export interface BankInfo {
  /** Unique identifier code for the bank (e.g., 'DE_DEUTSCHE_BANK') */
  code: string;
  /** Display name of the bank */
  name: string;
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  /** Whether the bank supports OpenBanking PSD2 APIs */
  supportsOpenBanking: boolean;
  /** BIC/SWIFT code (optional) */
  bic?: string;
  /** Type of institution */
  institutionType?: InstitutionType;
  /** URL for the bank's logo (optional) */
  logoUrl?: string;
}

/**
 * List of banks that support OpenBanking PSD2 APIs
 * Organized by country for EU compliance
 */
export const OPENBANKING_BANKS: BankInfo[] = [
  // Germany (DE)
  { code: 'DE_DEUTSCHE_BANK', name: 'Deutsche Bank', countryCode: 'DE', supportsOpenBanking: true, bic: 'DEUTDEFF', institutionType: 'BANK' },
  { code: 'DE_COMMERZBANK', name: 'Commerzbank', countryCode: 'DE', supportsOpenBanking: true, bic: 'COBADEFF', institutionType: 'BANK' },
  { code: 'DE_DKB', name: 'DKB (Deutsche Kreditbank)', countryCode: 'DE', supportsOpenBanking: true, bic: 'BYLADEM1', institutionType: 'BANK' },
  { code: 'DE_N26', name: 'N26', countryCode: 'DE', supportsOpenBanking: true, bic: 'NTSBDEB1', institutionType: 'NEOBANK' },
  { code: 'DE_ING', name: 'ING Germany', countryCode: 'DE', supportsOpenBanking: true, bic: 'INGDDEFF', institutionType: 'BANK' },
  { code: 'DE_COMDIRECT', name: 'Comdirect', countryCode: 'DE', supportsOpenBanking: true, bic: 'COBADEHDXXX', institutionType: 'BROKER' },
  { code: 'DE_SPARKASSE', name: 'Sparkasse', countryCode: 'DE', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'DE_VOLKSBANK', name: 'Volksbank', countryCode: 'DE', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'DE_TRADE_REPUBLIC', name: 'Trade Republic', countryCode: 'DE', supportsOpenBanking: true, institutionType: 'BROKER' },
  { code: 'DE_SCALABLE', name: 'Scalable Capital', countryCode: 'DE', supportsOpenBanking: false, institutionType: 'BROKER' },
  
  // France (FR)
  { code: 'FR_BNP_PARIBAS', name: 'BNP Paribas', countryCode: 'FR', supportsOpenBanking: true, bic: 'BNPAFRPP', institutionType: 'BANK' },
  { code: 'FR_SOCIETE_GENERALE', name: 'Société Générale', countryCode: 'FR', supportsOpenBanking: true, bic: 'SOGEFRPP', institutionType: 'BANK' },
  { code: 'FR_CREDIT_AGRICOLE', name: 'Crédit Agricole', countryCode: 'FR', supportsOpenBanking: true, bic: 'AGRIFRPP', institutionType: 'BANK' },
  { code: 'FR_BOURSORAMA', name: 'Boursorama', countryCode: 'FR', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  { code: 'FR_FORTUNEO', name: 'Fortuneo', countryCode: 'FR', supportsOpenBanking: true, institutionType: 'BROKER' },
  
  // Italy (IT)
  { code: 'IT_UNICREDIT', name: 'UniCredit', countryCode: 'IT', supportsOpenBanking: true, bic: 'UNCRITMM', institutionType: 'BANK' },
  { code: 'IT_INTESA', name: 'Intesa Sanpaolo', countryCode: 'IT', supportsOpenBanking: true, bic: 'BCITITMM', institutionType: 'BANK' },
  { code: 'IT_FINECO', name: 'FinecoBank', countryCode: 'IT', supportsOpenBanking: true, bic: 'FELOITMM', institutionType: 'BROKER' },
  { code: 'IT_ING', name: 'ING Italy', countryCode: 'IT', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'IT_BANCA_SELLA', name: 'Banca Sella', countryCode: 'IT', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'IT_ILLIMITY', name: 'Illimity Bank', countryCode: 'IT', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  
  // Spain (ES)
  { code: 'ES_SANTANDER', name: 'Banco Santander', countryCode: 'ES', supportsOpenBanking: true, bic: 'BSCHESMM', institutionType: 'BANK' },
  { code: 'ES_BBVA', name: 'BBVA', countryCode: 'ES', supportsOpenBanking: true, bic: 'BBVAESMM', institutionType: 'BANK' },
  { code: 'ES_CAIXABANK', name: 'CaixaBank', countryCode: 'ES', supportsOpenBanking: true, bic: 'CAIXESBB', institutionType: 'BANK' },
  { code: 'ES_BANKINTER', name: 'Bankinter', countryCode: 'ES', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'ES_OPENBANK', name: 'Openbank', countryCode: 'ES', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  
  // Netherlands (NL)
  { code: 'NL_ING', name: 'ING', countryCode: 'NL', supportsOpenBanking: true, bic: 'INGBNL2A', institutionType: 'BANK' },
  { code: 'NL_ABN_AMRO', name: 'ABN AMRO', countryCode: 'NL', supportsOpenBanking: true, bic: 'ABNANL2A', institutionType: 'BANK' },
  { code: 'NL_RABOBANK', name: 'Rabobank', countryCode: 'NL', supportsOpenBanking: true, bic: 'RABONL2U', institutionType: 'BANK' },
  { code: 'NL_DEGIRO', name: 'DEGIRO', countryCode: 'NL', supportsOpenBanking: false, institutionType: 'BROKER' },
  { code: 'NL_BUNQ', name: 'bunq', countryCode: 'NL', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  
  // Ireland (IE)
  { code: 'IE_BANK_OF_IRELAND', name: 'Bank of Ireland', countryCode: 'IE', supportsOpenBanking: true, bic: 'BOFIIE2D', institutionType: 'BANK' },
  { code: 'IE_AIB', name: 'Allied Irish Banks', countryCode: 'IE', supportsOpenBanking: true, bic: 'AABORBIE', institutionType: 'BANK' },
  { code: 'IE_PERMANENT_TSB', name: 'Permanent TSB', countryCode: 'IE', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'IE_REVOLUT', name: 'Revolut', countryCode: 'IE', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  
  // Belgium (BE)
  { code: 'BE_KBC', name: 'KBC', countryCode: 'BE', supportsOpenBanking: true, bic: 'KREDBEBB', institutionType: 'BANK' },
  { code: 'BE_BNP_FORTIS', name: 'BNP Paribas Fortis', countryCode: 'BE', supportsOpenBanking: true, bic: 'GEBABEBB', institutionType: 'BANK' },
  { code: 'BE_ING', name: 'ING Belgium', countryCode: 'BE', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'BE_BELFIUS', name: 'Belfius', countryCode: 'BE', supportsOpenBanking: true, institutionType: 'BANK' },
  
  // Austria (AT)
  { code: 'AT_ERSTE', name: 'Erste Bank', countryCode: 'AT', supportsOpenBanking: true, bic: 'GIBAATWW', institutionType: 'BANK' },
  { code: 'AT_RAIFFEISEN', name: 'Raiffeisen Bank', countryCode: 'AT', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'AT_BAWAG', name: 'BAWAG P.S.K.', countryCode: 'AT', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'AT_FLATEX', name: 'Flatex', countryCode: 'AT', supportsOpenBanking: false, institutionType: 'BROKER' },
  
  // Portugal (PT)
  { code: 'PT_CGD', name: 'Caixa Geral de Depósitos', countryCode: 'PT', supportsOpenBanking: true, bic: 'CGDIPTPL', institutionType: 'BANK' },
  { code: 'PT_BCP', name: 'Millennium BCP', countryCode: 'PT', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'PT_NOVO_BANCO', name: 'Novo Banco', countryCode: 'PT', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'PT_ACTIVOBANK', name: 'ActivoBank', countryCode: 'PT', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  
  // Poland (PL)
  { code: 'PL_PKO', name: 'PKO Bank Polski', countryCode: 'PL', supportsOpenBanking: true, bic: 'BPKOPLPW', institutionType: 'BANK' },
  { code: 'PL_MBANK', name: 'mBank', countryCode: 'PL', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'PL_ING', name: 'ING Bank Śląski', countryCode: 'PL', supportsOpenBanking: true, institutionType: 'BANK' },
  
  // Sweden (SE)
  { code: 'SE_SEB', name: 'SEB', countryCode: 'SE', supportsOpenBanking: true, bic: 'ESSESESS', institutionType: 'BANK' },
  { code: 'SE_NORDEA', name: 'Nordea Sweden', countryCode: 'SE', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'SE_HANDELSBANKEN', name: 'Handelsbanken', countryCode: 'SE', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'SE_AVANZA', name: 'Avanza', countryCode: 'SE', supportsOpenBanking: true, institutionType: 'BROKER' },
  
  // Finland (FI)
  { code: 'FI_NORDEA', name: 'Nordea Finland', countryCode: 'FI', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'FI_OP', name: 'OP Financial Group', countryCode: 'FI', supportsOpenBanking: true, institutionType: 'BANK' },
  
  // Denmark (DK)
  { code: 'DK_DANSKE_BANK', name: 'Danske Bank', countryCode: 'DK', supportsOpenBanking: true, bic: 'DABADKKK', institutionType: 'BANK' },
  { code: 'DK_NORDEA', name: 'Nordea Denmark', countryCode: 'DK', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'DK_SAXO', name: 'Saxo Bank', countryCode: 'DK', supportsOpenBanking: true, institutionType: 'BROKER' },
  
  // Luxembourg (LU)
  { code: 'LU_BGL_BNP', name: 'BGL BNP Paribas', countryCode: 'LU', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'LU_SPUERKEESS', name: 'Spuerkeess', countryCode: 'LU', supportsOpenBanking: true, institutionType: 'BANK' },
  
  // United Kingdom (GB) - Still supports OpenBanking
  { code: 'GB_BARCLAYS', name: 'Barclays', countryCode: 'GB', supportsOpenBanking: true, bic: 'BARCGB22', institutionType: 'BANK' },
  { code: 'GB_HSBC', name: 'HSBC UK', countryCode: 'GB', supportsOpenBanking: true, bic: 'MIDLGB22', institutionType: 'BANK' },
  { code: 'GB_LLOYDS', name: 'Lloyds Bank', countryCode: 'GB', supportsOpenBanking: true, bic: 'LOYDGB2L', institutionType: 'BANK' },
  { code: 'GB_NATWEST', name: 'NatWest', countryCode: 'GB', supportsOpenBanking: true, institutionType: 'BANK' },
  { code: 'GB_MONZO', name: 'Monzo', countryCode: 'GB', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  { code: 'GB_STARLING', name: 'Starling Bank', countryCode: 'GB', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  { code: 'GB_WISE', name: 'Wise', countryCode: 'GB', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  { code: 'GB_INTERACTIVE_BROKERS', name: 'Interactive Brokers UK', countryCode: 'GB', supportsOpenBanking: false, institutionType: 'BROKER' },
  { code: 'GB_HARGREAVES', name: 'Hargreaves Lansdown', countryCode: 'GB', supportsOpenBanking: false, institutionType: 'BROKER' },
  
  // Switzerland (CH) - Limited OpenBanking
  { code: 'CH_UBS', name: 'UBS', countryCode: 'CH', supportsOpenBanking: false, bic: 'UBSWCHZH', institutionType: 'BANK' },
  { code: 'CH_SWISSQUOTE', name: 'Swissquote', countryCode: 'CH', supportsOpenBanking: false, institutionType: 'BROKER' },
  
  // United States (US) - No PSD2, limited OpenBanking
  { code: 'US_CHASE', name: 'JPMorgan Chase', countryCode: 'US', supportsOpenBanking: false, bic: 'CHASUS33', institutionType: 'BANK' },
  { code: 'US_BANK_OF_AMERICA', name: 'Bank of America', countryCode: 'US', supportsOpenBanking: false, bic: 'BOFAUS3N', institutionType: 'BANK' },
  { code: 'US_WELLS_FARGO', name: 'Wells Fargo', countryCode: 'US', supportsOpenBanking: false, institutionType: 'BANK' },
  { code: 'US_FIDELITY', name: 'Fidelity', countryCode: 'US', supportsOpenBanking: false, institutionType: 'BROKER' },
  { code: 'US_CHARLES_SCHWAB', name: 'Charles Schwab', countryCode: 'US', supportsOpenBanking: false, institutionType: 'BROKER' },
  { code: 'US_VANGUARD', name: 'Vanguard', countryCode: 'US', supportsOpenBanking: false, institutionType: 'BROKER' },
  { code: 'US_INTERACTIVE_BROKERS', name: 'Interactive Brokers', countryCode: 'US', supportsOpenBanking: false, institutionType: 'BROKER' },
  
  // Pan-European (headquartered in one country but operating across EU)
  { code: 'LT_REVOLUT', name: 'Revolut', countryCode: 'LT', supportsOpenBanking: true, institutionType: 'NEOBANK' },
  { code: 'BE_WISE', name: 'Wise (TransferWise)', countryCode: 'BE', supportsOpenBanking: true, institutionType: 'NEOBANK' },
];

/**
 * Get banks available for a specific country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of banks for that country
 */
export function getBanksByCountry(countryCode: string): BankInfo[] {
  const upperCode = countryCode.toUpperCase();
  return OPENBANKING_BANKS.filter(bank => bank.countryCode === upperCode);
}

/**
 * Get bank info by its unique code
 * @param code - Bank code (e.g., 'DE_DEUTSCHE_BANK')
 * @returns BankInfo or undefined if not found
 */
export function getBankByCode(code: string): BankInfo | undefined {
  return OPENBANKING_BANKS.find(bank => bank.code === code);
}

/**
 * Check if a bank supports OpenBanking PSD2 APIs
 * @param bankCode - Bank code
 * @returns true if the bank supports OpenBanking
 */
export function isOpenBankingSupported(bankCode: string): boolean {
  const bank = getBankByCode(bankCode);
  return bank?.supportsOpenBanking ?? false;
}

/**
 * Get all banks that support OpenBanking for a specific country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Array of banks that support OpenBanking
 */
export function getOpenBankingBanksByCountry(countryCode: string): BankInfo[] {
  return getBanksByCountry(countryCode).filter(bank => bank.supportsOpenBanking);
}

/**
 * Get all available institution types as display options
 * @returns Array of { value, label } for select dropdowns
 */
export function getInstitutionTypeOptions(): Array<{ value: InstitutionType; label: string }> {
  return [
    { value: 'BANK', label: 'Bank' },
    { value: 'BROKER', label: 'Broker' },
    { value: 'NEOBANK', label: 'Neobank/Digital Bank' },
    { value: 'CREDIT_UNION', label: 'Credit Union' },
    { value: 'BUILDING_SOCIETY', label: 'Building Society' },
  ];
}
